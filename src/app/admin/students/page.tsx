"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Search, ArrowUpDown, Loader2, GraduationCap, Shield, X, Mail, Calendar, BookOpen, UserCheck, Award } from "lucide-react";
import Link from "next/link";

interface Student {
  id: string;
  name: string;
  email: string;
  role: string;
  plan?: string;
  createdAt: Date;
  enrolledCourses?: string[];
  photoURL?: string;
}

export default function AdminStudentsPage() {
  const { isAdmin, isTeacher, user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [filtered, setFiltered] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "recent">("recent");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        let courseIds: string[] = [];
        if (isTeacher && user?.uid) {
          const coursesSnap = await getDocs(query(collection(db, "courses"), where("createdBy", "==", user.uid)));
          courseIds = coursesSnap.docs.map(d => d.id);
        }
        const q = query(collection(db, "users"), where("role", "==", "aluno"));
        const snap = await getDocs(q);
        let list: Student[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || "Sem nome",
            email: data.email || "",
            role: data.role || "aluno",
            plan: data.plan || "free",
            createdAt: (data.createdAt as Timestamp)?.toDate?.() ?? new Date(data.createdAt as string),
            enrolledCourses: data.enrolledCourses,
            photoURL: data.photoURL,
          };
        });
        if (isTeacher && courseIds.length > 0) {
          const courseIdSet = new Set(courseIds);
          list = list.filter(s => s.enrolledCourses?.some(cid => courseIdSet.has(cid)));
        }
        setStudents(list);
        setFiltered(list);
      } catch (err) {
        console.error(err);
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
      result = result.filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
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
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
      setSelectedStudent(null);
      showToast("success", `${student.name} promovido a Professor.`);
    } catch {
      showToast("error", "Erro ao promover.");
    }
  };

  const planBadge = (plan?: string) => {
    const colors: Record<string, string> = {
      free: "bg-gray-500/10 text-gray-400",
      smart: "bg-blue-500/10 text-blue-400",
      golden: "bg-amber-500/10 text-amber-400",
    };
    return colors[plan || "free"] || colors.free;
  };

  return (
    <div className="max-w-[100rem] mx-auto space-y-6 animate-in fade-in duration-500">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 text-sm font-medium ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Alunos</h1>
          <p className="mt-2 text-gray-400">Gerir alunos inscritos na plataforma.</p>
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
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#13131f] border border-[#1e1e30] py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple"
          />
        </div>
        <button onClick={() => setSortBy(sortBy === "recent" ? "name" : "recent")}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#13131f] border border-[#1e1e30] text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowUpDown className="h-4 w-4" />
          {sortBy === "recent" ? "Nome" : "Recentes"}
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#13131f] border border-[#1e1e30] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <GraduationCap className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">{search ? "Nenhum aluno encontrado." : "Ainda não há alunos."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e30] text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="py-4 px-6 font-medium">Aluno</th>
                  <th className="py-4 px-6 font-medium">Email</th>
                  <th className="py-4 px-6 font-medium">Plano</th>
                  <th className="py-4 px-6 font-medium">Registado</th>
                  <th className="py-4 px-6 font-medium">Cursos</th>
                  {isAdmin && <th className="py-4 px-6 font-medium">Acções</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e30]">
                {filtered.map((student) => (
                  <tr key={student.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{student.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{student.id.slice(0, 12)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-400">{student.email}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 text-xs font-medium ${planBadge(student.plan)}`}>
                        {student.plan || "free"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-400">{student.createdAt.toLocaleDateString("pt-PT")}</td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-400">{student.enrolledCourses?.length || 0}</span>
                    </td>
                    {isAdmin && (
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSelectedStudent(student)}
                            className="px-3 py-1.5 text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                            Detalhes
                          </button>
                          <button onClick={() => handlePromoteToTeacher(student)}
                            className="px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
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
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedStudent(null)} />
          <div className="relative w-96 bg-[#13131f] border-l border-[#1e1e30] p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-white">Detalhes</h3>
              <button onClick={() => setSelectedStudent(null)} className="text-gray-500 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col items-center mb-8">
              <div className="h-20 w-20 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-2xl mb-4">
                {selectedStudent.name.charAt(0).toUpperCase()}
              </div>
              <h4 className="text-xl font-bold text-white">{selectedStudent.name}</h4>
              <span className={`mt-2 px-3 py-1 text-xs font-medium ${planBadge(selectedStudent.plan)}`}>
                {selectedStudent.plan || "free"}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-gray-300">{selectedStudent.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-300">Registado a {selectedStudent.createdAt.toLocaleDateString("pt-PT")}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="h-4 w-4 text-gray-500" />
                <span className="text-gray-300">{selectedStudent.enrolledCourses?.length || 0} cursos inscritos</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Award className="h-4 w-4 text-gray-500" />
                <span className="text-gray-300">Plano {selectedStudent.plan || "free"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <UserCheck className="h-4 w-4 text-gray-500" />
                <span className="text-gray-300">ID: {selectedStudent.id}</span>
              </div>
            </div>

            {isAdmin && (
              <div className="mt-8 pt-6 border-t border-[#1e1e30]">
                <button onClick={() => { handlePromoteToTeacher(selectedStudent); }}
                  className="w-full py-3 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
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
