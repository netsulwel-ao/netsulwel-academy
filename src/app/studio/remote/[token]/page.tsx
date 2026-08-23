"use client";

import { use } from "react";
import RemoteDevicePage from "@/components/webrtc/RemoteDevicePage";

export default function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return <RemoteDevicePage token={token} />;
}
