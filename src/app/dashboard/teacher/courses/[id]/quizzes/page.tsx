"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { listenCourseQuizzes, deleteQuiz } from "@/lib/quiz";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, FileQuestion, Trash2, Edit, ChevronLeft, Loader2, HelpCircle, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import type { ModuleQuiz } from "@/types/quiz";

export default function CourseQuizzesPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id as string;
  const { user } = useAuth();

  const [quizzes, setQuizzes] = useState<ModuleQuiz[]>([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [modules, setModules] = useState<{ index: number; title: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId || !user) return;
    const load = async () => {
      const snap = await getDoc(doc(db, "courses", courseId));
      if (snap.exists()) {
        const data = snap.data();
        setCourseTitle(data.title || "");
        setModules((data.modules || []).map((m: any, i: number) => ({ index: i, title: m.title || `Módulo ${i + 1}` })));
      }
      setLoading(false);
    };
    load();
  }, [courseId, user]);

  useEffect(() => {
    if (!courseId) return;
    const unsub = listenCourseQuizzes(courseId, setQuizzes);
    return () => unsub();
  }, [courseId]);

  const handleDelete = async (quizId: string) => {
    if (!confirm("Tem a certeza que deseja eliminar este quiz?")) return;
    await deleteQuiz(quizId);
  };

  const modulesWithQuiz = new Set(quizzes.map((q) => q.moduleIndex));

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 animate-spin text-purple" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <Link href={`/dashboard/teacher/courses`}
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4">
        <ChevronLeft className="h-4 w-4" /> Voltar aos cursos
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Quizzes do Curso</h1>
          <p className="text-sm text-gray-400 mt-1">{courseTitle || "A carregar..."}</p>
        </div>
      </div>

      {/* Modules grid */}
      <div className="space-y-4">
        {modules.map((mod) => {
          const quiz = quizzes.find((q) => q.moduleIndex === mod.index);
          return (
            <div key={mod.index} className="bg-gray-900 border border-gray-800 p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center ${
                    quiz ? "bg-purple/20 text-purple" : "bg-gray-800 text-gray-500"
                  }`}>
                    <FileQuestion className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white truncate">
                      Módulo {mod.index + 1}{mod.title ? ` — ${mod.title}` : ""}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {quiz
                        ? `${quiz.questions.length} perguntas · Nota mínima: ${quiz.passingScore}% · Máx ${quiz.maxAttempts} tentativas`
                        : "Nenhum quiz criado ainda"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {quiz ? (
                    <>
                      <Link href={`/dashboard/teacher/courses/${courseId}/quizzes/${quiz.id}/edit`}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm font-medium transition-colors">
                        <Edit className="h-4 w-4" /> Editar
                      </Link>
                      <button onClick={() => handleDelete(quiz.id!)}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 text-sm font-medium transition-colors">
                        <Trash2 className="h-4 w-4" /> Eliminar
                      </button>
                    </>
                  ) : (
                    <Link href={`/dashboard/teacher/courses/${courseId}/quizzes/new?module=${mod.index}`}
                      className="flex items-center gap-2 px-4 py-2 bg-purple hover:bg-purple-light text-white text-sm font-bold transition-colors">
                      <Plus className="h-4 w-4" /> Criar Quiz
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modules.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center text-gray-600">
          <HelpCircle className="h-12 w-12 mb-4 opacity-40" />
          <p className="text-sm font-medium">Este curso não tem módulos</p>
          <p className="text-sm mt-1">Adicione módulos e aulas ao curso primeiro</p>
        </div>
      )}
    </div>
  );
}
