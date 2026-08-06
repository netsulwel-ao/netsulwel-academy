"use client";

import Link from "next/link";
import { FileText, AlertTriangle, Loader2, BookOpen } from "lucide-react";
import { useExams } from "./_hooks/useExams";
import { ExamCard } from "./_components/ExamCard";

export default function StudentExamsPage() {
  const { exams, results, loading, error } = useExams();

  return (
    <div className="max-w-[80rem] mx-auto space-y-8 animate-in fade-in duration-300">

      {/* ── Cabeçalho ── */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-purple/60 mb-2">
          // avaliações
        </p>
        <h1 className="text-2xl font-bold text-gray-100">Avaliações</h1>
        <p className="mt-1 text-sm text-gray-600">
          {loading ? "A carregar..." : `${exams.length} avaliação${exams.length !== 1 ? "ões" : ""} disponíve${exams.length !== 1 ? "is" : "l"}`}
        </p>
      </div>

      {/* ── Erro ── */}
      {error && (
        <div className="flex items-start gap-3 border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" strokeWidth={1.5} />
          <p className="text-sm text-amber-400/80">{error}</p>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && exams.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center border border-gray-800/60 bg-gray-900/10 py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
            <FileText className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-gray-700 mb-2">
            // sem avaliações
          </p>
          <p className="text-sm text-gray-600 max-w-xs mb-6">
            Ainda não há avaliações publicadas para os cursos em que estás inscrito.
          </p>
          <Link
            href="/dashboard/courses"
            className="flex items-center gap-1.5 border border-gray-800 bg-gray-900/60 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-gray-600 hover:border-gray-700 hover:text-gray-400 transition-colors"
          >
            <BookOpen className="h-3 w-3" strokeWidth={1.5} />
            Explorar cursos
          </Link>
        </div>
      )}

      {/* ── Lista de avaliações ── */}
      {!loading && exams.length > 0 && (
        <div className="space-y-2">
          {exams.map(exam => (
            <ExamCard
              key={exam.id}
              exam={exam}
              result={results[exam.id]}
              allResults={results}
            />
          ))}
        </div>
      )}
    </div>
  );
}
