"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection, getDocs, query,
  orderBy, doc, getDoc,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";

export interface Certificate {
  id: string;          // courseId — usado na rota [courseId]
  courseTitle: string;
  completedAt: Date | null;
  certificateId: string;
  studentName: string;
  hours: number;
  courseId: string;
}

interface UseCertificatesReturn {
  certs: Certificate[];
  institutionName: string;
  loading: boolean;
  error: string | null;
}

export function useCertificates(): UseCertificatesReturn {
  const { user, institutionId } = useAuth();
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [institutionName, setInstitutionName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;

    const load = async () => {
      try {
        // Nome da instituição (se aplicável)
        if (institutionId) {
          const instSnap = await getDoc(doc(db, "institutions", institutionId));
          if (!cancelled && instSnap.exists()) {
            setInstitutionName(instSnap.data().name ?? "");
          }
        }

        const snap = await getDocs(
          query(
            collection(db, "certificates", user.uid, "courses"),
            orderBy("completedAt", "desc")
          )
        );

        if (!cancelled) {
          setCerts(snap.docs.map(d => {
            const data = d.data();
            // completedAt pode ser Firestore Timestamp ou string
            let completedAt: Date | null = null;
            if (data.completedAt?.toDate) {
              completedAt = data.completedAt.toDate();
            } else if (data.completedAt) {
              completedAt = new Date(data.completedAt);
            }
            return {
              id: d.id,           // este é o courseId
              courseId: d.id,
              courseTitle: data.courseTitle ?? "",
              completedAt,
              certificateId: data.certificateId ?? "",
              studentName: data.studentName ?? "",
              hours: data.hours ?? 0,
            } as Certificate;
          }));
        }
      } catch (err) {
        logger.error("useCertificates: failed to load", err, { uid: user.uid });
        if (!cancelled) setError("Não foi possível carregar os certificados.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user?.uid, institutionId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { certs, institutionName, loading, error };
}
