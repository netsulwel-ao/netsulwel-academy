"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import AnnouncementPopup from "@/components/dashboard/AnnouncementPopup";
import CountdownBanner from "@/components/dashboard/CountdownBanner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
 const [isCollapsed, setIsCollapsed] = useState(false);
 const [mobileOpen, setMobileOpen] = useState(false);
 const [theme, setTheme] = useState<"dark" | "light">("dark");

 useEffect(() => {
   const saved = localStorage.getItem("dashboard-theme") as "dark" | "light" | null;
   if (saved) setTheme(saved);
 }, []);

 const toggleTheme = () => {
   setTheme((prev) => {
     const next = prev === "dark" ? "light" : "dark";
     localStorage.setItem("dashboard-theme", next);
     return next;
   });
 };

 return (
 <div className="flex min-h-screen bg-gray-950" data-theme={theme}>
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
  <Header onMenuClick={() => setMobileOpen(true)} />
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-950">
   {children}
   </main>
 </div>

 <AnnouncementPopup />
 </div>
 );
}
