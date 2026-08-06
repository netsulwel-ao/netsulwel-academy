"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";
import type { Course } from "@/types/course";

export interface CertificateDetail {
  courseTitle: string;
  studentName: string;
  completedAt: Date;
  certificateId: string;
  hours: number;
  courseId: string;
}

interface UseCertificateDetailReturn {
  cert: CertificateDetail | null;
  course: Course | null;
  loading: boolean;
  error: string;
}

export function useCertificateDetail(courseId: string): UseCertificateDetailReturn {
  const router = useRouter();
  const { user } = useAuth();
  const [cert, setCert] = useState<CertificateDetail | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !courseId) return;
    let cancelled = false;

    const load = async () => {
      try {
        const [certSnap, courseSnap] = await Promise.all([
          getDoc(doc(db, "certificates", user.uid, "courses", courseId)),
          getDoc(doc(db, "courses", courseId)),
        ]);

        if (!certSnap.exists()) {
          if (!cancelled) setError("Certificado não encontrado. Completa o curso primeiro.");
          return;
        }

        const d = certSnap.data();

        // Normalizar completedAt independentemente do formato
        let completedAt: Date = new Date();
        if (d.completedAt?.toDate) {
          completedAt = d.completedAt.toDate();
        } else if (d.completedAt) {
          completedAt = new Date(d.completedAt);
        }

        if (!cancelled) {
          setCert({
            courseTitle: d.courseTitle ?? "",
            studentName: d.studentName ?? "",
            completedAt,
            certificateId: d.certificateId ?? "",
            hours: d.hours ?? 0,
            courseId: d.courseId ?? courseId,
          });

          if (courseSnap.exists()) {
            setCourse({ id: courseSnap.id, ...courseSnap.data() } as Course);
          }
        }
      } catch (err) {
        logger.error("useCertificateDetail: failed to load", err, { courseId });
        if (!cancelled) setError("Erro ao carregar certificado.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user?.uid, courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { cert, course, loading, error };
}
