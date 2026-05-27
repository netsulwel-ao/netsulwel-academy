export default function ViewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Full-screen layout — no sidebar or header for immersive viewer experience
  return <>{children}</>;
}
