"use client";

import { useState } from "react";
import { Plus, Trash2, X, CheckCircle2, HelpCircle } from "lucide-react";
import type { ExerciseItem, ExerciseType } from "@/types/course";

const EXERCISE_TYPES: { value: ExerciseType; label: string }[] = [
  { value: "multiple_choice", label: "Escolha Múltipla" },
  { value: "true_false", label: "Verdadeiro/Falso" },
  { value: "short_answer", label: "Resposta Curta" },
];

interface ExerciseEditorProps {
  exercises: ExerciseItem[];
  onChange: (exercises: ExerciseItem[]) => void;
}

export default function ExerciseEditor({ exercises, onChange }: ExerciseEditorProps) {
  const [open, setOpen] = useState(false);

  const add = (type: ExerciseType) => {
    const base: ExerciseItem = {
      question: "",
      type,
      correctAnswer: "",
    };
    if (type === "multiple_choice") base.options = ["", ""];
    onChange([...exercises, base]);
  };

  const remove = (idx: number) => {
    onChange(exercises.filter((_, i) => i !== idx));
  };

  const update = (idx: number, field: keyof ExerciseItem, value: unknown) => {
    const u = [...exercises];
    (u[idx] as unknown as Record<string, unknown>)[field] = value;
    onChange(u);
  };

  const addOption = (idx: number) => {
    const u = [...exercises];
    u[idx].options = [...(u[idx].options || []), ""];
    onChange(u);
  };

  const updateOption = (idx: number, oi: number, value: string) => {
    const u = [...exercises];
    if (u[idx].options) u[idx].options![oi] = value;
    onChange(u);
  };

  const removeOption = (idx: number, oi: number) => {
    const u = [...exercises];
    u[idx].options = (u[idx].options || []).filter((_, i) => i !== oi);
    if (u[idx].correctAnswer === u[idx].options?.[oi]) u[idx].correctAnswer = "";
    onChange(u);
  };

  return (
    <div className="space-y-2">
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-400 transition-colors">
        <HelpCircle className="h-3.5 w-3.5" />
        Exercícios ({exercises.length})
        <span className="text-gray-600">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="space-y-3 pl-4 border-l border-gray-800">
          {exercises.map((ex, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-bold shrink-0">#{i + 1}</span>
                <select value={ex.type} onChange={e => update(i, "type", e.target.value as ExerciseType)}
                  className="bg-gray-800 border border-gray-700 px-2 py-1 text-sm text-white focus:outline-none">
                  {EXERCISE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <button type="button" onClick={() => remove(i)}
                  className="ml-auto p-1 text-gray-600 hover:text-red-400 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <textarea value={ex.question} onChange={e => update(i, "question", e.target.value)}
                placeholder="Escreve a pergunta..."
                rows={2}
                className="w-full bg-gray-950 border border-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 resize-none" />

              {ex.type === "multiple_choice" && (
                <div className="space-y-1.5 pl-2">
                  {ex.options?.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <button type="button" onClick={() => update(i, "correctAnswer", opt)}
                        className={`shrink-0 h-5 w-5 flex items-center justify-center border transition-colors ${
                          ex.correctAnswer === opt
                            ? "bg-green-600 border-green-500 text-white"
                            : "border-gray-700 text-transparent hover:border-gray-500"
                        }`}>
                        {ex.correctAnswer === opt && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </button>
                      <input type="text" value={opt} onChange={e => updateOption(i, oi, e.target.value)}
                        placeholder={`Opção ${oi + 1}`}
                        className="flex-1 bg-gray-950 border border-gray-800 px-2.5 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
                      <button type="button" onClick={() => removeOption(i, oi)}
                        className="p-0.5 text-gray-600 hover:text-red-400 opacity-0 hover:opacity-100 transition-all">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addOption(i)}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-400 transition-colors">
                    <Plus className="h-3 w-3" /> Adicionar opção
                  </button>
                  <p className="text-[13px] text-gray-600">Clica no quadrado ao lado para marcar a resposta correta.</p>
                </div>
              )}

              {ex.type === "true_false" && (
                <div className="flex gap-2 pl-2">
                  {["true", "false"].map(val => (
                    <button key={val} type="button" onClick={() => update(i, "correctAnswer", val)}
                      className={`px-4 py-1.5 text-sm font-bold border transition-colors ${
                        ex.correctAnswer === val
                          ? "bg-green-600 border-green-500 text-white"
                          : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500"
                      }`}>
                      {val === "true" ? "Verdadeiro" : "Falso"}
                    </button>
                  ))}
                </div>
              )}

              {ex.type === "short_answer" && (
                <div className="pl-2">
                  <input type="text" value={ex.correctAnswer} onChange={e => update(i, "correctAnswer", e.target.value)}
                    placeholder="Resposta correta..."
                    className="w-full bg-gray-950 border border-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
                </div>
              )}

              <input type="text" value={ex.explanation || ""} onChange={e => update(i, "explanation", e.target.value)}
                placeholder="Explicação (opcional — aparece após responder)"
                className="w-full bg-gray-950 border border-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
            </div>
          ))}

          <div className="flex gap-1.5">
            {EXERCISE_TYPES.map(t => (
              <button key={t.value} type="button" onClick={() => add(t.value)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors">
                <Plus className="h-3 w-3" /> {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
