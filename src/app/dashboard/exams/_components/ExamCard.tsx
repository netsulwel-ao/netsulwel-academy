"use client";

import Link from "next/link";
import { Clock, CheckCircle2, XCircle, ArrowRight, FileText, RotateCcw } from "lucide-react";
import type { Exam, ExamResult } from "../_types/exams";
import { canAttempt, countAttempts } from "../_types/exams";

interface ExamCardProps {
  exam: Exam & { id: string };
  result: ExamResult | undefined;
  allResults: Record<string, ExamResult>;
}

export function ExamCard({ exam, result, allResults }: ExamCardProps) {
  const attempts = countAttempts(allResults, exam.id);
  const canRetry  = canAttempt(allResults, exam.id, exam.maxAttempts);
  const hasResult = !!result;

  const href = hasResult && !canRetry
    ? `/dashboard/exams/${exam.id}/result`
    : `/dashboard/exams/${exam.id}`;

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-4 border border-gray-800/60 bg-gray-900/20 p-4 sm:p-5 hover:bg-gray-900/30 transition-colors">

      {/* Ícone de estado */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center border ${
        !hasResult
          ? "border-gray-800 bg-gray-900"
          : result?.passed
          ? "border-green/25 bg-green/8"
          : "border-red-500/25 bg-red-500/8"
      }`}>
        {!hasResult
          ? <FileText className="h-4 w-4 text-gray-600" strokeWidth={1.5} />
          : result?.passed
          ? <CheckCircle2 className="h-4 w-4 text-green/70" strokeWidth={1.5} />
          : <XCircle className="h-4 w-4 text-red-400/70" strokeWidth={1.5} />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-gray-200 leading-snug">{exam.title}</h3>
        {exam.description && (
          <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">{exam.description}</p>
        )}

        {/* Meta */}
        <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[10px] text-gray-700">
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
          <span>·</span>
          <span>{attempts}/{exam.maxAttempts} tentativas</span>
        </div>

        {/* Score da última tentativa */}
        {result && (
          <div className={`mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest border px-2 py-0.5 ${
            result.passed
              ? "border-green/25 bg-green/8 text-green/70"
              : "border-red-500/25 bg-red-500/8 text-red-400/70"
          }`}>
            {result.passed ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
            {Math.round(result.score)}% · {result.passed ? "Aprovado" : "Reprovado"}
          </div>
        )}
      </div>

      {/* Acção */}
      <Link
        href={href}
        className={`flex items-center gap-1.5 self-start shrink-0 border px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-all ${
          !canRetry && hasResult
            ? "border-gray-800/40 text-gray-700 cursor-not-allowed pointer-events-none"
            : hasResult
            ? "border-amber-500/25 bg-amber-500/8 text-amber-400/80 hover:bg-amber-500/15"
            : "border-purple/30 bg-purple/8 text-purple/80 hover:bg-purple/15"
        }`}
      >
        {!canRetry && hasResult
          ? "Esgotado"
          : hasResult
          ? <><RotateCcw className="h-3 w-3" /> Repetir</>
          : <><ArrowRight className="h-3 w-3" /> Iniciar</>
        }
      </Link>
    </div>
  );
}
