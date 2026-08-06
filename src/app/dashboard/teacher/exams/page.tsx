"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection, query, getDocs, where,
  deleteDoc, doc,
} from "firebase/firestore";
import { Plus, FileText, Loader2, Settings, Trash2, Clock, ChevronRight, AlertTriangle } from "lucide-react";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import type { Exam } from "@/types/exam";

export default function TeacherExamsPage() {
  const { user } = useAuth();
  const [exams, setExams] = useState<(Exam & { id: string })[]>([]);
  const [courseMap, setCourseMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      // Sem orderBy para evitar necessidade de índice composto
      // A ordenação é feita em memória
      const snap = await getDocs(query(
        collection(db, "exams"),
        where("createdBy", "==", user.uid)
      ));
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Exam & { id: string }))
        .sort((a, b) => {
          // Ordenar por createdAt desc em memória
          const ta = (a.createdAt as { toMillis?: () => number } | null)?.toMillis?.() ?? 0;
          const tb = (b.createdAt as { toMillis?: () => number } | null)?.toMillis?.() ?? 0;
          return tb - ta;
        });
      setExams(list);

      const courseIds = [...new Set(list.map(e => e.courseId).filter(Boolean))];
      if (courseIds.length > 0) {
        const courseSnap = await getDocs(
          query(collection(db, "courses"), where("__name__", "in", courseIds))
        );
        const map: Record<string, string> = {};
        courseSnap.forEach(d => { map[d.id] = d.data().title ?? "Sem título"; });
        setCourseMap(map);
      }
    } catch (err) {
      logger.error("TeacherExams: failed to load", err);
      setError("Não foi possível carregar as avaliações.");
    } finally {
      setLoading(false);
    }
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (examId: string) => {
    toast(`Eliminar avaliação?`, {
      description: "Esta acção é permanente e não pode ser desfeita.",
      action: {
        label: "Eliminar",
        onClick: async () => {
          setDeletingId(examId);
          try {
            await deleteDoc(doc(db, "exams", examId));
            setExams(prev => prev.filter(e => e.id !== examId));
            toast.success("Avaliação eliminada com sucesso.");
          } catch (err) {
            logger.error("TeacherExams: failed to delete", err, { examId });
            toast.error("Erro ao eliminar. Tenta novamente.");
          } finally {
            setDeletingId(null);
          }
        },
      },
      cancel: {
        label: "Cancelar",
        onClick: () => {},
      },
      duration: 8000,
    });
  };

  return (
    <div className="max-w-[80rem] mx-auto space-y-6 animate-in fade-in duration-300">

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-green/60 mb-2">
            // avaliações
          </p>
          <h1 className="text-2xl font-bold text-gray-100">Avaliações</h1>
          <p className="mt-1 text-sm text-gray-600">
            {loading ? "A carregar..." : `${exams.length} avaliação${exams.length !== 1 ? "ões" : ""}`}
          </p>
        </div>
        <Link
          href="/dashboard/teacher/exams/new"
          className="flex items-center gap-2 bg-green px-5 py-2.5 text-sm font-bold text-gray-950 hover:bg-green-light transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" /> Nova avaliação
        </Link>
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-start gap-3 border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" strokeWidth={1.5} />
          <p className="text-sm text-amber-400/80">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
        </div>
      )}

      {/* Empty state */}
      {!loading && exams.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center border border-gray-800/60 bg-gray-900/10 py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
            <FileText className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-gray-700 mb-2">
            // sem avaliações
          </p>
          <p className="text-sm text-gray-600 mb-5">
            Cria a tua primeira avaliação para os alunos.
          </p>
          <Link
            href="/dashboard/teacher/exams/new"
            className="flex items-center gap-1.5 border border-green/25 bg-green/8 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-green/70 hover:bg-green/15 transition-all"
          >
            <Plus className="h-3 w-3" /> Criar avaliação
          </Link>
        </div>
      )}

      {/* Lista */}
      {!loading && exams.length > 0 && (
        <div className="border border-gray-800/60 divide-y divide-gray-800/40">
          {exams.map(exam => (
            <div
              key={exam.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 hover:bg-gray-900/20 transition-colors"
            >
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-gray-200">{exam.title}</h3>
                  <span className="font-mono text-[9px] uppercase tracking-widest border border-gray-800 bg-gray-900/60 px-2 py-0.5 text-gray-600">
                    {exam.questions.length} perguntas
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-widest border border-gray-800 bg-gray-900/60 px-2 py-0.5 text-gray-600">
                    mín. {exam.passingScore}%
                  </span>
                  {exam.timeLimit && (
                    <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest border border-gray-800 bg-gray-900/60 px-2 py-0.5 text-gray-600">
                      <Clock className="h-2.5 w-2.5" strokeWidth={1.5} />
                      {exam.timeLimit}min
                    </span>
                  )}
                </div>
                {exam.description && (
                  <p className="text-xs text-gray-600 truncate">{exam.description}</p>
                )}
                {exam.courseId && courseMap[exam.courseId] && (
                  <p className="mt-1 font-mono text-[9px] text-gray-700">
                    curso: {courseMap[exam.courseId]}
                  </p>
                )}
              </div>

              {/* Acções */}
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/dashboard/teacher/exams/${exam.id}/edit`}
                  className="flex items-center gap-1.5 border border-gray-800 bg-gray-900/60 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-500 hover:border-gray-700 hover:text-gray-300 transition-all"
                >
                  <Settings className="h-3 w-3" strokeWidth={1.5} /> Editar
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(exam.id!)}
                  disabled={deletingId === exam.id}
                  className="flex items-center gap-1.5 border border-red-500/20 bg-red-500/8 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-red-400/70 hover:bg-red-500/15 disabled:opacity-50 transition-all"
                  aria-label="Eliminar avaliação"
                >
                  {deletingId === exam.id
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
