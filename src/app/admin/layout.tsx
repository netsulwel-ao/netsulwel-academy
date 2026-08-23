"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, profileLoaded, isAdminOrTeacher } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && profileLoaded && user && !isAdminOrTeacher) {
      router.replace("/dashboard");
    }
  }, [loading, profileLoaded, user, isAdminOrTeacher, router]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/admin");
    }
  }, [loading, user, router]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center bg-background h-screen overflow-hidden gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
        <p className="text-sm text-gray-500">A redirecionar para o login...</p>
      </div>
    );
  }

  if (loading || !profileLoaded) {
    return (
      <div className="flex items-center justify-center bg-background h-screen overflow-hidden">
        <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
      </div>
    );
  }

  if (!isAdminOrTeacher) {
    return (
      <div className="flex flex-col items-center justify-center bg-background h-screen overflow-hidden gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
        <p className="text-sm text-gray-500">Sem permissão de acesso.</p>
      </div>
    );
  }

  return (
    <div className="flex overflow-hidden bg-background relative h-screen">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="flex flex-1 flex-col transition-all duration-300 h-full overflow-hidden">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main id="main-content" className="flex-1 overflow-y-auto px-5 py-4 sm:p-6 lg:p-8 bg-background">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
