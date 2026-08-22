"use client";

import type { Question } from "@/types/exam";

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
  answer: string | undefined;
  onAnswer: (value: string) => void;
}

export function QuestionCard({ question, index, total, answer, onAnswer }: QuestionCardProps) {
  return (
    <div className="border border-gray-800 bg-gray-900">
      {/* Header da pergunta */}
      <div className="flex items-center gap-2 sm:gap-3 border-b border-gray-800 px-3 sm:px-5 py-2.5 sm:py-3">
        <span className="font-mono text-[12px] sm:text-[13px] uppercase tracking-widest text-gray-700 shrink-0">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <div className="flex-1 h-px bg-gray-800" />
        <span className="font-mono text-[12px] sm:text-[13px] uppercase tracking-widest text-gray-700">
          {question.type === "multiple_choice" ? "múltipla escolha"
          : question.type === "true_false" ? "v / f"
          : "resposta curta"}
        </span>
      </div>

      <div className="p-3 sm:p-5">
        {/* Enunciado */}
        <p className="text-sm sm:text-base font-semibold text-gray-200 leading-relaxed mb-5">
          {question.question}
        </p>

        {/* Múltipla escolha */}
        {question.type === "multiple_choice" && question.options && (
          <div className="space-y-2">
            {question.options.map((opt, i) => {
              const val = String(i);
              const selected = answer === val;
              return (
                <label
                  key={i}
                  className={`flex items-center gap-3 border px-4 py-3 cursor-pointer transition-all ${
                    selected
                      ? "border-purple/40 bg-purple/10 text-gray-100"
                      : "border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700 hover:text-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={val}
                    checked={selected}
                    onChange={() => onAnswer(val)}
                    className="sr-only"
                  />
                  {/* Indicador visual */}
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center border font-mono text-[13px] transition-colors ${
                    selected ? "border-purple/60 bg-purple/30 text-purple/90" : "border-gray-700 text-gray-700"
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-sm">{opt}</span>
                </label>
              );
            })}
          </div>
        )}

        {/* Verdadeiro / Falso */}
        {question.type === "true_false" && (
          <div className="flex gap-3">
            {[
              { label: "Verdadeiro", val: "true" },
              { label: "Falso", val: "false" },
            ].map(({ label, val }) => {
              const selected = answer === val;
              return (
                <label
                  key={val}
                  className={`flex flex-1 items-center justify-center gap-2 border px-4 py-3 cursor-pointer transition-all ${
                    selected
                      ? "border-purple/40 bg-purple/10 text-gray-100"
                      : "border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700 hover:text-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={val}
                    checked={selected}
                    onChange={() => onAnswer(val)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{label}</span>
                </label>
              );
            })}
          </div>
        )}

        {/* Resposta curta */}
        {question.type === "short_answer" && (
          <input
            type="text"
            value={answer ?? ""}
            onChange={e => onAnswer(e.target.value)}
            placeholder="Escreve a tua resposta..."
            className="w-full border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-gray-200 placeholder-gray-700 focus:border-purple/40 focus:outline-none transition-colors"
          />
        )}
      </div>
    </div>
  );
}
