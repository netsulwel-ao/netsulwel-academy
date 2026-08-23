"use client";

import { useParams, useSearchParams } from "next/navigation";
import LiveStudioPage from "@/components/webrtc/LiveStudioPage";

export default function AdminStudioPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const liveId = params.id as string;
  const courseId = searchParams.get("courseId");
  const mi = searchParams.get("mi");
  const vi = searchParams.get("vi");

  return (
    <LiveStudioPage
      liveId={liveId}
      role="host"
      courseId={courseId || undefined}
      moduleIndex={mi !== null ? Number(mi) : undefined}
      videoIndex={vi !== null ? Number(vi) : undefined}
    />
  );
}
