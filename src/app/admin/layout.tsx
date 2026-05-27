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

 return (
 <div className="flex min-h-screen bg-gray-950">
 <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
 
 <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-[280px]'}`}>
 <Header />
 <main className="flex-1 overflow-y-auto p-8 bg-gray-950">
 {children}
 </main>
 </div>
 </div>
 );
}
