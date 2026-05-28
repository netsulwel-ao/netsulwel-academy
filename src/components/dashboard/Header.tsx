"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Search, Bell, User as UserIcon, Menu } from "lucide-react";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();
 
 // Obter o primeiro nome ou as iniciais para o Avatar
 const getInitials = (name: string | null | undefined) => {
 if (!name) return "U";
 return name.substring(0, 2).toUpperCase();
 };

 return (
  <header className="sticky top-0 z-30 flex h-20 items-center justify-between bg-gray-950/80 backdrop-blur-xl px-4 sm:px-8">
  
  <div className="flex flex-1 items-center gap-4">
  {/* Mobile menu button */}
  <button onClick={onMenuClick} className="lg:hidden text-gray-400 hover:text-white transition-colors mr-2">
  <Menu className="h-6 w-6" />
  </button>
 <div className="relative hidden sm:block w-full max-w-md">
 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
 <Search className="h-5 w-5 text-gray-500" />
 </div>
 <input
 type="text"
 placeholder="Pesquisar cursos, aulas ou tópicos..."
            className="block w-full bg-gray-900/50 py-2.5 pl-10 pr-3 text-sm text-gray-200 placeholder-gray-500 focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple transition-all"
 />
 </div>
 </div>

 {/* Ações e Perfil */}
 <div className="flex items-center gap-6">
 
 {/* Notificações */}
 <button className="relative text-gray-400 hover:text-white transition-colors">
 <Bell className="h-6 w-6" />
 <span className="absolute top-0 right-0 block h-2.5 w-2.5 bg-purple ring-2 ring-gray-950 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
 </button>

 {/* Separador */}
 <div className="h-8 w-px bg-gray-800"></div>

 {/* Perfil do Utilizador */}
 <div className="flex items-center gap-3">
 <div className="hidden text-right sm:block">
 <p className="text-sm font-semibold text-white">{user?.displayName || "Utilizador"}</p>
 <p className="text-xs text-gray-500">{user?.email}</p>
 </div>
 
            <div className="flex h-10 w-10 items-center justify-center bg-gradient-to-br from-purple to-purple-dark text-white font-bold shadow-lg shadow-purple/20">
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
