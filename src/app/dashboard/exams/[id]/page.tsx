"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Loader2, AlertCircle, Clock } from "lucide-react";
import type { Exam, ExamResult } from "@/types/exam";

export default function TakeExamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [error, setError] = useState("");
  const autoSubmitted = useRef(false);

  // Load exam
  useEffect(() => {
    if (!id || !user) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "exams", id));
        if (!snap.exists()) { router.push("/dashboard/exams"); return; }
        const data = { id: snap.id, ...snap.data() } as Exam;
        setExam(data);
        if (data.timeLimit) setTimeLeft(data.timeLimit * 60);

        // Check existing attempts — count actual result docs for this exam
        const resSnap = await getDocs(
          query(collection(db, "exam-results", user.uid, "exams"), where("examId", "==", id))
        );
        const attempts = resSnap.size;
        if (attempts >= data.maxAttempts) {
          router.push(`/dashboard/exams/${id}/result`);
          return;
        }
      } catch { router.push("/dashboard/exams"); } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user, router]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // Auto-submit when timer reaches 0 (exactly once)
  useEffect(() => {
    if (timeLeft !== 0) {
      autoSubmitted.current = false;
      return;
    }
    if (autoSubmitted.current) return;
    autoSubmitted.current = true;
    handleSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const handleSubmit = useCallback(async () => {
    if (!exam || !user || submitting) return;
    setSubmitting(true);
    try {
      let correct = 0;
      exam.questions.forEach((q) => {
        if (answers[q.id] === q.correctAnswer) correct++;
      });
      const score = (correct / exam.questions.length) * 100;
      const passed = score >= exam.passingScore;

      await addDoc(collection(db, "exam-results", user.uid, "exams"), {
        examId: exam.id,
        examTitle: exam.title,
        courseId: exam.courseId,
        userId: user.uid,
        userName: user.displayName || "Aluno",
        answers,
        score,
        passed,
        completedAt: serverTimestamp(),
      });

      router.push(`/dashboard/exams/${id}/result`);
    } catch {
      setError("Erro ao submeter avaliação. Tenta novamente.");
      setSubmitting(false);
    }
  }, [exam, user, answers, submitting, id, router]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple" />
      </div>
    );
  }

  if (!exam) return null;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <button onClick={() => router.push("/dashboard/exams")} className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1 mb-2">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <h1 className="text-2xl font-bold text-white">{exam.title}</h1>
          <p className="text-gray-400 mt-1">{exam.description}</p>
        </div>
        {timeLeft !== null && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-bold shrink-0 ${
            timeLeft < 120 ? "bg-red-500/20 text-red-400" : "bg-gray-800 text-gray-300"
          }`}>
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20 mb-6">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {exam.questions.map((q, i) => (
          <div key={q.id} className="bg-gray-900/40 border border-gray-800 p-5 sm:p-6">
            <p className="text-sm text-gray-500 mb-1">Pergunta {i + 1} de {exam.questions.length}</p>
            <p className="text-lg font-semibold text-white mb-4">{q.question}</p>

            {q.type === "multiple_choice" && q.options && (
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <label key={oi}
                    className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${
                      answers[q.id] === String(oi)
                        ? "border-purple bg-purple/10"
                        : "border-gray-800 bg-gray-950/40 hover:border-gray-700"
                    }`}>
                    <input type="radio" name={q.id} value={String(oi)}
                      checked={answers[q.id] === String(oi)}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: String(oi) }))}
                      className="accent-purple" />
                    <span className="text-white">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === "true_false" && (
              <div className="flex gap-3">
                {["Verdadeiro", "Falso"].map((opt, oi) => (
                  <label key={oi}
                    className={`flex items-center gap-2 px-5 py-3 border cursor-pointer transition-colors ${
                      answers[q.id] === String(oi)
                        ? "border-purple bg-purple/10"
                        : "border-gray-800 bg-gray-950/40 hover:border-gray-700"
                    }`}>
                    <input type="radio" name={q.id} value={String(oi)}
                      checked={answers[q.id] === String(oi)}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: String(oi) }))}
                      className="accent-purple" />
                    <span className="text-white">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === "short_answer" && (
              <input type="text"
                value={answers[q.id] || ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                placeholder="Escreve a tua resposta..."
                className="w-full bg-gray-950/40 border border-gray-800 focus:border-purple/50 py-3 px-4 text-white placeholder-gray-600 focus:outline-none transition-colors" />
            )}
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500">
          {Object.keys(answers).length} de {exam.questions.length} respondidas
        </p>
        <button
          onClick={handleSubmit}
          disabled={submitting || Object.keys(answers).length < exam.questions.length}
          className="bg-green hover:bg-green-light text-gray-900 px-8 py-4 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submeter Avaliação"}
        </button>
      </div>
    </div>
  );
}
