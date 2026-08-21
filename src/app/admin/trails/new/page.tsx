"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, serverTimestamp, query, where } from "firebase/firestore";
import { CheckCircle2 } from "lucide-react";
import type { Course } from "@/types/course";
import type { LiveSession } from "@/types/live";
import { useAuth } from "@/contexts/AuthContext";
import { TrailForm } from "@/components/admin/TrailForm";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import type { TrailFormData } from "@/components/admin/trail-form/_types";

export default function NewTrailPage() {
  const router = useRouter();
  const { user, isAdmin, isTeacher } = useAuth();
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allLives,   setAllLives]   = useState<LiveSession[]>([]);
  const [saving,     setSaving]     = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState("");

  useEffect(() => {
    if (!user) return;
    // Sem orderBy composto — ordena em memória
    const courseQ = isTeacher && !isAdmin
      ? query(collection(db, "courses"), where("createdBy", "==", user.uid))
      : query(collection(db, "courses"));

    Promise.all([
      getDocs(courseQ),
      getDocs(query(collection(db, "lives"))),
    ]).then(([coursesSnap, livesSnap]) => {
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
    }).catch(err => {
      logger.error("NewTrailPage: failed to load courses/lives", err);
    });
  }, [user?.uid, isAdmin, isTeacher]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (data: TrailFormData, status: "draft" | "published") => {
    setSaving(true); setError("");
    try {
      await addDoc(collection(db, "trails"), {
        ...data,
        status,
        coursesCount: data.courseIds.length,
        livesCount: data.liveIds.length + data.liveSessions.length,
        createdBy: user?.uid ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Trilha criada com sucesso!");
      setSuccess(true);
      setTimeout(() => router.push("/admin/trails"), 1200);
    } catch (err) {
      logger.error("NewTrailPage: failed to save trail", err);
      toast.error("Erro ao guardar. Tenta novamente.");
      setError("Erro ao guardar. Tenta novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="flex h-16 w-16 items-center justify-center border border-green/25 bg-green/8">
          <CheckCircle2 className="h-7 w-7 text-green/70" strokeWidth={1.5} />
        </div>
        <p className="font-mono text-[13px] uppercase tracking-widest text-gray-600">// trilha criada</p>
        <p className="text-sm text-gray-600">A redirecionar...</p>
      </div>
    );
  }

  return (
    <TrailForm
      mode="create"
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
