"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getQuiz, submitQuizAnswers, listenQuizResults } from "@/lib/quiz";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, CheckCircle2, XCircle, Trophy, RotateCcw, BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";
import QuizPlayer from "@/components/quiz/QuizPlayer";
import type { ModuleQuiz, ModuleQuizResult } from "@/types/quiz";

export default function ModuleQuizPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id as string;
  const moduleIndex = Number(params?.moduleIndex);
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<ModuleQuiz | null>(null);
  const [results, setResults] = useState<ModuleQuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<ModuleQuizResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!courseId || !user || isNaN(moduleIndex)) return;
    const load = async () => {
      const q = query(
        collection(db, "moduleQuizzes"),
        where("courseId", "==", courseId),
        where("moduleIndex", "==", moduleIndex),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setQuiz({ id: snap.docs[0].id, ...snap.docs[0].data() } as ModuleQuiz);
      }
      setLoading(false);
    };
    load();
  }, [courseId, moduleIndex, user]);

  useEffect(() => {
    if (!user || !courseId) return;
    const unsub = listenQuizResults(user.uid, courseId, (res) => {
      setResults(res);
    });
    return () => unsub();
  }, [user?.uid, courseId]);

  const handleFinish = async (answers: Record<string, number>) => {
    if (!user || !quiz) return;
    setSubmitting(true);
    try {
      const result = await submitQuizAnswers(user.uid, user.displayName || "Aluno", quiz, answers);
      setLastResult({
        quizId: quiz.id!,
        courseId: quiz.courseId,
        moduleIndex: quiz.moduleIndex,
        userId: user.uid,
        userName: user.displayName || "Aluno",
        score: result.score,
        passed: result.passed,
        answers,
        attempt: results.length + 1,
      });
      setShowResult(true);
    } catch {}
    setSubmitting(false);
  };

  const moduleResults = results.filter((r) => r.moduleIndex === moduleIndex);
  const canRetry = quiz ? moduleResults.length < quiz.maxAttempts : false;
  const bestResult = moduleResults.length > 0
    ? moduleResults.reduce((best, r) => (r.score > best.score ? r : best), moduleResults[0])
    : null;

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-purple" /></div>;
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center text-gray-600">
        <BookOpen className="h-12 w-12 mb-4 opacity-40" />
        <p className="text-sm font-medium">Nenhum quiz disponível para este módulo</p>
        <Link href={`/dashboard/courses/${courseId}`} className="mt-4 text-sm text-purple hover:text-purple-light">
          Voltar ao curso
        </Link>
      </div>
    );
  }

  // Show result screen
  if (showResult && lastResult) {
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center h-20 w-20 mb-4 ${
            lastResult.passed ? "bg-green-500/20" : "bg-red-500/20"
          }`}>
            {lastResult.passed
              ? <Trophy className="h-10 w-10 text-green-400" />
              : <XCircle className="h-10 w-10 text-red-400" />
            }
          </div>
          <h1 className={`text-3xl font-bold ${lastResult.passed ? "text-green-400" : "text-red-400"}`}>
            {lastResult.passed ? "Aprovado!" : "Não Aprovado"}
          </h1>
          <p className="text-5xl font-bold text-white mt-4">{lastResult.score}%</p>
          <p className="text-sm text-gray-500 mt-2">
            Tentativa {lastResult.attempt} de {quiz.maxAttempts} · Nota mínima: {quiz.passingScore}%
          </p>
        </div>

        {/* Review */}
        <div className="bg-gray-900/40 border border-gray-800 p-6 mb-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Revisão das Respostas</h3>
          <div className="space-y-4">
            {quiz.questions.map((q, qi) => {
              const userAnswer = lastResult!.answers[q.id];
              const correct = userAnswer === q.correctAnswer;
              return (
                <div key={q.id} className={`border-l-4 p-4 ${
                  correct ? "border-green-600 bg-green-950/10" : "border-red-600 bg-red-950/10"
                }`}>
                  <div className="flex items-start gap-3">
                    {correct
                      ? <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                      : <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                    }
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white mb-2">{q.question}</p>
                      <div className="space-y-1">
                        {q.options.map((opt, oi) => {
                          const isCorrect = oi === q.correctAnswer;
                          const isUserChoice = oi === userAnswer;
                          let className = "text-sm px-3 py-1.5 border ";
                          if (isCorrect) className += "border-green-700 bg-green-950/20 text-green-300";
                          else if (isUserChoice && !correct) className += "border-red-700 bg-red-950/20 text-red-300";
                          else className += "border-gray-800 text-gray-500";
                          return <div key={oi} className={className}>{opt}</div>;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          {!lastResult.passed && canRetry && (
            <button onClick={() => { setShowResult(false); setLastResult(null); }}
              className="flex items-center gap-2 px-6 py-3 bg-purple hover:bg-purple-light text-white font-bold transition-colors">
              <RotateCcw className="h-4 w-4" /> Tentar novamente
            </button>
          )}
          <Link href={`/dashboard/courses/${courseId}`}
            className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium transition-colors">
            <ArrowLeft className="h-4 w-4" /> Voltar ao curso
          </Link>
        </div>
      </div>
    );
  }

  // Previous attempts info
  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/dashboard/courses/${courseId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-3">
          <ArrowLeft className="h-4 w-4" /> Voltar ao curso
        </Link>
        <h1 className="text-2xl font-bold text-white">Quiz — Módulo {moduleIndex + 1}</h1>
        <p className="text-sm text-gray-400 mt-1">
          {quiz.questions.length} perguntas · Nota mínima: {quiz.passingScore}% · {quiz.maxAttempts} tentativas
        </p>
      </div>

      {/* Previous attempts */}
      {moduleResults.length > 0 && (
        <div className="bg-gray-900/40 border border-gray-800 p-4 mb-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Tentativas anteriores</h3>
          <div className="flex items-center gap-4">
            {moduleResults.map((r, i) => (
              <div key={r.id} className={`px-3 py-1.5 text-sm font-bold ${
                r.passed ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
              }`}>
                #{i + 1}: {r.score}% {r.passed ? "✓" : "✗"}
              </div>
            ))}
            {bestResult && (
              <span className="text-sm text-gray-500 ml-auto">
                Melhor: {bestResult.score}% {bestResult.passed ? "(aprovado)" : ""}
              </span>
            )}
          </div>
        </div>
      )}

      {!canRetry && bestResult && !bestResult.passed && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 mb-6 text-sm text-red-400">
          Esgotaste o número máximo de tentativas ({quiz.maxAttempts}).
        </div>
      )}

      {canRetry && (
        <QuizPlayer quiz={quiz} onFinish={handleFinish} submitting={submitting} />
      )}
    </div>
  );
}
