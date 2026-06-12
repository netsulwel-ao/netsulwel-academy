"use client";

import { useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import type { EventType } from "@/types/event";

export function useTrack() {
  const { user } = useAuth();

  const track = useCallback(
    async (
      type: EventType,
      targetId?: string,
      targetType?: "course" | "live" | "teacher" | "community" | "trail",
      metadata?: Record<string, string | number | boolean>
    ) => {
      if (!user) return;
      try {
        await addDoc(collection(db, "events"), {
          userId: user.uid,
          type,
          targetId: targetId ?? null,
          targetType: targetType ?? null,
          metadata: metadata ?? {},
          createdAt: serverTimestamp(),
        });
      } catch {
        // silent — tracking never blocks UX
      }
    },
    [user]
  );

  return { track };
}
