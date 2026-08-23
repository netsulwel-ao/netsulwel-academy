"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createQuiz } from "@/lib/quiz";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import QuizForm from "@/components/quiz/QuizForm";
import type { ModuleQuizQuestion } from "@/types/quiz";

export default function CreateQuizPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = params?.id;
  const moduleIndex = Number(searchParams?.get("module")) || 0;
  const { user } = useAuth();

  const [courseTitle, setCourseTitle] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!courseId || typeof courseId !== "string" || !user) return;
    const load = async () => {
      const snap = await getDoc(doc(db, "courses", courseId));
      if (snap.exists()) {
        const data = snap.data();
        setCourseTitle(data.title || "");
        const mod = (data.modules || [])[moduleIndex];
        setModuleTitle(mod?.title || `Módulo ${moduleIndex + 1}`);
      }
      setLoading(false);
    };
    load();
  }, [courseId, user, moduleIndex]);

  const handleSave = async (data: { questions: ModuleQuizQuestion[]; passingScore: number; maxAttempts: number }) => {
    if (!user || !courseId || typeof courseId !== "string") return;
    setSaving(true);
    try {
      await createQuiz({
        courseId,
        moduleIndex,
        moduleTitle,
        questions: data.questions,
        passingScore: data.passingScore,
        maxAttempts: data.maxAttempts,
        createdBy: user.uid,
      });
      router.push(`/dashboard/teacher/courses/${courseId}/quizzes`);
    } catch {}
    setSaving(false);
  };

  if (loading || !courseId || typeof courseId !== "string") {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 animate-spin text-purple" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <Link href={`/dashboard/teacher/courses/${courseId}/quizzes`}
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4">
        <ChevronLeft className="h-4 w-4" /> Voltar aos quizzes
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Criar Quiz</h1>
        <p className="text-sm text-gray-400 mt-1">
          {courseTitle} — {moduleTitle}
        </p>
      </div>

      <QuizForm onSave={handleSave} saving={saving} />
    </div>
  );
}
