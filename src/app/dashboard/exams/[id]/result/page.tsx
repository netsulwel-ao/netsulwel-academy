"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc, getDocs, collection, query, orderBy, limit } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, XCircle, ArrowLeft, Loader2, BookOpen, FileText } from "lucide-react";
import type { Exam, ExamResult } from "@/types/exam";

export default function ExamResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [result, setResult] = useState<ExamResult | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;
    const load = async () => {
      try {
        const q = query(
          collection(db, "exam-results", user.uid, "exams"),
          orderBy("completedAt", "desc"),
          limit(1)
        );
        const resSnap = await getDocs(q);
        let found = false;
        resSnap.forEach((d) => {
          const data = d.data() as ExamResult;
          if (data.examId === id) {
            setResult({ ...data, id: d.id });
            found = true;
          }
        });
        if (!found) { router.push("/dashboard/exams"); return; }

        const examSnap = await getDoc(doc(db, "exams", id));
        if (examSnap.exists()) {
          setExam({ id: examSnap.id, ...examSnap.data() } as Exam);
        }
      } catch { router.push("/dashboard/exams"); } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple" />
      </div>
    );
  }

  if (!result || !exam) return null;

  const answeredCount = Object.keys(result.answers).length;

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      <button onClick={() => router.push("/dashboard/exams")} className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1 mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar às avaliações
      </button>

      {/* Score card */}
      <div className={`border p-8 sm:p-10 text-center mb-8 ${
        result.passed ? "bg-green-500/5 border-green-500/30" : "bg-red-500/5 border-red-500/30"
      }`}>
        {result.passed
          ? <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
          : <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        }
        <h1 className="text-3xl font-bold text-white mb-2">
          {result.passed ? "Aprovado!" : "Não foi desta vez"}
        </h1>
        <p className="text-gray-400 mb-4">{exam.title}</p>
        <div className="text-6xl font-extrabold text-white mb-2">
          {Math.round(result.score)}%
        </div>
        <p className="text-gray-400">
          Nota mínima: {exam.passingScore}% &middot; {answeredCount} de {exam.questions.length} perguntas
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href={`/dashboard/exams/${id}`} className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 font-bold transition-colors">
            Tentar novamente
          </Link>
          {exam.courseId && (
            <Link href={`/dashboard/courses/${exam.courseId}`} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-5 py-3 font-bold transition-colors">
              <BookOpen className="h-4 w-4" /> Ir para o curso
            </Link>
          )}
        </div>
      </div>

      {/* Review answers */}
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-purple-400" /> Revisão das respostas
      </h2>
      <div className="space-y-4">
        {exam.questions.map((q, i) => {
          const userAnswer = result.answers[q.id];
          const correct = userAnswer === q.correctAnswer;
          return (
            <div key={q.id} className={`border p-5 ${
              correct ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"
            }`}>
              <div className="flex items-start gap-3">
                {correct
                  ? <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                  : <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                }
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-500 mb-1">Pergunta {i + 1}</p>
                  <p className="text-white font-semibold mb-3">{q.question}</p>
                  {q.type === "multiple_choice" && q.options && (
                    <div className="space-y-1">
                      {q.options.map((opt, oi) => {
                        const isUserAnswer = userAnswer === String(oi);
                        const isCorrectAnswer = q.correctAnswer === String(oi);
                        return (
                          <div key={oi} className={`flex items-center gap-2 px-3 py-2 text-sm ${
                            isCorrectAnswer ? "bg-green-500/10 text-green-300" :
                            isUserAnswer && !isCorrectAnswer ? "bg-red-500/10 text-red-300" :
                            "text-gray-400"
                          }`}>
                            {isCorrectAnswer && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                            {isUserAnswer && !isCorrectAnswer && <XCircle className="h-4 w-4 shrink-0" />}
                            <span>{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {q.type === "true_false" && (
                    <div className="flex gap-3">
                      {["Verdadeiro", "Falso"].map((opt, oi) => {
                        const isUserAnswer = userAnswer === String(oi);
                        const isCorrectAnswer = q.correctAnswer === String(oi);
                        return (
                          <div key={oi} className={`flex items-center gap-2 px-4 py-2 text-sm ${
                            isCorrectAnswer ? "bg-green-500/10 text-green-300" :
                            isUserAnswer && !isCorrectAnswer ? "bg-red-500/10 text-red-300" :
                            "text-gray-500 bg-gray-900/40"
                          }`}>
                            {isCorrectAnswer && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                            {isUserAnswer && !isCorrectAnswer && <XCircle className="h-4 w-4 shrink-0" />}
                            <span>{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {q.type === "short_answer" && (
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Tua resposta: </span>
                        <span className={correct ? "text-green-300" : "text-red-300"}>{userAnswer || "(sem resposta)"}</span>
                      </div>
                      {!correct && (
                        <div>
                          <span className="text-gray-500">Resposta correta: </span>
                          <span className="text-green-300">{q.correctAnswer}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
