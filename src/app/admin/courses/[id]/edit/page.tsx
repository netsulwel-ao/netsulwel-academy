"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, CheckCircle2, AlertCircle, Radio } from "lucide-react";
import CourseForm from "@/components/admin/CourseForm";
import { syncCourseTrail } from "@/lib/trail-sync";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import type { Course } from "@/types/course";

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [initialData, setInitialData] = useState<Partial<Course> | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [fetchError,  setFetchError]  = useState("");

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "courses", id));
        if (!snap.exists()) { setFetchError("Curso não encontrado."); return; }
        setInitialData({ id: snap.id, ...snap.data() } as Course);
      } catch (err) {
        logger.error("EditCoursePage: failed to load course", err, { id });
        setFetchError("Erro ao carregar o curso.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSave = async (
    data: Omit<Course, "id" | "createdAt" | "updatedAt">,
  ) => {
    setSaving(true);
    try {
      const previousTrailId = initialData?.trailId;
      await updateDoc(doc(db, "courses", id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      if (data.trailId !== previousTrailId) {
        await syncCourseTrail(id, data.trailId, previousTrailId, data.trailOrder);
      }
      toast.success("Curso actualizado!");
      setSuccess(true);
      setTimeout(() => router.push("/admin/courses"), 1200);
    } catch (err) {
      logger.error("EditCoursePage: failed to update course", err, { id });
      toast.error("Erro ao actualizar o curso.");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-gray-700" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
        <AlertCircle className="h-8 w-8 text-red-400" strokeWidth={1.5} />
        <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">// erro</p>
        <p className="text-sm text-gray-600">{fetchError}</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="flex h-16 w-16 items-center justify-center border border-green bg-green/8">
          <CheckCircle2 className="h-7 w-7 text-green" strokeWidth={1.5} />
        </div>
        <p className="font-mono text-[13px] uppercase tracking-widest text-gray-600">// curso actualizado</p>
        <p className="text-sm text-gray-600">A redirecionar...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Link para estúdio ao vivo (se for curso live) */}
      {initialData?.format === "live" && (
        <div className="px-6 pt-4 shrink-0">
          <Link
            href={`/admin/courses/${id}/live-studio`}
            className="inline-flex items-center gap-1.5 border border-red-500 bg-red-500/5 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-red-400 hover:bg-red-500/15 transition-all"
          >
            <Radio className="h-3 w-3" strokeWidth={1.5} /> Estúdio ao vivo
          </Link>
        </div>
      )}
      <CourseForm
        mode="edit"
        initialData={initialData ?? undefined}
        saving={saving}
        onSave={handleSave}
        backHref="/admin/courses"
      />
    </div>
  );
}
