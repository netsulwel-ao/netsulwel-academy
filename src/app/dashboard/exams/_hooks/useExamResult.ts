"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc, getDoc, getDocs,
  collection, query, where, orderBy,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";
import type { Exam, ExamResult } from "../_types/exams";

interface UseExamResultReturn {
  exam: Exam | null;
  result: ExamResult | null;
  allResults: ExamResult[];   // todas as tentativas, para mostrar histórico
  loading: boolean;
}

export function useExamResult(examId: string): UseExamResultReturn {
  const router = useRouter();
  const { user } = useAuth();

  const [exam, setExam] = useState<Exam | null>(null);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [allResults, setAllResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!examId || !user) return;
    let cancelled = false;

    const load = async () => {
      try {
        // Buscar TODOS os resultados deste exame, ordenados por data desc
        const resSnap = await getDocs(
          query(
            collection(db, "exam-results", user.uid, "exams"),
            where("examId", "==", examId),
            orderBy("completedAt", "desc")
          )
        );

        if (resSnap.empty) {
          router.push("/dashboard/exams");
          return;
        }

        const all = resSnap.docs.map(d => ({ ...d.data(), id: d.id } as ExamResult));

        // Exame
        const examSnap = await getDoc(doc(db, "exams", examId));
        if (!examSnap.exists()) { router.push("/dashboard/exams"); return; }

        if (!cancelled) {
          setAllResults(all);
          setResult(all[0]); // mais recente
          setExam({ id: examSnap.id, ...examSnap.data() } as Exam);
        }
      } catch (err) {
        logger.error("useExamResult: failed to load", err, { examId });
        if (!cancelled) router.push("/dashboard/exams");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [examId, user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  return { exam, result, allResults, loading };
}
