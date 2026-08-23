import RemoteDevicePage from "@/components/webrtc/RemoteDevicePage";

export default function Page({ params }: { params: { token: string } }) {
  return <RemoteDevicePage token={params.token} />;
}
