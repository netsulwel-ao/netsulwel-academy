"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Search, ArrowUpDown, Loader2, GraduationCap, Mail, Calendar, BookOpen, UserCheck, X } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  enrolledCourses?: string[];
  photoURL?: string;
  teacherCourseIds?: string[];
}

export default function AdminStudentsPage() {
  const { isAdmin, isTeacher, user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [filtered, setFiltered] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "recent">("recent");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [courseMap, setCourseMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        if (isTeacher && user?.uid) {
          // 1. Cursos do teacher
          const coursesSnap = await getDocs(
            query(collection(db, "courses"), where("createdBy", "==", user.uid))
          );
          const myCourses = coursesSnap.docs.map(d => ({
            id: d.id,
            title: d.data().title as string,
          }));
          const myCourseIds = myCourses.map(c => c.id);
          const myCourseIdSet = new Set(myCourseIds);
          const map: Record<string, string> = {};
          myCourses.forEach(c => { map[c.id] = c.title; });
          setCourseMap(map);

          if (myCourseIds.length === 0) {
            setStudents([]);
            setFiltered([]);
            setLoading(false);
            return;
          }

          // 2. Vendas confirmadas dos cursos do teacher
          const salesSnap = await getDocs(
            query(
              collection(db, "sales"),
              where("itemId", "in", myCourseIds.slice(0, 30)),
              where("status", "==", "confirmed")
            )
          );

          // userId → Set de courseIds comprados
          const purchaseMap: Record<string, Set<string>> = {};
          salesSnap.docs.forEach(d => {
            const { userId, itemId } = d.data() as { userId: string; itemId: string };
            if (!purchaseMap[userId]) purchaseMap[userId] = new Set();
            purchaseMap[userId].add(itemId);
          });

          // 3. Todos os alunos e filtrar os que têm acesso
          const allStudentsSnap = await getDocs(
            query(collection(db, "users"), where("role", "==", "aluno"))
          );

          const studentList: Student[] = [];

          allStudentsSnap.docs.forEach(d => {
            const data = d.data();
            const uid = d.id;
            const enrolledCourses: string[] = data.enrolledCourses ?? [];

            // Compras diretas confirmadas
            const purchased = purchaseMap[uid]
              ? [...purchaseMap[uid]].filter(id => myCourseIdSet.has(id))
              : [];

            // enrolledCourses já processados (compras anteriores)
            const byEnrolled = enrolledCourses.filter(id => myCourseIdSet.has(id));

            const allAccess = new Set([...purchased, ...byEnrolled]);
            if (allAccess.size === 0) return;

            studentList.push({
              id: uid,
              name: data.name || "Sem nome",
              email: data.email || "",
              role: data.role || "aluno",
              createdAt: (data.createdAt as Timestamp)?.toDate?.() ?? new Date(data.createdAt as string),
              enrolledCourses,
              teacherCourseIds: [...allAccess],
            });
          });

          setStudents(studentList);
          setFiltered(studentList);
        } else {
          // Admin vê todos os alunos
          const snap = await getDocs(
            query(collection(db, "users"), where("role", "==", "aluno"))
          );
          const list: Student[] = snap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name || "Sem nome",
              email: data.email || "",
              role: data.role || "aluno",
              createdAt: (data.createdAt as Timestamp)?.toDate?.() ?? new Date(data.createdAt as string),
              enrolledCourses: data.enrolledCourses,
            };
          });
          setStudents(list);
          setFiltered(list);
        }
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar alunos.");
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [isTeacher, user?.uid]);

  useEffect(() => {
    let result = [...students];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
    }
    if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    setFiltered(result);
  }, [search, sortBy, students]);

  const handlePromoteToTeacher = async (student: Student) => {
    try {
      await updateDoc(doc(db, "users", student.id), { role: "teacher" });
      setStudents(prev => prev.filter(s => s.id !== student.id));
      setSelectedStudent(null);
      toast.success(`${student.name} promovido a Professor.`);
    } catch {
      toast.error("Erro ao promover.");
    }
  };

  return (
    <div className="max-w-[100rem] mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {isTeacher ? "Os Meus Alunos" : "Alunos"}
          </h1>
          <p className="mt-2 text-gray-400">
            {isTeacher
              ? "Alunos com acesso aos teus cursos — por compra direta ou via plano."
              : "Gerir alunos inscritos na plataforma."}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <GraduationCap className="h-5 w-5 text-blue-400" />
          <span className="font-bold text-white">{students.length}</span> alunos
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text" placeholder="Pesquisar aluno..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple"
          />
        </div>
        <button
          onClick={() => setSortBy(sortBy === "recent" ? "name" : "recent")}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 border border-gray-800 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowUpDown className="h-4 w-4" />
          {sortBy === "recent" ? "Nome" : "Recentes"}
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20" role="status" aria-live="polite">
            <Loader2 className="h-8 w-8 animate-spin text-purple" />
            <span className="sr-only">A carregar alunos...</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title={search ? "Nenhum aluno encontrado" : isTeacher ? "Ainda não tens alunos" : "Ainda não há alunos"}
            description={
              search
                ? "Tenta pesquisar por outro termo."
                : isTeacher
                ?               "Os alunos aparecem aqui quando comprarem os teus cursos."
                : "Os alunos aparecerão aqui depois de se registarem na plataforma."
            }
            compact
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <caption className="sr-only">Lista de alunos</caption>
              <thead>
                <tr className="border-b border-gray-800 text-left text-sm uppercase tracking-wider text-gray-500">
                  <th scope="col" className="py-4 px-6 font-medium">Aluno</th>
                  <th scope="col" className="py-4 px-6 font-medium">Email</th>
                  <th scope="col" className="py-4 px-6 font-medium">Registado</th>
                  <th scope="col" className="py-4 px-6 font-medium">{isTeacher ? "Meus Cursos" : "Cursos"}</th>
                  {isAdmin && <th scope="col" className="py-4 px-6 font-medium">Acções</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map(student => (
                  <tr
                    key={student.id}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{student.name}</p>
                          <p className="text-sm text-gray-500 font-mono">{student.id.slice(0, 12)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-400">{student.email}</td>
                    <td className="py-4 px-6 text-sm text-gray-400">
                      {student.createdAt.toLocaleDateString("pt-PT")}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-400">
                      {isTeacher ? (student.teacherCourseIds?.length ?? 0) : (student.enrolledCourses?.length ?? 0)}
                    </td>
                    {isAdmin && (
                      <td className="py-4 px-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="px-3 py-1.5 text-sm font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                          >
                            Detalhes
                          </button>
                          <button
                            onClick={() => handlePromoteToTeacher(student)}
                            className="px-3 py-1.5 text-sm font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                          >
                            <GraduationCap className="h-3 w-3 inline mr-1" />Professor
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black" onClick={() => setSelectedStudent(null)} />
          <div className="relative w-96 bg-gray-900 border-l border-gray-800 p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-white">Detalhes do Aluno</h3>
              <button onClick={() => setSelectedStudent(null)} className="text-gray-500 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col items-center mb-8">
              <div className="h-20 w-20 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-2xl mb-4">
                {selectedStudent.name.charAt(0).toUpperCase()}
              </div>
              <h4 className="text-xl font-bold text-white">{selectedStudent.name}</h4>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="text-gray-300 break-all">{selectedStudent.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="text-gray-300">Registado a {selectedStudent.createdAt.toLocaleDateString("pt-PT")}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="text-gray-300">
                  {isTeacher
                    ? `${selectedStudent.teacherCourseIds?.length ?? 0} dos teus cursos`
                    : `${selectedStudent.enrolledCourses?.length ?? 0} cursos inscritos`}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <UserCheck className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="text-gray-300 font-mono text-sm break-all">ID: {selectedStudent.id}</span>
              </div>
            </div>

            {/* Lista de cursos do teacher que o aluno tem */}
            {isTeacher && selectedStudent.teacherCourseIds && selectedStudent.teacherCourseIds.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-800">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Cursos com acesso</p>
                <div className="space-y-2">
                  {selectedStudent.teacherCourseIds.map(cid => (
                    <div key={cid} className="flex items-center gap-2 bg-gray-800 px-3 py-2 text-sm text-gray-300">
                      <BookOpen className="h-3.5 w-3.5 text-purple shrink-0" />
                      {courseMap[cid] ?? cid}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="mt-8 pt-6 border-t border-gray-800">
                <button
                  onClick={() => handlePromoteToTeacher(selectedStudent)}
                  className="w-full py-3 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                >
                  Promover a Professor
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
