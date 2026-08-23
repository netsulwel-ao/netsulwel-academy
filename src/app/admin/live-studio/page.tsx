"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * Redirect /admin/live-studio?roomName=xxx&courseId=xxx&mi=0&vi=0
 *   → /admin/lives/{liveId}/studio?courseId=xxx&mi=0&vi=0
 *
 * Also supports: /admin/live-studio?liveId=xxx → /admin/lives/{liveId}/studio
 */
export default function LiveStudioRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const liveId = searchParams.get("liveId");
  const courseId = searchParams.get("courseId");
  const mi = searchParams.get("mi");
  const vi = searchParams.get("vi");
  const roomName = searchParams.get("roomName");

  useEffect(() => {
    if (liveId) {
      const qs = new URLSearchParams();
      if (courseId) qs.set("courseId", courseId);
      if (mi !== null) qs.set("mi", mi);
      if (vi !== null) qs.set("vi", vi);
      const query = qs.toString();
      router.replace(`/admin/lives/${liveId}/studio${query ? `?${query}` : ""}`);
    } else if (roomName) {
      // If only roomName is provided, go to lives list — the live should already exist
      router.replace("/admin/lives");
    } else {
      router.replace("/admin/lives");
    }
  }, [liveId, courseId, mi, vi, roomName, router]);

  return null;
}
