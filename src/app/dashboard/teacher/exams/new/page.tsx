"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { ArrowLeft, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import type { Question, Exam } from "@/types/exam";
import type { Course } from "@/types/course";

const emptyQuestion = (): Question => ({
  id: crypto.randomUUID(),
  type: "multiple_choice",
  question: "",
  options: ["", "", "", ""],
  correctAnswer: "0",
  points: 1,
});

export default function NewExamPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [passingScore, setPassingScore] = useState(60);
  const [timeLimit, setTimeLimit] = useState(30);
  const [maxAttempts, setMaxAttempts] = useState(2);
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    getDocs(query(collection(db, "courses"), where("createdBy", "==", user.uid))).then((snap) => {
      setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course)));
    });
  }, [user]);

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);

  const removeQuestion = (i: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateQuestion = (i: number, field: keyof Question, value: unknown) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value } as Question;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!user) return;
    setError("");

    if (!title.trim()) { setError("O título é obrigatório."); return; }
    if (!courseId) { setError("Seleciona um curso."); return; }
    if (questions.some((q) => !q.question.trim())) { setError("Todas as perguntas precisam de ter texto."); return; }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "exams"), {
        courseId,
        courseTitle: courses.find((c) => c.id === courseId)?.title || "",
        title: title.trim(),
        description: description.trim(),
        questions,
        passingScore,
        timeLimit,
        maxAttempts,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      } as Exam);
      router.push("/dashboard/teacher/exams");
    } catch {
      setError("Erro ao criar avaliação. Tenta novamente.");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      <button onClick={() => router.push("/dashboard/teacher/exams")} className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1 mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-8">Nova Avaliação</h1>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20 mb-6">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Basic info */}
      <div className="bg-gray-900/40 border border-gray-800 p-5 sm:p-6 space-y-4 mb-6">
        <h2 className="text-base font-bold text-white uppercase tracking-wider">Informação básica</h2>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Título</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray-950/40 border border-gray-800 focus:border-purple/50 py-3 px-4 text-white placeholder-gray-600 focus:outline-none transition-colors"
            placeholder="Ex: Teste de Matemática Financeira" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Descrição</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            className="w-full bg-gray-950/40 border border-gray-800 focus:border-purple/50 py-3 px-4 text-white placeholder-gray-600 focus:outline-none transition-colors resize-none"
            placeholder="Ex: Avaliação sobre juros compostos e amortização" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Curso</label>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)}
            className="w-full bg-gray-950/40 border border-gray-800 focus:border-purple/50 py-3 px-4 text-white focus:outline-none transition-colors">
            <option value="">Selecionar curso...</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nota mínima (%)</label>
            <input type="number" value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} min={0} max={100}
              className="w-full bg-gray-950/40 border border-gray-800 focus:border-purple/50 py-3 px-4 text-white focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tempo limite (min)</label>
            <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} min={0}
              className="w-full bg-gray-950/40 border border-gray-800 focus:border-purple/50 py-3 px-4 text-white focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Máx. tentativas</label>
            <input type="number" value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value))} min={1}
              className="w-full bg-gray-950/40 border border-gray-800 focus:border-purple/50 py-3 px-4 text-white focus:outline-none transition-colors" />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white uppercase tracking-wider">Perguntas</h2>
          <button onClick={addQuestion} className="flex items-center gap-1 text-sm text-green-400 hover:text-green-300 font-bold transition-colors">
            <Plus className="h-4 w-4" /> Adicionar Pergunta
          </button>
        </div>

        {questions.map((q, i) => (
          <div key={q.id} className="bg-gray-900/40 border border-gray-800 p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="text-sm font-bold text-gray-400">Pergunta {i + 1}</span>
              {questions.length > 1 && (
                <button onClick={() => removeQuestion(i)} className="text-red-400 hover:text-red-300 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              <input type="text" value={q.question} onChange={(e) => updateQuestion(i, "question", e.target.value)}
                className="w-full bg-gray-950/40 border border-gray-800 focus:border-purple/50 py-2.5 px-3 text-white placeholder-gray-600 focus:outline-none transition-colors text-sm"
                placeholder="Escreve a pergunta..." />

              <div className="flex items-center gap-4">
                <label className="text-xs text-gray-400">Tipo:</label>
                <select value={q.type} onChange={(e) => {
                  const type = e.target.value as Question["type"];
                  const opts = type === "true_false" ? ["Verdadeiro", "Falso"] : type === "multiple_choice" ? ["", "", "", ""] : [];
                  setQuestions((prev) => {
                    const next = [...prev];
                    next[i] = { ...next[i], type, options: opts, correctAnswer: "0" } as Question;
                    return next;
                  });
                }}
                  className="bg-gray-950/40 border border-gray-800 focus:border-purple/50 py-2 px-3 text-white text-sm focus:outline-none">
                  <option value="multiple_choice">Múltipla Escolha</option>
                  <option value="true_false">Verdadeiro/Falso</option>
                  <option value="short_answer">Resposta Curta</option>
                </select>
              </div>

              {q.type === "multiple_choice" && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" name={`correct-${q.id}`} checked={q.correctAnswer === String(oi)}
                        onChange={() => updateQuestion(i, "correctAnswer", String(oi))} className="accent-green-500 shrink-0" />
                      <input type="text" value={opt} onChange={(e) => {
                        const newOpts = [...(q.options || [])];
                        newOpts[oi] = e.target.value;
                        updateQuestion(i, "options", newOpts);
                      }}
                        className="flex-1 bg-gray-950/40 border border-gray-800 focus:border-purple/50 py-2 px-3 text-white placeholder-gray-600 focus:outline-none transition-colors text-sm"
                        placeholder={`Opção ${oi + 1}`} />
                    </div>
                  ))}
                  <p className="text-xs text-gray-600 mt-1">Seleciona o círculo da opção correta.</p>
                </div>
              )}

              {q.type === "true_false" && (
                <div className="flex gap-3">
                  {["Verdadeiro", "Falso"].map((opt, oi) => (
                    <label key={oi} className={`flex items-center gap-2 px-4 py-2 border cursor-pointer text-sm ${
                      q.correctAnswer === String(oi) ? "border-green-500/50 bg-green-500/10 text-green-300" : "border-gray-800 text-gray-400"
                    }`}>
                      <input type="radio" name={`tf-${q.id}`} checked={q.correctAnswer === String(oi)}
                        onChange={() => updateQuestion(i, "correctAnswer", String(oi))} className="accent-green-500" />
                      {opt}
                    </label>
                  ))}
                </div>
              )}

              {q.type === "short_answer" && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Resposta correta:</label>
                  <input type="text" value={q.correctAnswer} onChange={(e) => updateQuestion(i, "correctAnswer", e.target.value)}
                    className="w-full bg-gray-950/40 border border-gray-800 focus:border-purple/50 py-2.5 px-3 text-white placeholder-gray-600 focus:outline-none transition-colors text-sm"
                    placeholder="Ex: 15%" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      <button onClick={handleSubmit} disabled={submitting}
        className="w-full bg-green hover:bg-green-light text-gray-900 py-4 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Criar Avaliação"}
      </button>
    </div>
  );
}
