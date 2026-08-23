"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import AnnouncementPopup from "@/components/dashboard/AnnouncementPopup";
import CountdownBanner from "@/components/dashboard/CountdownBanner";
import { OnboardingTour } from "@/components/dashboard/OnboardingTour";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isInstitution, loading, profileLoaded } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

 const [isCollapsed, setIsCollapsed] = useState(true);
 const [mobileOpen, setMobileOpen] = useState(false);

 useEffect(() => {
   if (!loading && profileLoaded && isAdmin) router.replace("/admin");
 }, [isAdmin, loading, profileLoaded, router]);

 useEffect(() => {
   if (!loading && profileLoaded && isInstitution && !pathname?.startsWith("/dashboard/institution")) {
     router.replace("/dashboard/institution");
   }
 }, [isInstitution, loading, profileLoaded, pathname, router]);

 useEffect(() => {
   if (!loading && !user) {
     router.replace("/login?redirect=/dashboard");
   }
 }, [loading, user, router]);

 if (loading || !profileLoaded) {
   return (
     <div className="flex items-center justify-center bg-background h-screen overflow-hidden">
       <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
     </div>
   );
 }

 if (!user) {
   return (
     <div className="flex flex-col items-center justify-center bg-background h-screen overflow-hidden gap-4">
       <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
       <p className="text-sm text-gray-500">A redirecionar para o login...</p>
     </div>
   );
 }

  return (
  <div className="flex overflow-hidden bg-background h-screen">
  <Sidebar
    isCollapsed={isCollapsed}
    setIsCollapsed={setIsCollapsed}
    mobileOpen={mobileOpen}
    setMobileOpen={setMobileOpen}
  />

  <div className={`flex flex-1 flex-col transition-all duration-300 h-full overflow-hidden ${isCollapsed ? 'lg:ml-20' : 'lg:ml-[280px]'}`}>
   <div className="shrink-0"><CountdownBanner /></div>
   <Header onMenuClick={() => setMobileOpen(true)} />
      <main id="main-content" className="flex-1 overflow-y-auto px-5 py-6 sm:px-6 sm:py-8 md:px-8 md:py-8 lg:px-10 lg:py-10 bg-background">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
  </div>

  <AnnouncementPopup />
  <OnboardingTour />
  </div>
 );
}
