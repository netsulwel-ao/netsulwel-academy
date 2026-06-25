"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, where, orderBy } from "firebase/firestore";
import { Plus, FileText, Loader2, Settings, BarChart3, Trash2 } from "lucide-react";
import { deleteDoc, doc } from "firebase/firestore";
import type { Exam } from "@/types/exam";
import type { Course } from "@/types/course";

export default function TeacherExamsPage() {
  const { user } = useAuth();
  const [exams, setExams] = useState<(Exam & { id: string })[]>([]);
  const [courseMap, setCourseMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    try {
      const snap = await getDocs(query(
        collection(db, "exams"),
        where("createdBy", "==", user.uid),
        orderBy("createdAt", "desc")
      ));
      const examsList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Exam & { id: string }));
      setExams(examsList);

      const courseIds = [...new Set(examsList.map((e) => e.courseId).filter(Boolean))];
      if (courseIds.length > 0) {
        const courseSnap = await getDocs(query(collection(db, "courses"), where("__name__", "in", courseIds)));
        const map: Record<string, string> = {};
        courseSnap.forEach((d) => { map[d.id] = d.data().title || "Sem título"; });
        setCourseMap(map);
      }
    } catch { /* ok */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const handleDelete = async (examId: string) => {
    if (!confirm("Tens a certeza que queres eliminar esta avaliação?")) return;
    await deleteDoc(doc(db, "exams", examId));
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-green-400" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Avaliações</h1>
          <p className="text-gray-400">Cria e gere avaliações para os teus cursos.</p>
        </div>
        <Link
          href="/dashboard/teacher/exams/new"
          className="flex items-center gap-2 bg-green hover:bg-green-light text-white px-5 py-3 font-bold transition-colors shrink-0"
        >
          <Plus className="h-5 w-5" />
          Nova Avaliação
        </Link>
      </div>

      {exams.length === 0 ? (
        <div className="bg-gray-900/40 border border-gray-800 p-12 text-center">
          <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Nenhuma avaliação criada</h2>
          <p className="text-gray-400 mb-6">Cria a tua primeira avaliação para os teus alunos.</p>
          <Link href="/dashboard/teacher/exams/new" className="inline-flex items-center gap-2 bg-green hover:bg-green-light text-white px-5 py-3 font-bold transition-colors">
            <Plus className="h-5 w-5" /> Criar Avaliação
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-gray-900/40 border border-gray-800 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-white">{exam.title}</h3>
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5">{exam.questions.length} perguntas</span>
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5">{exam.passingScore}% mínimo</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">{exam.description}</p>
                {exam.courseId && courseMap[exam.courseId] && (
                  <p className="text-xs text-gray-500 mt-1">Curso: {courseMap[exam.courseId]}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/dashboard/teacher/exams/${exam.id}/edit`}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 text-sm font-bold transition-colors flex items-center gap-1">
                  <Settings className="h-4 w-4" /> Editar
                </Link>
                <button onClick={() => handleDelete(exam.id!)}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2.5 text-sm font-bold transition-colors flex items-center gap-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
