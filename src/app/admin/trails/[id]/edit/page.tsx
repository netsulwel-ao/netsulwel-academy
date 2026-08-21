"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import {
  doc, getDoc, updateDoc, getDocs,
  collection, query, where, serverTimestamp,
} from "firebase/firestore";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { Trail, Course } from "@/types/course";
import type { LiveSession } from "@/types/live";
import { TrailForm } from "@/components/admin/TrailForm";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import type { TrailFormData } from "@/components/admin/trail-form/_types";

export default function EditTrailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { user, isAdmin, isTeacher } = useAuth();

  const [loading,    setLoading]    = useState(true);
  const [trail,      setTrail]      = useState<Trail | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allLives,   setAllLives]   = useState<LiveSession[]>([]);
  const [saving,     setSaving]     = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState("");
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      try {
        const courseQ = isTeacher && !isAdmin
          ? query(collection(db, "courses"), where("createdBy", "==", user.uid))
          : query(collection(db, "courses"));

        const [trailSnap, coursesSnap, livesSnap] = await Promise.all([
          getDoc(doc(db, "trails", id)),
          getDocs(courseQ),
          getDocs(query(collection(db, "lives"))),
        ]);
        if (cancelled) return;

        if (!trailSnap.exists()) { router.push("/admin/trails"); return; }
        setTrail({ id: trailSnap.id, ...trailSnap.data() } as Trail);
        setAllCourses(
          coursesSnap.docs
            .map(d => ({ id: d.id, ...d.data() } as Course))
            .sort((a, b) => a.title.localeCompare(b.title))
        );
        setAllLives(
          livesSnap.docs
            .map(d => ({ id: d.id, ...d.data() } as LiveSession))
            .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
        );
      } catch (err) {
        logger.error("EditTrailPage: failed to load", err, { id });
        if (!cancelled) setFetchError("Erro ao carregar trilha.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user?.uid, id, isAdmin, isTeacher]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (data: TrailFormData, status: "draft" | "published") => {
    setSaving(true); setError("");
    try {
      await updateDoc(doc(db, "trails", id), {
        ...data,
        status,
        coursesCount: data.courseIds.length,
        livesCount: data.liveIds.length + data.liveSessions.length,
        updatedAt: serverTimestamp(),
      });
      toast.success("Trilha actualizada!");
      setSuccess(true);
      setTimeout(() => router.push("/admin/trails"), 1200);
    } catch (err) {
      logger.error("EditTrailPage: failed to update trail", err, { id });
      toast.error("Erro ao guardar. Tenta novamente.");
      setError("Erro ao guardar. Tenta novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
        <AlertCircle className="h-8 w-8 text-red-400/70" strokeWidth={1.5} />
        <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">// erro</p>
        <p className="text-sm text-gray-600">{fetchError}</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="flex h-16 w-16 items-center justify-center border border-green/25 bg-green/8">
          <CheckCircle2 className="h-7 w-7 text-green/70" strokeWidth={1.5} />
        </div>
        <p className="font-mono text-[13px] uppercase tracking-widest text-gray-600">// trilha actualizada</p>
        <p className="text-sm text-gray-600">A redirecionar...</p>
      </div>
    );
  }

  return (
    <TrailForm
      mode="edit"
      initialData={trail ?? undefined}
      allCourses={allCourses}
      allLives={allLives}
      saving={saving}
      error={error}
      onSave={handleSave}
      onError={setError}
      onBack={() => router.push("/admin/trails")}
    />
  );
}
