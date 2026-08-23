"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * Course live lesson → redirect to live viewer
 * /dashboard/courses/{id}/live/{mi}/{vi} → /dashboard/lives/{id}
 */
export default function CourseLivePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id;

  useEffect(() => {
    router.replace("/dashboard/lives");
  }, [router]);

  if (!courseId || typeof courseId !== "string") return null;

  return null;
}
