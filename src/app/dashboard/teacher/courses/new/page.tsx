"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, CheckCircle2 } from "lucide-react";
import CourseForm from "@/components/admin/CourseForm";
import { useAuth } from "@/contexts/AuthContext";
import { syncCourseTrail } from "@/lib/trail-sync";
import type { Course } from "@/types/course";

export default function TeacherNewCoursePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (data: Omit<Course, "id" | "createdAt" | "updatedAt">) => {
    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, "courses"), {
        ...data,
        createdBy: user?.uid ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      if (data.trailId) {
        await syncCourseTrail(docRef.id, data.trailId, undefined, data.trailOrder);
      }
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/teacher/courses"), 1500);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="flex h-16 w-16 items-center justify-center bg-green-500/10">
          <CheckCircle2 className="h-8 w-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Curso criado!</h2>
        <p className="text-gray-400">A redirecionar...</p>
      </div>
    );
  }

  return (
    <CourseForm
      mode="create"
      saving={saving}
      onSave={handleSave}
      backHref="/dashboard/teacher/courses"
    />
  );
}
