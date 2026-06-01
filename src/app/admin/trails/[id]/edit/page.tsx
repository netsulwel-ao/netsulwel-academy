"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, updateDoc, getDocs, collection, query, orderBy, serverTimestamp } from "firebase/firestore";
import { Loader2, CheckCircle2 } from "lucide-react";
import type { Trail, Course } from "@/types/course";
import type { LiveSession } from "@/types/live";
import { TrailForm } from "@/components/admin/TrailForm";

export default function EditTrailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAdminOrTeacher } = useAuth();

  useEffect(() => {
    if (!isAdminOrTeacher) router.replace("/dashboard");
  }, [isAdminOrTeacher, router]);

  const [loading, setLoading] = useState(true);
  const [trail, setTrail] = useState<Trail | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allLives, setAllLives] = useState<LiveSession[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trailSnap, coursesSnap, livesSnap] = await Promise.all([
          getDoc(doc(db, "trails", id)),
          getDocs(query(collection(db, "courses"), orderBy("title"))),
          getDocs(query(collection(db, "lives"), orderBy("scheduledAt", "desc"))),
        ]);
        if (!trailSnap.exists()) { router.push("/admin/trails"); return; }
        setTrail({ id: trailSnap.id, ...trailSnap.data() } as Trail);
        setAllCourses(coursesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Course)));
        setAllLives(livesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as LiveSession)));
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar trilha.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, router]);

  const handleSave = async (data: { title: string; description: string; thumbnail: string; type: import("@/types/course").CourseType; level: import("@/types/course").CourseLevel; category: import("@/types/course").CourseCategory; courseIds: string[]; liveIds: string[]; liveSessions: import("@/types/course").TrailLiveSession[] }, status: "draft" | "published") => {
    setSaving(true); setError("");
    try {
      await updateDoc(doc(db, "trails", id), {
        ...data,
        status,
        coursesCount: data.courseIds.length,
        livesCount: data.liveIds.length + data.liveSessions.length,
        updatedAt: serverTimestamp(),
      });
      setSuccess(true);
      setTimeout(() => router.push("/admin/trails"), 1500);
    } catch { setError("Erro ao guardar. Tenta novamente."); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="flex h-16 w-16 items-center justify-center bg-green-500/10">
          <CheckCircle2 className="h-8 w-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Trilha actualizada!</h2>
        <p className="text-gray-400">A redirecionar...</p>
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
      onError={(msg) => setError(msg)}
      onBack={() => router.push("/admin/trails")}
    />
  );
}
