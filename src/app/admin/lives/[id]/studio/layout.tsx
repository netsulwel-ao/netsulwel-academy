export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Full-screen layout — no sidebar or header for immersive studio experience
  return <>{children}</>;
}
