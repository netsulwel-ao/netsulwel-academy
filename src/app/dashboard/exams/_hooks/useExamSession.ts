"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc, getDoc, addDoc,
  collection, query, where,
  getDocs, serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";
import type { Exam } from "../_types/exams";
import { calcScore } from "../_types/exams";

interface UseExamSessionReturn {
  exam: Exam | null;
  answers: Record<string, string>;
  setAnswer: (questionId: string, value: string) => void;
  timeLeft: number | null;
  loading: boolean;
  submitting: boolean;
  error: string;
  answeredCount: number;
  submit: () => Promise<void>;
}

export function useExamSession(examId: string): UseExamSessionReturn {
  const router = useRouter();
  const { user } = useAuth();

  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const autoSubmitted = useRef(false);

  // ── Carregar exame ────────────────────────────────────────────
  useEffect(() => {
    if (!examId || !user) return;
    let cancelled = false;

    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "exams", examId));
        if (!snap.exists()) { router.push("/dashboard/exams"); return; }

        const data = { id: snap.id, ...snap.data() } as Exam;

        // Verificar se ainda há tentativas disponíveis
        const resSnap = await getDocs(
          query(
            collection(db, "exam-results", user.uid, "exams"),
            where("examId", "==", examId)
          )
        );
        if (resSnap.size >= data.maxAttempts) {
          router.push(`/dashboard/exams/${examId}/result`);
          return;
        }

        if (!cancelled) {
          setExam(data);
          if (data.timeLimit) setTimeLeft(data.timeLimit * 60);
        }
      } catch (err) {
        logger.error("useExamSession: failed to load exam", err, { examId });
        if (!cancelled) router.push("/dashboard/exams");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [examId, user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Timer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft(prev => (prev !== null ? prev - 1 : null)), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  // ── Auto-submit quando o tempo acaba ─────────────────────────
  const submit = useCallback(async () => {
    if (!exam || !user || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const score = calcScore(exam, answers);
      const passed = score >= exam.passingScore;

      await addDoc(collection(db, "exam-results", user.uid, "exams"), {
        examId: exam.id,
        examTitle: exam.title,
        courseId: exam.courseId,
        userId: user.uid,
        userName: user.displayName ?? "Aluno",
        answers,
        score,
        passed,
        completedAt: serverTimestamp(),
      });

      router.push(`/dashboard/exams/${examId}/result`);
    } catch (err) {
      logger.error("useExamSession: failed to submit", err, { examId });
      setError("Erro ao submeter avaliação. Tenta novamente.");
      setSubmitting(false);
    }
  }, [exam, user, answers, submitting, examId, router]);

  useEffect(() => {
    if (timeLeft !== 0) { autoSubmitted.current = false; return; }
    if (autoSubmitted.current) return;
    autoSubmitted.current = true;
    submit();
  }, [timeLeft, submit]);

  const setAnswer = useCallback((questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }, []);

  return {
    exam,
    answers,
    setAnswer,
    timeLeft,
    loading,
    submitting,
    error,
    answeredCount: Object.keys(answers).length,
    submit,
  };
}
