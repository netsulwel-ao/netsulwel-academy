"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection, query, where,
  getDocs, doc, getDoc,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useAccess } from "@/hooks/useAccess";
import { logger } from "@/lib/logger";
import type { Exam, ExamResult } from "../_types/exams";
import type { CourseType } from "@/types/course";

interface UseExamsReturn {
  exams: (Exam & { id: string })[];
  results: Record<string, ExamResult>;
  loading: boolean;
  error: string | null;
}

export function useExams(): UseExamsReturn {
  const { user, isAdmin } = useAuth();
  const { canAccessCourse } = useAccess();
  const [exams, setExams] = useState<(Exam & { id: string })[]>([]);
  const [results, setResults] = useState<Record<string, ExamResult>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;

    const load = async () => {
      try {
        // 1. Perfil do aluno — cursos inscritos e plano
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const enrolledCourses: string[] = userSnap.data()?.enrolledCourses ?? [];

        // 2. Todos os cursos publicados — para saber o tipo e preço de cada um
        //    (necessário para verificar acesso sem o aluno ter o curso em enrolledCourses)
        const coursesSnap = await getDocs(
          query(collection(db, "courses"), where("status", "==", "published"))
        );
        const courseMetaMap = new Map<string, { type: CourseType; price: number; accessCode?: string }>();
        coursesSnap.docs.forEach(d => {
          courseMetaMap.set(d.id, {
            type:       d.data().type       as CourseType ?? "standalone",
            price:      d.data().price      as number    ?? 0,
            accessCode: d.data().accessCode as string | undefined,
          });
        });

        // 3. Cursos a que o aluno TEM acesso (enrollment ou curso gratuito)
        const accessibleCourseIds = coursesSnap.docs
          .filter(d => {
            const meta = courseMetaMap.get(d.id);
            if (!meta) return false;
            return canAccessCourse(d.id, enrolledCourses, meta.price, meta.accessCode);
          })
          .map(d => d.id);

        if (accessibleCourseIds.length === 0 && !isAdmin) {
          if (!cancelled) { setExams([]); setResults({}); }
          return;
        }

        // 4. Exames dos cursos acessíveis — batches de 10
        let allExams: (Exam & { id: string })[] = [];

        if (isAdmin) {
          // Admin vê todos os exames
          const snap = await getDocs(collection(db, "exams"));
          allExams = snap.docs.map(d => ({ id: d.id, ...d.data() } as Exam & { id: string }));
        } else {
          const chunks: string[][] = [];
          for (let i = 0; i < accessibleCourseIds.length; i += 10) {
            chunks.push(accessibleCourseIds.slice(i, i + 10));
          }
          const snaps = await Promise.all(
            chunks.map(chunk =>
              getDocs(query(collection(db, "exams"), where("courseId", "in", chunk)))
            )
          );
          snaps.forEach(snap => {
            snap.docs.forEach(d => {
              allExams.push({ id: d.id, ...d.data() } as Exam & { id: string });
            });
          });
        }

        // 5. Resultados do aluno
        const resSnap = await getDocs(collection(db, "exam-results", user.uid, "exams"));
        const resMap: Record<string, ExamResult> = {};
        resSnap.forEach(d => {
          const data = { ...d.data(), id: d.id } as ExamResult;
          const existing = resMap[data.examId];
          if (!existing || (data.completedAt as number) > (existing.completedAt as number)) {
            resMap[data.examId] = data;
          }
        });

        if (!cancelled) {
          setExams(allExams);
          setResults(resMap);
        }
      } catch (err) {
        logger.error("useExams: failed to load", err, { uid: user.uid });
        if (!cancelled) setError("Não foi possível carregar as avaliações.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user?.uid, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  return { exams, results, loading, error };
}
