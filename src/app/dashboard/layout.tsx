"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import AnnouncementPopup from "@/components/dashboard/AnnouncementPopup";
import CountdownBanner from "@/components/dashboard/CountdownBanner";
import { OnboardingTour } from "@/components/dashboard/OnboardingTour";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
 const { isAdmin } = useAuth();
 const router = useRouter();

 useEffect(() => {
   if (isAdmin) router.replace("/admin");
 }, [isAdmin, router]);

 const [isCollapsed, setIsCollapsed] = useState(false);
 const [mobileOpen, setMobileOpen] = useState(false);
 const [theme, setTheme] = useState<"dark" | "light">("dark");

 useEffect(() => {
   const saved = localStorage.getItem("dashboard-theme") as "dark" | "light" | null;
   if (saved) setTheme(saved);
 }, []);

 useEffect(() => {
   document.documentElement.setAttribute("data-theme", theme);
   return () => { document.documentElement.removeAttribute("data-theme"); };
 }, [theme]);

 const toggleTheme = () => {
   setTheme((prev) => {
     const next = prev === "dark" ? "light" : "dark";
     localStorage.setItem("dashboard-theme", next);
     return next;
   });
 };

 return (
 <div className="flex min-h-screen bg-background">
 <Sidebar
   isCollapsed={isCollapsed}
   setIsCollapsed={setIsCollapsed}
   mobileOpen={mobileOpen}
   setMobileOpen={setMobileOpen}
   theme={theme}
   onToggleTheme={toggleTheme}
 />

 <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-[280px]'}`}>
  <CountdownBanner />
  <Header onMenuClick={() => setMobileOpen(true)} theme={theme} />
    <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-8 bg-background">
   {children}
   </main>
 </div>

  <AnnouncementPopup />
  <OnboardingTour />
  </div>
 );
}
