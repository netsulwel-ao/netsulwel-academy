"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc, getDoc, getDocs,
  collection, query, where,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";
import type { Trail, Course } from "@/types/course";
import type { LiveSession } from "@/types/live";

interface UseTrailDetailReturn {
  trail: Trail | null;
  courses: Course[];          // ordenados conforme courseIds da trilha
  lives: LiveSession[];       // lives referenciadas
  enrolledCourses: string[];
  loading: boolean;
  hasTrailAccess: boolean;
}

export function useTrailDetail(id: string): UseTrailDetailReturn {
  const router = useRouter();
  const { user } = useAuth();

  const [trail, setTrail] = useState<Trail | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lives, setLives] = useState<LiveSession[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetch = async () => {
      try {
        // 1. Trilha
        const trailSnap = await getDoc(doc(db, "trails", id));
        if (!trailSnap.exists()) {
          router.push("/dashboard/trails");
          return;
        }
        const trailData = { id: trailSnap.id, ...trailSnap.data() } as Trail;
        if (!cancelled) setTrail(trailData);

        // 2. Cursos inscritos pelo aluno
        if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (!cancelled && userDoc.exists()) {
            setEnrolledCourses(userDoc.data().enrolledCourses ?? []);
          }
        }

        // 3. Cursos da trilha — preservar ordem de courseIds
        if (trailData.courseIds?.length > 0) {
          // Firestore "in" query não preserva ordem → buscar e reordenar
          const coursesSnap = await getDocs(
            query(collection(db, "courses"), where("__name__", "in", trailData.courseIds))
          );
          const courseMap = new Map(
            coursesSnap.docs.map(d => [d.id, { id: d.id, ...d.data() } as Course])
          );
          // Reordenar conforme courseIds original
          const ordered = trailData.courseIds
            .map(cid => courseMap.get(cid))
            .filter((c): c is Course => c !== undefined);
          if (!cancelled) setCourses(ordered);
        }

        // 4. Lives referenciadas — preservar ordem de liveIds
        if (trailData.liveIds?.length > 0) {
          const livesSnap = await getDocs(
            query(collection(db, "lives"), where("__name__", "in", trailData.liveIds))
          );
          const liveMap = new Map(
            livesSnap.docs.map(d => [d.id, { id: d.id, ...d.data() } as LiveSession])
          );
          const ordered = trailData.liveIds
            .map(lid => liveMap.get(lid))
            .filter((l): l is LiveSession => l !== undefined);
          if (!cancelled) setLives(ordered);
        }
      } catch (err) {
        logger.error("useTrailDetail: failed to fetch trail", err, { id });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [id, user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasTrailAccess = useMemo(() => {
    if (!trail) return false;
    // Trilhas são acessíveis se o aluno tem acesso a pelo menos 1 curso dela
    const trailCourseIds = trail.courseIds ?? [];
    if (trailCourseIds.length === 0) return true;
    return trailCourseIds.some(cid => enrolledCourses.includes(cid));
  }, [trail, enrolledCourses]);

  return { trail, courses, lives, enrolledCourses, loading, hasTrailAccess };
}
