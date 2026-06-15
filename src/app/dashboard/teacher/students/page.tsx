"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, getDoc, doc } from "firebase/firestore";
import { Users, BookOpen, Loader2, Mail, Search, X, GraduationCap, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Course } from "@/types/course";

interface Sale {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  courseId?: string;
  itemTitle?: string;
  createdAt?: { toDate: () => Date };
}

export default function TeacherStudentsPage() {
  const { user, isTeacher } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user || !isTeacher) return;
    const load = async () => {
      try {
        const coursesSnap = await getDocs(query(collection(db, "courses"), where("createdBy", "==", user.uid)));
        const teacherCourses = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Course));
        setCourses(teacherCourses);
        const teacherCourseIds = teacherCourses.map(c => c.id).filter(Boolean) as string[];

        const salesSnap = await getDocs(query(collection(db, "sales"), where("sellerId", "==", user.uid), where("status", "==", "confirmed"), orderBy("createdAt", "desc")));
        const confirmedSales = salesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Sale));

        // Also find users enrolled in this teacher's courses via enrolledCourses array
        let enrolledUsers: { userId: string; userName: string; userEmail: string; itemTitle: string }[] = [];
        if (teacherCourseIds.length > 0) {
          const usersSnap = await getDocs(query(collection(db, "users"), where("enrolledCourses", "array-contains-any", teacherCourseIds)));
          usersSnap.forEach(d => {
            const data = d.data();
            const enrolled: string[] = data.enrolledCourses || [];
            teacherCourseIds.forEach(cId => {
              if (enrolled.includes(cId)) {
                const course = teacherCourses.find(c => c.id === cId);
                enrolledUsers.push({
                  userId: d.id,
                  userName: data.displayName || data.email || "Aluno",
                  userEmail: data.email || "",
                  itemTitle: course?.title || "Curso",
                });
              }
            });
          });
        }

        // Merge sales + enrolled users
        setSales([...confirmedSales, ...enrolledUsers.map(u => ({
          id: u.userId + u.itemTitle,
          userId: u.userId,
          userName: u.userName,
          userEmail: u.userEmail,
          itemTitle: u.itemTitle,
        } as Sale))]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, isTeacher]);

  // Group sales/enrolled by user
  const studentMap = new Map<string, { name: string; email: string; courses: string[] }>();
  sales.forEach(s => {
    const id = s.userId;
    if (!studentMap.has(id)) {
      studentMap.set(id, { name: s.userName || "Aluno", email: s.userEmail || "", courses: [] });
    }
    const entry = studentMap.get(id)!;
    if (s.itemTitle && !entry.courses.includes(s.itemTitle)) {
      entry.courses.push(s.itemTitle);
    }
  });

  const students = Array.from(studentMap.entries()).map(([id, data]) => ({ id, ...data }));
  const filtered = search.trim()
    ? students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()))
    : students;

  const totalEnrollments = sales.length;

  if (!isTeacher) {
    return <div className="text-center py-20"><p className="text-gray-400">Acesso não autorizado.</p></div>;
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Alunos</h1>
        <p className="mt-1 text-gray-400">{students.length} aluno{students.length !== 1 ? "s" : ""} • {totalEnrollments} inscri{totalEnrollments !== 1 ? "ções" : "ção"}</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Pesquisar aluno..."
          className="w-full bg-gray-900 border border-gray-800 focus:border-green-500/50 py-2.5 pl-10 pr-9 text-white placeholder-gray-600 text-sm focus:outline-none transition-all" />
        {search && (
          <button onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-green-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/40 border border-gray-800">
          <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">{search ? "Nenhum aluno encontrado." : "Ainda não tens alunos."}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((student) => (
            <div key={student.id} className="bg-gray-900/40 border border-gray-800 p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-green-300">{student.name[0]?.toUpperCase() || "?"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate">{student.name}</h3>
                <p className="text-sm text-gray-500 truncate">{student.email || "Sem email"}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {student.courses.slice(0, 3).map((c, i) => (
                    <span key={i} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5">{c}</span>
                  ))}
                  {student.courses.length > 3 && (
                    <span className="text-xs text-gray-600">+{student.courses.length - 3}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/profile/${student.id}`}
                  className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 transition-all" title="Ver perfil">
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
