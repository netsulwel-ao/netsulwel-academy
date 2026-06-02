"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
 children,
}: {
 children: React.ReactNode;
}) {
  const { loading, isAdminOrTeacher } = useAuth();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("admin-theme") as "dark" | "light" | null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    return () => { document.documentElement.removeAttribute("data-theme"); };
  }, [theme]);

  useEffect(() => {
    if (!loading && !isAdminOrTeacher) {
      router.replace("/dashboard");
    }
  }, [loading, isAdminOrTeacher, router]);

  // Mostra spinner enquanto carrega ou se não tem permissão (antes do redirect)
  if (loading || !isAdminOrTeacher) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("admin-theme", next);
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} theme={theme} onToggleTheme={toggleTheme} />
      <div className={`flex-1 flex flex-col h-screen overflow-y-auto transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-[280px]'}`}>
        <Header onMenuClick={() => setMobileOpen(true)} theme={theme} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
