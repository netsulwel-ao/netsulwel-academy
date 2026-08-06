"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { logger } from "@/lib/logger";
import type { Trail } from "@/types/course";

interface UseTrailsReturn {
  trails: Trail[];
  loading: boolean;
  error: string | null;
}

export function useTrails(): UseTrailsReturn {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      try {
        const snap = await getDocs(
          query(
            collection(db, "trails"),
            where("status", "==", "published"),
            orderBy("createdAt", "desc")
          )
        );
        if (!cancelled) {
          setTrails(snap.docs.map(d => ({ id: d.id, ...d.data() } as Trail)));
        }
      } catch (err) {
        logger.error("useTrails: failed to fetch trails", err);
        if (!cancelled) setError("Não foi possível carregar as trilhas.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, []);

  return { trails, loading, error };
}
