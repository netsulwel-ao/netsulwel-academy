"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { logger } from "@/lib/logger";

export interface TeacherProfile {
  id: string;
  name: string;
  photoURL: string;
  role: "teacher" | "institution";
  courseCount: number;
  liveCount: number;
}

interface UseTeachersReturn {
  teachers: TeacherProfile[];
  filtered: TeacherProfile[];
  search: string;
  setSearch: (v: string) => void;
  loading: boolean;
  error: string | null;
}

export function useTeachers(): UseTeachersReturn {
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const snap = await getDocs(
          query(
            collection(db, "users"),
            where("role", "in", ["teacher", "institution"]),
            limit(100)
          )
        );

        const ids = snap.docs.map(d => d.id);
        if (ids.length === 0) {
          if (!cancelled) setTeachers([]);
          return;
        }

        // Processar em batches de 30 (limite Firestore `in`)
        const courseCounts: Record<string, number> = {};
        const liveCounts:   Record<string, number> = {};

        const chunks: string[][] = [];
        for (let i = 0; i < ids.length; i += 30) chunks.push(ids.slice(i, i + 30));

        await Promise.all(
          chunks.map(async chunk => {
            const [coursesSnap, livesSnap] = await Promise.all([
              getDocs(query(
                collection(db, "courses"),
                where("createdBy", "in", chunk),
                where("status", "==", "published")
              )),
              getDocs(query(
                collection(db, "lives"),
                where("createdBy", "in", chunk)
              )),
            ]);

            coursesSnap.docs.forEach(d => {
              const uid = d.data().createdBy as string | undefined;
              if (uid) courseCounts[uid] = (courseCounts[uid] ?? 0) + 1;
            });
            livesSnap.docs.forEach(d => {
              const uid = d.data().createdBy as string | undefined;
              if (uid) liveCounts[uid] = (liveCounts[uid] ?? 0) + 1;
            });
          })
        );

        if (!cancelled) {
          setTeachers(snap.docs.map(d => ({
            id: d.id,
            name: d.data().name ?? "Utilizador",
            photoURL: d.data().photoURL ?? "",
            role: (d.data().role === "institution" ? "institution" : "teacher") as "teacher" | "institution",
            courseCount: courseCounts[d.id] ?? 0,
            liveCount:   liveCounts[d.id]   ?? 0,
          })));
        }
      } catch (err) {
        logger.error("useTeachers: failed to load", err);
        if (!cancelled) setError("Não foi possível carregar os professores.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return teachers;
    return teachers.filter(t => t.name.toLowerCase().includes(q));
  }, [teachers, search]);

  return { teachers, filtered, search, setSearch, loading, error };
}
