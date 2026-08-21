"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, HelpCircle, Lightbulb } from "lucide-react";
import type { ExerciseItem } from "@/types/course";

interface ExerciseBlockProps {
  exercises: ExerciseItem[];
}

type AnswerState = Record<number, { selected: string; revealed: boolean }>;

export default function ExerciseBlock({ exercises }: ExerciseBlockProps) {
  const [answers, setAnswers] = useState<AnswerState>({});
  const [showAll, setShowAll] = useState(false);

  if (!exercises || exercises.length === 0) return null;

  const answeredCount = Object.keys(answers).length;

  const select = (idx: number, value: string) => {
    setAnswers(prev => ({ ...prev, [idx]: { selected: value, revealed: true } }));
  };

  const reveal = (idx: number) => {
    setAnswers(prev => ({ ...prev, [idx]: { selected: prev[idx]?.selected || "", revealed: true } }));
  };

  const isCorrect = (idx: number) => {
    const a = answers[idx];
    if (!a?.revealed) return null;
    return a.selected.toLowerCase().trim() === exercises[idx].correctAnswer.toLowerCase().trim();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <HelpCircle className="h-4 w-4" /> Exercícios de Prática ({exercises.length})
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{answeredCount} de {exercises.length} respondidos</span>
          {answeredCount < exercises.length && (
            <button onClick={() => setShowAll(!showAll)}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              {showAll ? "Ocultar respostas" : "Mostrar todas"}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {exercises.map((ex, i) => {
          const a = answers[i];
          const correct = isCorrect(i);
          return (
            <div key={i} className="bg-gray-900 border border-gray-800 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-sm font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 shrink-0 mt-0.5">
                  {i + 1}/{exercises.length}
                </span>
                <p className="text-sm text-white flex-1">{ex.question}</p>
              </div>

              {/* Multiple choice */}
              {ex.type === "multiple_choice" && ex.options && (
                <div className="space-y-1.5 pl-2">
                  {ex.options.map((opt, oi) => {
                    const isSelected = a?.selected === opt;
                    const isRight = opt === ex.correctAnswer;
                    let btnClass = "bg-gray-950 border-gray-700 text-gray-300 hover:border-gray-500";
                    if (a?.revealed && isSelected) {
                      btnClass = isRight
                        ? "bg-green-600/20 border-green-500 text-green-400"
                        : "bg-red-600/20 border-red-500 text-red-400";
                    } else if (a?.revealed && isRight && showAll) {
                      btnClass = "bg-green-600/20 border-green-500/50 text-green-400";
                    }
                    return (
                      <button key={oi} type="button" onClick={() => select(i, opt)}
                        disabled={a?.revealed}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 border text-sm text-left transition-all disabled:cursor-default ${btnClass}`}>
                        <div className={`shrink-0 h-4 w-4 border-2 flex items-center justify-center transition-colors ${
                          a?.revealed && isRight ? "border-green-500" : isSelected ? "border-blue-500" : "border-gray-700"
                        }`}>
                          {a?.revealed && isRight && <div className="h-2 w-2 bg-green-500" />}
                          {a?.revealed && isSelected && !isRight && <XCircle className="h-3.5 w-3.5 text-red-400" />}
                          {!a?.revealed && isSelected && <div className="h-2 w-2 bg-blue-500" />}
                        </div>
                        <span className="flex-1">{opt}</span>
                        {a?.revealed && isRight && <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* True / False */}
              {ex.type === "true_false" && (
                <div className="flex gap-2 pl-2">
                  {["true", "false"].map(val => {
                    const isSelected = a?.selected === val;
                    const isRight = val === ex.correctAnswer;
                    let btnClass = "bg-gray-950 border-gray-700 text-gray-300 hover:border-gray-500";
                    if (a?.revealed && isSelected) {
                      btnClass = isRight
                        ? "bg-green-600/20 border-green-500 text-green-400"
                        : "bg-red-600/20 border-red-500 text-red-400";
                    } else if (a?.revealed && isRight && showAll) {
                      btnClass = "bg-green-600/20 border-green-500/50 text-green-400";
                    }
                    return (
                      <button key={val} type="button" onClick={() => select(i, val)}
                        disabled={a?.revealed}
                        className={`flex-1 px-4 py-2.5 text-sm font-bold border transition-all disabled:cursor-default ${btnClass}`}>
                        {val === "true" ? "Verdadeiro" : "Falso"}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Short answer */}
              {ex.type === "short_answer" && (
                <div className="pl-2 space-y-2">
                  <div className="flex gap-2">
                    <input type="text" value={a?.selected || ""}
                      onChange={e => setAnswers(prev => ({ ...prev, [i]: { selected: e.target.value, revealed: false } }))}
                      disabled={a?.revealed}
                      placeholder="Escreve a tua resposta..."
                      className="flex-1 bg-gray-950 border border-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 disabled:opacity-60" />
                    {!a?.revealed && (
                      <button type="button" onClick={() => reveal(i)}
                        disabled={!a?.selected?.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm font-bold transition-colors">
                        Verificar
                      </button>
                    )}
                  </div>
                  {a?.revealed && (
                    <div className={`flex items-start gap-2 px-3 py-2 text-sm ${correct ? "bg-green-600/10 text-green-400" : "bg-red-600/10 text-red-400"}`}>
                      {correct ? (
                        <><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> Correto!</>
                      ) : (
                        <><XCircle className="h-4 w-4 shrink-0 mt-0.5" /> Resposta correta: <strong>{ex.correctAnswer}</strong></>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Feedback after answering */}
              {a?.revealed && (
                <div className={`flex items-start gap-2 px-3 py-2 text-sm border-l-2 ${
                  correct
                    ? "bg-green-600/5 border-green-500 text-green-400"
                    : "bg-red-600/5 border-red-500 text-red-400"
                }`}>
                  {correct ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                  <div>
                    <p className="font-bold">{correct ? "Correto!" : "Incorreto"}</p>
                    {ex.explanation && <p className="text-sm text-gray-400 mt-1">{ex.explanation}</p>}
                  </div>
                </div>
              )}

              {/* Show correct when "mostrar todas" is active and unanswered */}
              {!a?.revealed && showAll && (
                <div className="flex items-start gap-2 px-3 py-2 text-sm bg-blue-600/5 border-l-2 border-blue-500 text-blue-400">
                  <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Resposta:</p>
                    <p className="text-sm text-gray-400">{ex.correctAnswer}</p>
                    {ex.explanation && <p className="text-sm text-gray-500 mt-1">{ex.explanation}</p>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
