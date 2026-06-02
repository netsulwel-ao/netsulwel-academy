"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Bell, Menu } from "lucide-react";

interface HeaderProps {
  onMenuClick?: () => void;
  theme?: "dark" | "light";
}

export default function Header({ onMenuClick, theme = "dark" }: HeaderProps) {
  const { user } = useAuth();
 
 const getInitials = (name: string | null | undefined) => {
 if (!name) return "A";
 return name.substring(0, 2).toUpperCase();
 };

 return (
  <header className={`sticky top-0 z-30 flex h-16 items-center justify-between px-4 sm:px-8 backdrop-blur-xl ${
    theme === "light"
      ? "bg-white/95 border-b border-slate-200 shadow-sm"
      : "bg-gray-950/80"
  }`}>
  
  <div className="flex flex-1 items-center gap-4">
  <button onClick={onMenuClick} className={`lg:hidden transition-colors mr-2 ${
    theme === "light" ? "text-slate-400 hover:text-slate-800" : "text-gray-400 hover:text-white"
  }`}>
  <Menu className="h-6 w-6" />
  </button>
 <span className={`px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider hidden sm:block ${
   theme === "light"
     ? "bg-blue-50 text-blue-600 border border-blue-100"
     : "bg-blue-500/10 text-blue-400"
 }`}>
 Modo Gestão
 </span>
 </div>

  <div className="flex items-center gap-5">

  <button className={`relative transition-colors ${
    theme === "light" ? "text-slate-400 hover:text-slate-700" : "text-gray-400 hover:text-white"
  }`}>
 <Bell className="h-5 w-5" />
 <span className={`absolute top-0 right-0 block h-2.5 w-2.5 bg-blue-500 ring-2 shadow-[0_0_6px_rgba(59,130,246,0.6)] ${
   theme === "light" ? "ring-white" : "ring-gray-950"
 }`} />
 </button>

 <div className={`h-7 w-px ${theme === "light" ? "bg-slate-200" : "bg-gray-800"}`}></div>

 <div className="flex items-center gap-3">
 <div className="hidden text-right sm:block">
 <p className={`text-sm font-semibold ${theme === "light" ? "text-slate-800" : "text-white"}`}>{user?.displayName || "Administrador"}</p>
 <p className={`text-xs font-medium ${theme === "light" ? "text-blue-600" : "text-blue-400"}`}>Admin</p>
 </div>
 
 <div className="flex h-9 w-9 items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-white text-sm font-bold shadow-md">
 {user?.photoURL ? (
 <img src={user.photoURL} alt="Avatar" className="h-full w-full object-cover" />
 ) : (
 getInitials(user?.displayName)
 )}
 </div>
 </div>

 </div>
 </header>
 );
}
