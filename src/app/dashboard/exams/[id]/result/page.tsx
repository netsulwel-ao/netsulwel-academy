"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CheckCircle2, XCircle, RotateCcw, BookOpen, Loader2 } from "lucide-react";
import { useExamResult } from "../../_hooks/useExamResult";
import { ResultReview } from "../../_components/ResultReview";

export default function ExamResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  if (!id || typeof id !== "string") {
    return (
      <div className="max-w-[56rem] mx-auto py-20 text-center px-4">
        <p className="text-sm text-gray-600">Exame inválido.</p>
        <Link href="/dashboard/exams" className="font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:text-gray-400 transition-colors mt-4 inline-block">
          ← Voltar
        </Link>
      </div>
    );
  }

  const { exam, result, allResults, loading } = useExamResult(id);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
      </div>
    );
  }

  if (!result || !exam) return null;

  const passed = result.passed;
  const score  = Math.round(result.score);
  const answeredCount = Object.keys(result.answers).length;

  return (
    <div className="max-w-[56rem] mx-auto space-y-8 animate-in fade-in duration-300">

      {/* ── Breadcrumb ── */}
      <button
        onClick={() => router.push("/dashboard/exams")}
        className="flex items-center gap-1 font-mono text-[13px] uppercase tracking-widest text-gray-700 hover:text-gray-500 transition-colors"
      >
        <ChevronLeft className="h-3 w-3" /> Avaliações
      </button>

      {/* ── Score card ── */}
      <div className={`border p-8 sm:p-10 ${
        passed
          ? "border-green bg-green/5"
          : "border-red-500 bg-red-500/5"
      }`}>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

          {/* Ícone + score */}
          <div className="text-center shrink-0">
            <div className={`inline-flex h-16 w-16 items-center justify-center border ${
              passed ? "border-green bg-green/10" : "border-red-500 bg-red-500/10"
            }`}>
              {passed
                ? <CheckCircle2 className="h-8 w-8 text-green" strokeWidth={1.5} />
                : <XCircle className="h-8 w-8 text-red-400" strokeWidth={1.5} />
              }
            </div>
            <p className={`mt-3 font-mono text-4xl font-extrabold ${
              passed ? "text-green" : "text-red-400"
            }`}>
              {score}%
            </p>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-gray-700 mb-2">
              {passed ? "// aprovado" : "// reprovado"}
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-100 leading-snug">
              {passed ? "Parabéns!" : "Continua a tentar"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">{exam.title}</p>

            <div className="mt-3 flex flex-wrap justify-center sm:justify-start items-center gap-3 font-mono text-[13px] text-gray-700">
              <span>{answeredCount}/{exam.questions.length} respondidas</span>
              <span>·</span>
              <span>mín. {exam.passingScore}%</span>
              {allResults.length > 1 && (
                <>
                  <span>·</span>
                  <span>{allResults.length} tentativas</span>
                </>
              )}
            </div>

            {/* Acções */}
            <div className="mt-5 flex flex-wrap justify-center sm:justify-start gap-3">
              <Link
                href={`/dashboard/exams/${id}`}
                className="flex items-center gap-1.5 border border-gray-800 bg-gray-900 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-gray-500 hover:border-gray-700 hover:text-gray-300 transition-all"
              >
                <RotateCcw className="h-3 w-3" strokeWidth={1.5} />
                Repetir
              </Link>
              {exam.courseId && (
                <Link
                  href={`/dashboard/courses/${exam.courseId}`}
                  className="flex items-center gap-1.5 border border-gray-800 bg-gray-900 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-gray-500 hover:border-gray-700 hover:text-gray-300 transition-all"
                >
                  <BookOpen className="h-3 w-3" strokeWidth={1.5} />
                  Ver curso
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Revisão das respostas ── */}
      <div>
        <div className="mb-4">
          <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-gray-700 mb-1">
            // revisão
          </p>
          <h2 className="text-base font-bold text-gray-200">
            Respostas detalhadas
          </h2>
        </div>

        <ResultReview exam={exam} result={result} />
      </div>
    </div>
  );
}
