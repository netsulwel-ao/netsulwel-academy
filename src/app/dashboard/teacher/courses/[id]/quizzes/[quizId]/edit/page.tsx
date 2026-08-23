"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getQuiz, updateQuiz } from "@/lib/quiz";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import QuizForm from "@/components/quiz/QuizForm";
import type { ModuleQuiz, ModuleQuizQuestion } from "@/types/quiz";

export default function EditQuizPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id;
  const quizId = params?.quizId;
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<ModuleQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!quizId || typeof quizId !== "string") return;
    getQuiz(quizId).then((q) => {
      setQuiz(q);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [quizId]);

  const handleSave = async (data: { questions: ModuleQuizQuestion[]; passingScore: number; maxAttempts: number }) => {
    if (!quizId || typeof quizId !== "string" || !user) return;
    const qid = quizId;
    setSaving(true);
    try {
      await updateQuiz(qid, {
        questions: data.questions,
        passingScore: data.passingScore,
        maxAttempts: data.maxAttempts,
      });
      router.push(`/dashboard/teacher/courses/${courseId as string}/quizzes`);
    } catch {}
    setSaving(false);
  };

  if (loading || !courseId || typeof courseId !== "string" || !quizId || typeof quizId !== "string") {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 animate-spin text-purple" /></div>;
  }

  if (!quiz) {
    return <div className="text-center py-20 text-gray-500">Quiz não encontrado</div>;
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <Link href={`/dashboard/teacher/courses/${courseId}/quizzes`}
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4">
        <ChevronLeft className="h-4 w-4" /> Voltar aos quizzes
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Editar Quiz</h1>
        <p className="text-sm text-gray-400 mt-1">
          {quiz.moduleTitle} — {quiz.courseId}
        </p>
      </div>

      <QuizForm
        initialQuestions={quiz.questions}
        initialPassingScore={quiz.passingScore}
        initialMaxAttempts={quiz.maxAttempts}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
