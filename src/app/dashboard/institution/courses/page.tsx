"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { BookOpen, Loader2, Users, Eye, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Course } from "@/types/course";

export default function InstitutionCoursesPage() {
  const { user, institutionId } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!institutionId) return;
    loadCourses();
  }, [institutionId]);

  const loadCourses = async () => {
    try {
      const membersSnap = await getDocs(query(collection(db, "users"), where("institutionId", "==", institutionId)));
      const teacherUids = membersSnap.docs
        .filter(d => d.data().institutionRole === "teacher")
        .map(d => d.id);

      if (teacherUids.length === 0) {
        setLoading(false);
        return;
      }

      const coursesQuery = query(
        collection(db, "courses"),
        where("createdBy", "in", teacherUids),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(coursesQuery);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Course));
      setCourses(list);
    } catch (err) {
      console.error("Error loading courses:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="h-8 w-40 bg-gray-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-72 bg-gray-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[100rem] space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-gray-800/60 p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 blur-3xl rounded-full" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Cursos</h1>
              <p className="text-gray-400">Cursos dos professores da tua instituição</p>
            </div>
          </div>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/70 p-16 text-center">
          <div className="relative inline-flex mb-6">
            <div className="absolute inset-0 bg-purple-500/10 blur-2xl rounded-full" />
            <BookOpen className="h-16 w-16 text-gray-600 relative" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Nenhum curso encontrado</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Os cursos criados pelos professores da tua instituição aparecerão aqui.
            Certifica-te de que já convidaste professores.
          </p>
          <Link
            href="/dashboard/institution/members"
            className="mt-6 inline-flex items-center gap-2 bg-purple hover:bg-purple-light text-white px-5 py-2.5 rounded-lg font-bold transition-all hover:shadow-lg hover:shadow-purple-500/20"
          >
            Convidar Professores
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map(course => (
            <Link key={course.id} href={`/admin/courses/${course.id}/edit`}
              className="group rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/70 hover:border-purple/30 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5">
              <div className="relative h-44 bg-gray-800 overflow-hidden">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen className="h-14 w-14 text-gray-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
                <span className={`absolute top-3 right-3 px-2.5 py-1 text-xs font-bold rounded-full border ${
                  course.status === "published" ? "bg-green-500/15 text-green-400 border-green-500/30" : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
                }`}>
                  {course.status === "published" ? "Publicado" : "Rascunho"}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-white text-lg group-hover:text-purple-300 transition-colors line-clamp-1">{course.title}</h3>
                <p className="mt-2 text-sm text-gray-400 line-clamp-2 leading-relaxed">{course.description || "Sem descrição."}</p>
                <div className="mt-4 pt-4 border-t border-gray-800/50 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    {course.views || 0} visualizações
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    {course.lessonsCount || 0} aulas
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
