"use client";

import { useParams } from "next/navigation";
import LiveStudioPage from "@/components/webrtc/LiveStudioPage";

export default function TeacherStudioPage() {
  const params = useParams();
  const liveId = params.id as string;
  return <LiveStudioPage liveId={liveId} role="host" />;
}
