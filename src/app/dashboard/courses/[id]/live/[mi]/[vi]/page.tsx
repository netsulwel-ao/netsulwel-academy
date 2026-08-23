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
  const courseId = params.id as string;

  // For course-embedded lives, redirect to the lives viewer
  // The liveId should be stored in the course material
  useEffect(() => {
    // For now, redirect to the lives list
    router.replace("/dashboard/lives");
  }, [router]);

  return null;
}
