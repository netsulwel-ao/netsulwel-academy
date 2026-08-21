"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import type { Exam, ExamResult } from "../_types/exams";

interface ResultReviewProps {
  exam: Exam;
  result: ExamResult;
}

export function ResultReview({ exam, result }: ResultReviewProps) {
  return (
    <div className="space-y-3">
      {exam.questions.map((q, i) => {
        const userAnswer = result.answers[q.id];
        const correct   = userAnswer === q.correctAnswer;

        return (
          <div
            key={q.id}
            className={`border ${
              correct
                ? "border-green/20 bg-green/5"
                : "border-red-500/20 bg-red-500/5"
            }`}
          >
            {/* Cabeçalho */}
            <div className="flex items-center gap-3 border-b border-gray-800 px-4 py-2.5">
              {correct
                ? <CheckCircle2 className="h-3.5 w-3.5 text-green/60 shrink-0" strokeWidth={1.5} />
                : <XCircle    className="h-3.5 w-3.5 text-red-400/60 shrink-0" strokeWidth={1.5} />
              }
              <span className="font-mono text-[13px] uppercase tracking-widest text-gray-700">
                Pergunta {String(i + 1).padStart(2, "0")}
              </span>
              <span className={`ml-auto font-mono text-[13px] uppercase tracking-widest ${
                correct ? "text-green/60" : "text-red-400/60"
              }`}>
                {correct ? "correto" : "errado"}
              </span>
            </div>

            <div className="px-4 py-4">
              {/* Enunciado */}
              <p className="text-sm font-semibold text-gray-300 mb-3">{q.question}</p>

              {/* Múltipla escolha */}
              {q.type === "multiple_choice" && q.options && (
                <div className="space-y-1.5">
                  {q.options.map((opt, oi) => {
                    const isUser    = userAnswer === String(oi);
                    const isCorrect = q.correctAnswer === String(oi);
                    return (
                      <div
                        key={oi}
                        className={`flex items-center gap-2.5 px-3 py-2 text-sm ${
                          isCorrect
                            ? "bg-green/8 border border-green/20 text-green/80"
                            : isUser && !isCorrect
                            ? "bg-red-500/8 border border-red-500/20 text-red-400/70"
                            : "text-gray-600"
                        }`}
                      >
                        <span className="font-mono text-[13px] w-4 shrink-0">
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {isCorrect && <CheckCircle2 className="h-3 w-3 shrink-0" strokeWidth={1.5} />}
                        {isUser && !isCorrect && <XCircle className="h-3 w-3 shrink-0" strokeWidth={1.5} />}
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Verdadeiro / Falso */}
              {q.type === "true_false" && (
                <div className="flex gap-2">
                  {["Verdadeiro", "Falso"].map((opt, oi) => {
                    const isUser    = userAnswer === String(oi);
                    const isCorrect = q.correctAnswer === String(oi);
                    return (
                      <div
                        key={oi}
                        className={`flex items-center gap-1.5 px-3 py-2 text-sm ${
                          isCorrect
                            ? "bg-green/8 border border-green/20 text-green/80"
                            : isUser && !isCorrect
                            ? "bg-red-500/8 border border-red-500/20 text-red-400/70"
                            : "text-gray-600 border border-gray-800"
                        }`}
                      >
                        {isCorrect && <CheckCircle2 className="h-3 w-3 shrink-0" strokeWidth={1.5} />}
                        {isUser && !isCorrect && <XCircle className="h-3 w-3 shrink-0" strokeWidth={1.5} />}
                        {opt}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Resposta curta */}
              {q.type === "short_answer" && (
                <div className="space-y-1.5 text-sm font-mono">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-700 shrink-0">tua resposta:</span>
                    <span className={correct ? "text-green/70" : "text-red-400/70"}>
                      {userAnswer || "(sem resposta)"}
                    </span>
                  </div>
                  {!correct && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-700 shrink-0">resposta correta:</span>
                      <span className="text-green/70">{q.correctAnswer}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
