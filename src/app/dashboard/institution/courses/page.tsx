"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { BookOpen, Loader2, Users, Eye } from "lucide-react";
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
      // Carrega membros da instituição para obter os UIDs dos teachers
      const membersSnap = await getDocs(query(collection(db, "users"), where("institutionId", "==", institutionId)));
      const teacherUids = membersSnap.docs
        .filter(d => d.data().institutionRole === "teacher")
        .map(d => d.id);

      if (teacherUids.length === 0) {
        setLoading(false);
        return;
      }

      // Carrega cursos criados pelos teachers da instituição
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple" />
      </div>
    );
  }

  return (
    <div className="max-w-[100rem] space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white">Cursos</h1>
        <p className="mt-2 text-gray-400">Cursos dos professores da tua instituição.</p>
      </div>

      {courses.length === 0 ? (
        <div className="bg-gray-900/40 border border-gray-800 p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum curso encontrado.</p>
          <p className="text-sm text-gray-500 mt-1">Os cursos criados pelos professores aparecerão aqui.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map(course => (
            <Link key={course.id} href={`/admin/courses/${course.id}/edit`}
              className="group bg-gray-900/40 border border-gray-800 hover:bg-gray-900/60 transition-all overflow-hidden">
              <div className="relative h-40 bg-gray-800 overflow-hidden">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen className="h-12 w-12 text-gray-600" />
                  </div>
                )}
                <span className={`absolute top-3 right-3 px-2 py-1 text-xs font-bold uppercase ${
                  course.status === "published" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                }`}>
                  {course.status === "published" ? "Publicado" : "Rascunho"}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-white text-lg">{course.title}</h3>
                <p className="mt-2 text-sm text-gray-400 line-clamp-2">{course.description || "Sem descrição."}</p>
                <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{course.views || 0}</span>
                  <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{course.lessonsCount || 0} aulas</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}