import type { Exam, ExamResult } from "@/types/exam";

export type { Exam, ExamResult };

// ── Helpers ───────────────────────────────────────────────────

export function calcScore(exam: Exam, answers: Record<string, string>): number {
  if (exam.questions.length === 0) return 0;
  let correct = 0;
  exam.questions.forEach(q => {
    if (answers[q.id] === q.correctAnswer) correct++;
  });
  return (correct / exam.questions.length) * 100;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function isTimeCritical(seconds: number): boolean {
  return seconds < 120;
}

/** Conta tentativas existentes para um exame */
export function countAttempts(
  results: Record<string, ExamResult>,
  examId: string
): number {
  return Object.values(results).filter(r => r.examId === examId).length;
}

/** Verifica se pode tentar o exame */
export function canAttempt(
  results: Record<string, ExamResult>,
  examId: string,
  maxAttempts: number
): boolean {
  return countAttempts(results, examId) < maxAttempts;
}

/** Label do estado de um exame */
export function examStatusLabel(
  result: ExamResult | undefined,
  canRetry: boolean
): { label: string; variant: "none" | "passed" | "failed" | "locked" } {
  if (!result) return { label: "Não realizado", variant: "none" };
  if (!canRetry && result) return { label: "Esgotado", variant: "locked" };
  if (result.passed)  return { label: "Aprovado",   variant: "passed" };
  return { label: "Reprovado", variant: "failed" };
}
