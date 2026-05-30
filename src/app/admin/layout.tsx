"use client";

import { useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";

export default function AdminLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 const [isCollapsed, setIsCollapsed] = useState(false);
 const [mobileOpen, setMobileOpen] = useState(false);

 return (
 <div className="flex min-h-screen bg-gray-950">
 <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
 
  <div className={`flex-1 flex flex-col h-screen overflow-y-auto transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-[280px]'}`}>
  <Header onMenuClick={() => setMobileOpen(true)} />
    <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-950">
   {children}
   </main>
 </div>
 </div>
 );
}
