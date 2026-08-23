"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { BookOpen, Plus, Edit, Loader2, Eye, Trash2, Search, X, Share2, CheckCircle2, FileQuestion } from "lucide-react";
import Link from "next/link";
import type { Course } from "@/types/course";

export default function TeacherCoursesPage() {
  const { user, isTeacher } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user || !isTeacher) return;
    const load = async () => {
      try {
        const q = query(
          collection(db, "courses"),
          where("createdBy", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Course)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, isTeacher]);

  const filtered = search.trim()
    ? courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
    : courses;

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleShare = async (e: React.MouseEvent, courseId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/s/${courseId}`;
    try {
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopiedId(courseId);
        setTimeout(() => setCopiedId(null), 2500);
      }
    } catch { /* user cancelled */ }
  };

  const formatKz = (v: number) => v.toLocaleString("pt-AO") + " Kz";

  if (!isTeacher) {
    return (
      <div className="text-center py-20"><p className="text-gray-400">Acesso não autorizado.</p></div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Meus Cursos</h1>
          <p className="mt-1 text-gray-400">{courses.length} curso{courses.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/dashboard/teacher/courses/new"
          className="inline-flex items-center gap-2 bg-green hover:bg-green-light text-white px-5 py-3 font-bold transition-colors">
          <Plus className="h-5 w-5" /> Novo Curso
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Pesquisar curso..."
          className="w-full bg-gray-900 border border-gray-800 focus:border-green-500 py-2.5 pl-10 pr-9 text-white text-sm focus:outline-none transition-all" />
        {search && (
          <button onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-green-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-gray-900 border border-gray-800">
          <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">{search ? "Nenhum curso encontrado." : "Ainda não criaste nenhum curso."}</p>
          {!search && (
            <Link href="/dashboard/teacher/courses/new"
              className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 font-bold">
              <Plus className="h-4 w-4" /> Criar primeiro curso
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((course) => (
            <div key={course.id} className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 sm:p-5">
                <div className="h-32 sm:h-16 sm:w-24 rounded bg-gray-800 overflow-hidden shrink-0">
                  {course.thumbnail ? (
                     <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center"><BookOpen className="h-6 w-6 text-gray-700" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                    <h3 className="font-bold text-white truncate">{course.title}</h3>
                    <span className={`shrink-0 px-2 py-0.5 text-[13px] font-bold ${
                      course.status === "published"
                        ? "bg-green-500/15 text-green-400 border border-green-500"
                        : "bg-yellow-500/15 text-yellow-400 border border-yellow-500"
                    }`}>
                      {course.status === "published" ? "Publicado" : "Rascunho"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{course.modulesCount ?? 0} módulos • {course.lessonsCount ?? 0} aulas • {formatKz(course.price)}</p>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 shrink-0 justify-end sm:justify-start">
                  <Link href={`/dashboard/courses/${course.id}`}
                    className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 transition-all" title="Ver">
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Link href={`/dashboard/teacher/courses/${course.id}/edit`}
                    className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 transition-all" title="Editar">
                    <Edit className="h-4 w-4" />
                  </Link>
                  <Link href={`/dashboard/teacher/courses/${course.id}/quizzes`}
                    className="p-2 text-gray-500 hover:text-purple-400 hover:bg-gray-800 transition-all" title="Quizzes">
                    <FileQuestion className="h-4 w-4" />
                  </Link>
                  <button onClick={e => handleShare(e, course.id!)}
                    className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 transition-all" title="Copiar link de venda">
                    {copiedId === course.id ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Share2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
