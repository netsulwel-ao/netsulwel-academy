"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Clock, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { useExamSession } from "../_hooks/useExamSession";
import { QuestionCard } from "../_components/QuestionCard";
import { formatTime, isTimeCritical } from "../_types/exams";

export default function TakeExamPage() {
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

  const {
    exam, answers, setAnswer,
    timeLeft, loading, submitting,
    error, answeredCount, submit,
  } = useExamSession(id);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
      </div>
    );
  }

  if (!exam) return null;

  const allAnswered = answeredCount >= exam.questions.length;
  const progress = Math.round((answeredCount / exam.questions.length) * 100);

  return (
    <div className="max-w-[56rem] mx-auto space-y-6 animate-in fade-in duration-300">

      {/* ── Barra superior sticky ── */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-10 px-4 sm:px-6 md:px-8 lg:px-10 py-3 bg-gray-950 border-b border-gray-800">
        <div className="flex items-center justify-between gap-4 max-w-[56rem] mx-auto">
          {/* Back */}
          <button
            onClick={() => router.push("/dashboard/exams")}
            className="flex items-center gap-1 font-mono text-[13px] uppercase tracking-widest text-gray-700 hover:text-gray-500 transition-colors"
          >
            <ChevronLeft className="h-3 w-3" /> Avaliações
          </button>

          <div className="flex items-center gap-3">
            {/* Timer */}
            {timeLeft !== null && (
              <div className={`flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[13px] font-bold transition-colors ${
                isTimeCritical(timeLeft)
                  ? "border-red-500 bg-red-500/8 text-red-400"
                  : "border-gray-800 bg-gray-900 text-gray-500"
              }`}>
                <Clock className="h-3 w-3" strokeWidth={1.5} />
                {formatTime(timeLeft)}
              </div>
            )}

            {/* Progresso */}
            <span className="font-mono text-[13px] text-gray-700">
              {answeredCount}/{exam.questions.length}
            </span>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="mt-2 h-0.5 bg-gray-800 max-w-[56rem] mx-auto overflow-hidden">
          <div
            className="h-full bg-purple/50 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ── Cabeçalho do exame ── */}
      <div>
        <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-purple mb-2">
          // avaliação em curso
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-100">{exam.title}</h1>
        {exam.description && (
          <p className="mt-1 text-sm text-gray-600">{exam.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[13px] text-gray-700">
          <span>{exam.questions.length} perguntas</span>
          <span>·</span>
          <span>mín. {exam.passingScore}%</span>
          {exam.timeLimit && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" strokeWidth={1.5} />
                {exam.timeLimit} min
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Erro de submissão ── */}
      {error && (
        <div className="flex items-start gap-2.5 border border-red-500 bg-red-500/5 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" strokeWidth={1.5} />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* ── Perguntas ── */}
      <div className="space-y-4">
        {exam.questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            total={exam.questions.length}
            answer={answers[q.id]}
            onAnswer={val => setAnswer(q.id, val)}
          />
        ))}
      </div>

      {/* ── Rodapé com submit ── */}
      <div className="sticky bottom-0 -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-10 px-4 sm:px-6 md:px-8 lg:px-10 py-4 bg-gray-950 border-t border-gray-800">
        <div className="flex items-center justify-between gap-4 max-w-[56rem] mx-auto">
          <p className="font-mono text-[13px] text-gray-700">
            {!allAnswered
              ? `${exam.questions.length - answeredCount} pergunta${exam.questions.length - answeredCount !== 1 ? "s" : ""} por responder`
              : "todas respondidas"}
          </p>

          <button
            onClick={submit}
            disabled={submitting || !allAnswered}
            className="flex items-center gap-2 bg-green px-5 py-2.5 text-sm font-bold text-gray-950 hover:bg-green-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {submitting
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <><span>Submeter</span> <ArrowRight className="h-4 w-4" /></>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
