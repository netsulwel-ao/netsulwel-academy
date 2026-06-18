"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, HelpCircle, Flag } from "lucide-react";
import type { ModuleQuiz, ModuleQuizQuestion } from "@/types/quiz";

interface QuizPlayerProps {
  quiz: ModuleQuiz;
  onFinish: (answers: Record<string, number>) => void;
  submitting?: boolean;
}

export default function QuizPlayer({ quiz, onFinish, submitting }: QuizPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);

  const questions = quiz.questions;
  const current = questions[currentIndex];
  const total = questions.length;
  const answered = Object.keys(answers).length;
  const progressPct = total > 0 ? Math.round((answered / total) * 100) : 0;

  const selectAnswer = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const toggleFlag = (questionId: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < total) setCurrentIndex(index);
  }, [total]);

  const handleFinish = () => {
    if (answered < total) {
      setShowConfirm(true);
      return;
    }
    onFinish(answers);
  };

  const confirmSubmit = () => {
    setShowConfirm(false);
    onFinish(answers);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
          <span>Progresso: {answered} de {total} respondidas</span>
          <span>{progressPct}%</span>
        </div>
        <div className="flex gap-1">
          {questions.map((q, i) => {
            const isAnswered = answers[q.id] !== undefined;
            const isFlagged = flagged.has(q.id);
            const isCurrent = i === currentIndex;
            return (
              <button key={q.id} onClick={() => goTo(i)}
                className={`flex-1 h-2 transition-all ${
                  isCurrent ? "ring-2 ring-purple" : ""
                } ${
                  isAnswered ? "bg-purple" : isFlagged ? "bg-yellow-600" : "bg-gray-800"
                }`}
                title={`Pergunta ${i + 1}${isAnswered ? " (respondida)" : ""}${isFlagged ? " (sinalizada)" : ""}`} />
            );
          })}
        </div>
      </div>

      {/* Question counter */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Pergunta {currentIndex + 1} de {total}
        </p>
        <button onClick={() => toggleFlag(current.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
            flagged.has(current.id)
              ? "text-yellow-400 bg-yellow-500/10"
              : "text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/5"
          }`}>
          <Flag className={`h-4 w-4 ${flagged.has(current.id) ? "fill-current" : ""}`} />
          {flagged.has(current.id) ? "Sinalizada" : "Sinalizar"}
        </button>
      </div>

      {/* Question card */}
      <div className="bg-gray-900/60 border border-gray-800 p-6 sm:p-8 mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-6 leading-relaxed">
          {current.question}
        </h2>

        <div className="space-y-3">
          {current.options.map((opt, oi) => {
            const selected = answers[current.id] === oi;
            return (
              <button key={oi} onClick={() => selectAnswer(current.id, oi)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 text-left transition-all border ${
                  selected
                    ? "border-purple bg-purple/10 text-white"
                    : "border-gray-800 bg-gray-950/50 text-gray-300 hover:border-gray-700 hover:bg-gray-900"
                }`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center border text-sm font-bold ${
                  selected
                    ? "border-purple bg-purple text-white"
                    : "border-gray-700 text-gray-500"
                }`}>
                  {String.fromCharCode(65 + oi)}
                </div>
                <span className="text-base">{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft className="h-4 w-4" /> Anterior
        </button>

        <div className="flex items-center gap-3">
          {answered < total && (
            <span className="text-sm text-gray-500">
              {total - answered} por responder
            </span>
          )}
          {currentIndex < total - 1 ? (
            <button onClick={() => goTo(currentIndex + 1)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors">
              Seguinte <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={handleFinish} disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple hover:bg-purple-light text-white text-sm font-bold transition-colors disabled:opacity-50">
              {submitting ? "A enviar..." : "Finalizar Quiz"}
            </button>
          )}
        </div>
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <HelpCircle className="h-6 w-6 text-yellow-400" />
              <h3 className="text-lg font-bold text-white">Quiz incompleto</h3>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Ainda não respondeste a {total - answered} pergunta{(total - answered) > 1 ? "s" : ""}.
              As perguntas não respondidas serão contadas como erradas.
              Deseja finalizar mesmo assim?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors">
                Continuar a responder
              </button>
              <button onClick={confirmSubmit}
                className="px-4 py-2 bg-purple hover:bg-purple-light text-white text-sm font-bold transition-colors">
                Finalizar mesmo assim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
