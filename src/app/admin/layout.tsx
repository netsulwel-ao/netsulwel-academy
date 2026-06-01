"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";

export default function AdminLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 const router = useRouter();
 const { isAdminOrTeacher } = useAuth();
 const [isCollapsed, setIsCollapsed] = useState(false);
 const [mobileOpen, setMobileOpen] = useState(false);
 const [theme, setTheme] = useState<"dark" | "light">("dark");

 useEffect(() => {
    const saved = localStorage.getItem("admin-theme") as "dark" | "light" | null;
    if (saved) setTheme(saved);
  }, []);

 useEffect(() => {
   if (!isAdminOrTeacher) router.replace("/dashboard");
 }, [isAdminOrTeacher, router]);

 const toggleTheme = () => {
   setTheme(prev => {
     const next = prev === "dark" ? "light" : "dark";
     localStorage.setItem("admin-theme", next);
     return next;
   });
 };

 return (
 <div data-theme={theme} className="flex min-h-screen bg-gray-950">
 <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} theme={theme} onToggleTheme={toggleTheme} />
 
  <div className={`flex-1 flex flex-col h-screen overflow-y-auto transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-[280px]'}`}>
  <Header onMenuClick={() => setMobileOpen(true)} />
    <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-950">
   {children}
   </main>
 </div>
 </div>
 );
}
