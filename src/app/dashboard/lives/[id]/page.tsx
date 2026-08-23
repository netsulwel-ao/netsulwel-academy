"use client";

import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import LiveStudioPage from "@/components/webrtc/LiveStudioPage";

export default function LiveViewerPage() {
  const params = useParams();
  const liveId = params?.id;

  if (!liveId || typeof liveId !== "string") {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-gray-950">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple mx-auto" />
          <p className="text-gray-500 text-sm">A carregar live...</p>
        </div>
      </div>
    );
  }

  return <LiveStudioPage liveId={liveId} role="viewer" />;
}
