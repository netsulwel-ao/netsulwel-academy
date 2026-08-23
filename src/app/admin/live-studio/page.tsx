"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * Redirect /admin/live-studio?liveId=xxx → /admin/lives/{liveId}/studio
 */
export default function LiveStudioRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const liveId = searchParams.get("liveId");

  useEffect(() => {
    if (liveId) {
      router.replace(`/admin/lives/${liveId}/studio`);
    } else {
      router.replace("/admin/lives");
    }
  }, [liveId, router]);

  return null;
}
