"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from "firebase/firestore";
import { CheckCircle2 } from "lucide-react";
import type { Course } from "@/types/course";
import type { LiveSession } from "@/types/live";
import { useAuth } from "@/contexts/AuthContext";
import { TrailForm } from "@/components/admin/TrailForm";

export default function NewTrailPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allLives, setAllLives] = useState<LiveSession[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getDocs(query(collection(db, "courses"), orderBy("title"))),
      getDocs(query(collection(db, "lives"), orderBy("scheduledAt", "desc"))),
    ]).then(([coursesSnap, livesSnap]) => {
      setAllCourses(coursesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Course)));
      setAllLives(livesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as LiveSession)));
    }).catch(console.error);
  }, []);

  const handleSave = async (data: { title: string; description: string; thumbnail: string; type: import("@/types/course").CourseType; level: import("@/types/course").CourseLevel; category: import("@/types/course").CourseCategory; courseIds: string[]; liveIds: string[]; liveSessions: import("@/types/course").TrailLiveSession[] }, status: "draft" | "published") => {
    setSaving(true); setError("");
    try {
      await addDoc(collection(db, "trails"), {
        ...data,
        status,
        coursesCount: data.courseIds.length,
        livesCount: data.liveIds.length + data.liveSessions.length,
        createdBy: user?.uid ?? null,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      setSuccess(true);
      setTimeout(() => router.push("/admin/trails"), 1500);
    } catch { setError("Erro ao guardar. Tenta novamente."); }
    finally { setSaving(false); }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="flex h-16 w-16 items-center justify-center bg-green-500/10">
          <CheckCircle2 className="h-8 w-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Trilha criada!</h2>
        <p className="text-gray-400">A redirecionar...</p>
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
      onError={(msg) => setError(msg)}
      onBack={() => router.push("/admin/trails")}
    />
  );
}
