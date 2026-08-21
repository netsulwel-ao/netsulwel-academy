"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { generateQuestionId } from "@/lib/quiz";
import type { ModuleQuizQuestion } from "@/types/quiz";

interface QuizFormProps {
  initialQuestions?: ModuleQuizQuestion[];
  initialPassingScore?: number;
  initialMaxAttempts?: number;
  onSave: (data: { questions: ModuleQuizQuestion[]; passingScore: number; maxAttempts: number }) => Promise<void>;
  saving?: boolean;
}

export default function QuizForm({ initialQuestions, initialPassingScore, initialMaxAttempts, onSave, saving }: QuizFormProps) {
  const [questions, setQuestions] = useState<ModuleQuizQuestion[]>(initialQuestions || []);
  const [passingScore, setPassingScore] = useState(initialPassingScore ?? 70);
  const [maxAttempts, setMaxAttempts] = useState(initialMaxAttempts ?? 3);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: generateQuestionId(),
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ]);
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, field: keyof ModuleQuizQuestion, value: ModuleQuizQuestion[keyof ModuleQuizQuestion]) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  };

  const updateOption = (qId: string, optIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? { ...q, options: q.options.map((opt, i) => (i === optIndex ? value : opt)) }
          : q
      )
    );
  };

  const addOption = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, options: [...q.options, ""] } : q))
    );
  };

  const removeOption = (qId: string, optIndex: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const newOpts = q.options.filter((_, i) => i !== optIndex);
        const newCorrect = q.correctAnswer === optIndex ? 0
          : q.correctAnswer > optIndex ? q.correctAnswer - 1
          : q.correctAnswer;
        return { ...q, options: newOpts, correctAnswer: newCorrect };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ questions, passingScore, maxAttempts });
  };

  const isValid = questions.length > 0 && questions.every((q) => q.question.trim() && q.options.every((o) => o.trim()));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Settings */}
      <div className="bg-gray-900 border border-gray-800 p-5">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Configurações</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Nota mínima (%)</label>
            <input type="number" min={0} max={100} value={passingScore}
              onChange={(e) => setPassingScore(Number(e.target.value))}
              className="w-full border border-gray-700 bg-gray-950 text-white px-3 py-2.5 text-sm focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Máximo de tentativas</label>
            <input type="number" min={1} max={10} value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value))}
              className="w-full border border-gray-700 bg-gray-950 text-white px-3 py-2.5 text-sm focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple" />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="bg-gray-900 border border-gray-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            Perguntas ({questions.length})
          </h3>
          <button type="button" onClick={addQuestion}
            className="flex items-center gap-2 px-3 py-2 bg-purple hover:bg-purple-light text-white text-sm font-bold transition-colors">
            <Plus className="h-4 w-4" /> Adicionar Pergunta
          </button>
        </div>

        {questions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">Nenhuma pergunta. Clique em &quot;Adicionar Pergunta&quot; para começar.</p>
        ) : (
          <div className="space-y-4">
            {questions.map((q, qi) => (
              <div key={q.id} className="bg-gray-950 border border-gray-800 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm font-bold text-purple-400 shrink-0">#{qi + 1}</span>
                    <input type="text" value={q.question}
                      onChange={(e) => updateQuestion(q.id, "question", e.target.value)}
                      placeholder="Escreva a pergunta..."
                      className="flex-1 border border-gray-700 bg-gray-950 text-white px-3 py-2 text-sm focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple" />
                  </div>
                  <button type="button" onClick={() => removeQuestion(q.id)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2 ml-7">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" name={`correct_${q.id}`} checked={q.correctAnswer === oi}
                        onChange={() => updateQuestion(q.id, "correctAnswer", oi)}
                        className="h-4 w-4 shrink-0 text-purple focus:ring-purple cursor-pointer"
                        style={{ accentColor: "#7c3aed" }} />
                      <input type="text" value={opt}
                        onChange={(e) => updateOption(q.id, oi, e.target.value)}
                        placeholder={`Opção ${oi + 1}${q.correctAnswer === oi ? " (correta)" : ""}`}
                        className={`flex-1 border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                          q.correctAnswer === oi
                            ? "border-green-700 bg-green-950/20 text-green-300 focus:border-green-500 focus:ring-green-500"
                            : "border-gray-700 bg-gray-950 text-white focus:border-purple focus:ring-purple"
                        }`} />
                      {q.options.length > 2 && (
                        <button type="button" onClick={() => removeOption(q.id, oi)}
                          className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => addOption(q.id)}
                    className="text-sm text-gray-500 hover:text-purple-400 transition-colors ml-6 mt-1">
                    + Adicionar opção
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        <button type="submit" disabled={!isValid || saving}
          className="px-6 py-3 bg-purple hover:bg-purple-light text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? "A guardar..." : "Guardar Quiz"}
        </button>
      </div>
    </form>
  );
}
