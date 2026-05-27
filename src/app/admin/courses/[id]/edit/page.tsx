"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import CourseForm from "@/components/admin/CourseForm";
import type { Course } from "@/types/course";

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [initialData, setInitialData] = useState<Partial<Course> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const snap = await getDoc(doc(db, "courses", id));
        if (!snap.exists()) { setFetchError("Curso não encontrado."); return; }
        setInitialData({ id: snap.id, ...snap.data() } as Course);
      } catch {
        setFetchError("Erro ao carregar o curso.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  const handleSave = async (data: Omit<Course, "id" | "createdAt" | "updatedAt">) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "courses", id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      setSuccess(true);
      setTimeout(() => router.push("/admin/courses"), 1500);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-white font-bold">{fetchError}</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="flex h-16 w-16 items-center justify-center bg-green-500/10">
          <CheckCircle2 className="h-8 w-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Curso atualizado!</h2>
        <p className="text-gray-400">A redirecionar...</p>
      </div>
    );
  }

  return (
    <CourseForm
      mode="edit"
      initialData={initialData ?? undefined}
      saving={saving}
      onSave={handleSave}
      backHref="/admin/courses"
    />
  );
}
