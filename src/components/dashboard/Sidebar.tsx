"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
 Home, BookOpen, CreditCard, Users, Settings, LogOut,
 Search, PanelLeftClose, PanelLeft, Sun, Moon, ChevronRight, FileText
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
 isCollapsed: boolean;
 setIsCollapsed: (val: boolean) => void;
 mobileOpen: boolean;
 setMobileOpen: (val: boolean) => void;
}

const navSections = [
 {
 title: "NAVEGAÇÃO",
 items: [
 { icon: Home, label: "Início", href: "/dashboard" },
 { icon: BookOpen, label: "Meus Cursos", href: "/dashboard/courses" },
 { icon: FileText, label: "Avaliações", href: "/dashboard/exams" },
 { icon: Users, label: "Comunidade", href: "/dashboard/community" },
 ]
 },
 {
 title: "SISTEMA",
 items: [
 { icon: CreditCard, label: "Finanças", href: "/dashboard/finances" },
 { icon: Settings, label: "Definições", href: "/dashboard/settings" },
 ]
 }
];

export default function Sidebar({ isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
   const pathname = usePathname();
   const { plan, isAdmin } = useAuth();

   const handleLogout = async () => {
   try {
   await signOut(auth);
   } catch (error) {
   console.error("Erro ao fazer logout:", error);
   }
   };

  return (
  <>
  {/* Mobile overlay */}
  {mobileOpen && (
  <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
  )}

  <aside
  className={`fixed left-0 top-0 bg-gray-950/80 backdrop-blur-2xl transition-all duration-300 flex flex-col ${
  isCollapsed ? "w-20" : "w-[280px]"
  } ${mobileOpen ? "translate-x-0 z-50" : "-translate-x-full invisible pointer-events-none"} lg:translate-x-0 lg:z-40 lg:visible lg:pointer-events-auto`}
  >

 {/* 1. Header da Sidebar (Logo + Toggle) */}
 <div className="flex h-20 items-center justify-between px-6 shrink-0">
    <Link href="/" className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
      <img src="/Logo-Academy-White.svg" alt="Netsulwel" className="h-15 w-auto brightness-0 invert drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
      <span className="text-lg font-bold text-white tracking-wide">Academy</span>
    </Link>

 <button
 onClick={() => setIsCollapsed(!isCollapsed)}
 className={`flex h-8 w-8 items-center justify-center bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors ${isCollapsed ? "mx-auto" : ""}`}
 >
 {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
 </button>
 </div>

 <div className="flex-1 overflow-y-auto overflow-x-hidden pb-4 custom-scrollbar">

 {/* 2. Barra de Pesquisa Integrada */}
 <div className={`px-4 mb-6 transition-all duration-300 ${isCollapsed ? "opacity-0 invisible h-0 mb-0" : "opacity-100 visible"}`}>
 <div className="relative flex items-center">
 <Search className="absolute left-3 h-4 w-4 text-gray-500" />
 <input
 type="text"
 placeholder="Pesquisar..."
 className="w-full bg-gray-900 py-2.5 pl-10 pr-10 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple/50 focus:ring-1 focus:ring-purple/50 transition-all"
 />
 <div className="absolute right-3 flex items-center justify-center h-5 w-5 bg-gray-800 text-[10px] font-bold text-gray-400 ">
 /
 </div>
 </div>
 </div>

 {/* 3. Navegação com Categorias */}
 <div className="space-y-6 px-4">
 {navSections.map((section, idx) => (
 <div key={idx}>
 {!isCollapsed && (
 <h3 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
 {section.title}
 </h3>
 )}

 <ul className="space-y-1">
 {section.items.map((item) => {
 const isActive = pathname === item.href;
 return (
 <li key={item.href}>
 <Link
 href={item.href}
 title={isCollapsed ? item.label : ""}
 className={`group flex items-center px-3 py-2.5 transition-all relative ${isActive
 ? "bg-purple text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
 : "text-gray-400 hover:bg-gray-900 hover:text-gray-200"
 }`}
 >
 <item.icon className={`h-5 w-5 shrink-0 ${isCollapsed ? "mx-auto" : "mr-3"} ${isActive ? "text-white drop-shadow-md" : "text-gray-500 group-hover:text-gray-300"}`} />

 {!isCollapsed && (
 <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
 )}

 {/* Tooltip para modo fechado */}
 {isCollapsed && (
 <div className="absolute left-14 hidden group-hover:block bg-gray-800 px-2 py-1 text-xs text-white whitespace-nowrap z-50 ">
 {item.label}
 </div>
 )}
 </Link>
 </li>
 );
 })}
 </ul>
 </div>
 ))}
 </div>

  {/* 4. Card de Plano / Upgrade (Escondido se fechado) */}
  {!isCollapsed && (() => {
  const planData = isAdmin ? { label: "Admin", color: "from-purple-900/80 to-purple-600/40", pct: 100, suffix: "acesso total" }
  : plan === "golden" ? { label: "Golden", color: "from-yellow-900/80 to-yellow-600/40", pct: 100, suffix: "acesso completo" }
  : plan === "smart" ? { label: "Smart", color: "from-green-900/80 to-green-600/40", pct: 60, suffix: "dos recursos usados" }
  : { label: "Grátis", color: "from-gray-900/80 to-gray-600/40", pct: 20, suffix: "dos recursos usados" };
  const showUpgrade = !isAdmin && plan !== "golden";
  return (
  <div className={`mx-4 mt-10 p-4 bg-gradient-to-br ${planData.color} relative overflow-hidden group`}>
  <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-white blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>

  <div className="relative z-10 flex items-center justify-center w-10 h-10 bg-white/10 mb-3 backdrop-blur-sm">
  <img src="/logo.svg" alt="Icon" className="w-5 h-5 brightness-0 invert" />
  </div>

  <h4 className="text-white font-bold text-sm">Plano {planData.label}</h4>
  <div className="mt-1 flex justify-between items-center text-xs text-white/70">
  <span>{planData.pct}% — {planData.suffix}</span>
  </div>

  <div className="mt-2 h-1.5 w-full bg-black/30 overflow-hidden">
  <div style={{ width: `${planData.pct}%` }} className="h-full bg-white relative">
  <div className="absolute right-0 top-0 bottom-0 w-1 bg-gray-900 shadow-[0_0_5px_white]"></div>
  </div>
  </div>

  <div className="mt-4 space-y-2">
  <Link href="/dashboard/courses"
    className="block w-full py-2 px-4 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-colors text-center">
  Saber mais
  </Link>
  {showUpgrade && (
  <Link href="/dashboard/finances"
    className="flex w-full py-2 px-4 bg-gray-950 text-white text-xs font-bold hover:bg-black transition-colors items-center justify-between">
  Fazer Upgrade
  <ChevronRight className="w-3 h-3" />
  </Link>
  )}
  </div>
  </div>
  );
  })()}
 </div>

 {/* 5. Footer da Sidebar (Temas + Logout) */}
 <div className=" p-4 shrink-0 space-y-3">

 {/* Toggle de Temas */}
 <div className={`flex items-center justify-center p-1 bg-gray-900 ${isCollapsed ? "flex-col gap-2 py-3" : "gap-1"}`}>
 <button className={`flex items-center justify-center text-gray-400 hover:text-white transition-all ${isCollapsed ? "w-8 h-8" : "w-1/2 py-1.5"}`}>
 <Sun className="w-4 h-4" />
 </button>
 <button className={`flex items-center justify-center bg-gray-800 text-purple shadow-sm transition-all ${isCollapsed ? "w-8 h-8" : "w-1/2 py-1.5"}`}>
 <Moon className="w-4 h-4" />
 </button>
 </div>

 {/* Botão de Logout */}
 <button
 onClick={handleLogout}
 className={`flex items-center transition-all text-gray-500 hover:bg-red-500/10 hover:text-red-400 group ${isCollapsed ? "w-12 h-12 justify-center mx-auto" : "w-full px-3 py-2.5 gap-3"
 }`}
 title={isCollapsed ? "Terminar Sessão" : ""}
 >
 <LogOut className="h-5 w-5 shrink-0 group-hover:text-red-400" />
 {!isCollapsed && <span className="text-sm font-medium">Sair</span>}
 </button>
 </div>
  </aside>
  </>
  );
}
