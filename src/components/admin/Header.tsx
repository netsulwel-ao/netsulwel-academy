"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Search, Bell, ExternalLink, Menu } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();
 
 const getInitials = (name: string | null | undefined) => {
 if (!name) return "A";
 return name.substring(0, 2).toUpperCase();
 };

 return (
  <header className="sticky top-0 z-30 flex h-20 items-center justify-between bg-gray-950/80 backdrop-blur-xl px-4 sm:px-8">
  
  <div className="flex flex-1 items-center gap-4">
  <button onClick={onMenuClick} className="lg:hidden text-gray-400 hover:text-white transition-colors mr-2">
  <Menu className="h-6 w-6" />
  </button>
 <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider hidden sm:block">
 Modo Gestão
 </span>
 </div>

 <div className="flex items-center gap-6">
 
 <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors bg-gray-900 px-4 py-2 ">
 <span>Ver como Aluno</span>
 <ExternalLink className="h-4 w-4" />
 </Link>

 <button className="relative text-gray-400 hover:text-white transition-colors">
 <Bell className="h-6 w-6" />
 <span className="absolute top-0 right-0 block h-2.5 w-2.5 bg-blue-500 ring-2 ring-gray-950 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
 </button>

 <div className="h-8 w-px bg-gray-800"></div>

 <div className="flex items-center gap-3">
 <div className="hidden text-right sm:block">
 <p className="text-sm font-semibold text-white">{user?.displayName || "Administrador"}</p>
 <p className="text-xs text-blue-400">Admin</p>
 </div>
 
 <div className="flex h-10 w-10 items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 ">
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
