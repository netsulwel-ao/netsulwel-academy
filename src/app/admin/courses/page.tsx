"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { Plus, Pencil, Trash2, Loader2, Video, BookOpen, AlertTriangle, Share2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  modulesCount: number;
  lessonsCount: number;
  status: "published" | "draft";
  format?: "recorded" | "live";
  createdAt: Date;
  createdBy?: string;
}

export default function CoursesPage() {
  const { isAdmin, isTeacher, user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/preview/course/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchCourses = async () => {
    try {
      const constraints: any[] = [orderBy("createdAt", "desc")];
      if (isTeacher && user?.uid) {
        constraints.push(where("createdBy", "==", user.uid));
      }
      const q = query(collection(db, "courses"), ...constraints);
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
      })) as Course[];
      setCourses(data);
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCourses();
  }, [isTeacher, user?.uid]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "courses", id));
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Erro ao apagar curso:", error);
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Cursos</h1>
          <p className="mt-1 text-gray-400">
            {loading ? "A carregar..." : `${courses.length} curso${courses.length !== 1 ? "s" : ""} na plataforma`}
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          className="flex items-center gap-2 bg-purple hover:bg-purple-light text-white px-5 py-2.5 font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Curso
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-purple" />
          <span className="sr-only">A carregar cursos...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && courses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 bg-gray-900/40 backdrop-blur-xl text-center">
          <div className="flex h-16 w-16 items-center justify-center bg-blue-500/10 mb-4">
            <Video className="h-8 w-8 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Nenhum curso ainda</h2>
          <p className="text-gray-400 mb-6 max-w-sm">
            Crie o primeiro curso da plataforma para que os alunos possam começar a aprender.
          </p>
          <Link
            href="/admin/courses/new"
            className="flex items-center gap-2 bg-purple hover:bg-purple-light text-white px-6 py-3 font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar Primeiro Curso
          </Link>
        </div>
      )}

      {/* Courses grid */}
      {!loading && courses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="group bg-gray-900/40 backdrop-blur-xl flex flex-col overflow-hidden hover:bg-gray-900/60 transition-all"
            >
              {/* Thumbnail */}
              <div className="relative h-44 bg-gray-800 overflow-hidden">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-900/40 to-gray-900">
                    <BookOpen className="h-12 w-12 text-blue-500/40" />
                  </div>
                )}
                {/* Status badge */}
                <span
                  className={`absolute top-3 right-3 px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                    course.status === "published"
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {course.status === "published" ? "Publicado" : "Rascunho"}
                </span>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-5">
                <h3 className="font-bold text-white text-lg leading-snug line-clamp-2">
                  {course.title}
                </h3>
                <p className="mt-2 text-sm text-gray-400 line-clamp-2 flex-1">
                  {course.description || "Sem descrição."}
                </p>

                <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {course.modulesCount ?? 0} módulos
                  </span>
                  <span className="flex items-center gap-1">
                    <Video className="h-3.5 w-3.5" />
                    {course.lessonsCount ?? 0} aulas
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-5 flex items-center gap-3 border-t border-gray-800 pt-4">
                  <Link
                    href={`/admin/courses/${course.id}/edit`}
                    className="flex flex-1 items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-2 text-sm font-medium transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Link>

                  {course.format === "live" && (
                    <Link
                      href={`/admin/courses/${course.id}/live-studio`}
                      className="flex flex-1 items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 text-sm font-bold transition-colors"
                    >
                      <Video className="h-4 w-4" />
                      Estúdio
                    </Link>
                  )}

                  {confirmDelete === course.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <button
                        onClick={() => handleDelete(course.id)}
                        disabled={deletingId === course.id}
                        className="flex flex-1 items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white py-2 text-sm font-bold transition-colors disabled:opacity-60"
                      >
                        {deletingId === course.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Confirmar"
                        )}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="flex flex-1 items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 text-sm transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(course.id)}
                      aria-label="Apagar curso"
                      className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-2 text-sm font-medium transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm delete modal overlay */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 p-8 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Apagar Curso</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Tens a certeza que queres apagar este curso? Esta ação é irreversível.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={!!deletingId}
                className="flex flex-1 items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 font-bold transition-colors disabled:opacity-60"
              >
                {deletingId ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apagar"}
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex flex-1 items-center justify-center bg-gray-800 hover:bg-gray-700 text-white py-2.5 font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
