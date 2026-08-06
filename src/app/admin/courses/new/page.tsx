"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { CheckCircle2 } from "lucide-react";
import CourseForm from "@/components/admin/CourseForm";
import { useAuth } from "@/contexts/AuthContext";
import { syncCourseTrail } from "@/lib/trail-sync";
import { getOrCreateGroupChat } from "@/lib/chat";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import type { Course } from "@/types/course";

export default function NewCoursePage() {
  const router = useRouter();
  const { user, institutionId } = useAuth();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (
    data: Omit<Course, "id" | "createdAt" | "updatedAt">,
  ) => {
    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, "courses"), {
        ...data,
        createdBy: user?.uid ?? null,
        institutionId: institutionId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Sincronizar trilha
      if (data.trailId) {
        await syncCourseTrail(docRef.id, data.trailId, undefined, data.trailOrder);
      }

      // Criar chat de grupo (não bloqueia se falhar)
      if (user?.uid) {
        try {
          await getOrCreateGroupChat(
            docRef.id,
            data.title || "Curso",
            [user.uid],
            { [user.uid]: user.displayName || "Professor" },
            user.photoURL ? { [user.uid]: user.photoURL } : {},
          );
        } catch (err) {
          logger.error("NewCoursePage: group chat creation failed", err, { courseId: docRef.id });
        }
      }

      toast.success("Curso criado com sucesso!");
      setSuccess(true);
      setTimeout(() => router.push("/admin/courses"), 1200);
    } catch (err) {
      logger.error("NewCoursePage: failed to create course", err);
      toast.error("Erro ao criar o curso. Tenta novamente.");
      throw err; // re-throw so CourseForm can handle saving=false
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
        <p className="font-mono text-[10px] uppercase tracking-widest text-gray-600">// curso criado</p>
        <p className="text-sm text-gray-600">A redirecionar...</p>
      </div>
    );
  }

  return (
    <CourseForm
      mode="create"
      saving={saving}
      onSave={handleSave}
      backHref="/admin/courses"
    />
  );
}
