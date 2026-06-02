"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, BookOpen, CreditCard, Users, Settings, LogOut,
  PanelLeftClose, PanelLeft, Sun, Moon, ChevronRight, FileText, Layers, Award
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
 isCollapsed: boolean;
 setIsCollapsed: (val: boolean) => void;
 mobileOpen: boolean;
 setMobileOpen: (val: boolean) => void;
 theme: "dark" | "light";
 onToggleTheme: () => void;
}

const navSections = [
 {
 title: "NAVEGAÇÃO",
 items: [
 { icon: Home, label: "Início", href: "/dashboard" },
  { icon: BookOpen, label: "Meus Cursos", href: "/dashboard/courses" },
  { icon: Layers, label: "Trilhas", href: "/dashboard/trails" },
  { icon: FileText, label: "Avaliações", href: "/dashboard/exams" },
  { icon: Award, label: "Certificados", href: "/dashboard/certificates" },
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

export default function Sidebar({ isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen, theme, onToggleTheme }: SidebarProps) {
   const pathname = usePathname();
   const { plan, isAdmin, logout } = useAuth();

   const handleLogout = async () => {
   await logout();
   };

  return (
  <>
  {/* Mobile overlay */}
  {mobileOpen && (
  <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
  )}

  <aside
  className={`fixed left-0 top-0 h-screen backdrop-blur-2xl transition-all duration-300 flex flex-col ${
    isCollapsed ? "w-20" : "w-[280px]"
  } ${mobileOpen ? "translate-x-0 z-50" : "-translate-x-full invisible pointer-events-none"} lg:translate-x-0 lg:z-40 lg:visible lg:pointer-events-auto ${
    theme === "light"
      ? "bg-white border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0]"
      : "bg-gray-950/80"
  }`}
  >

 {/* 1. Header da Sidebar (Logo + Toggle) */}
 <div className="flex h-20 items-center justify-between px-6 shrink-0">
    <Link href="/" className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
      <img
        src="/Logo-Academy-White.svg"
        alt="Netsulwel"
        className={`h-14 w-auto brightness-0 ${theme === "light" ? "" : "invert drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"}`}
      />
      <span className={`text-xl font-bold tracking-wide ${theme === "light" ? "text-slate-800" : "text-white"}`}>Academy</span>
    </Link>

 <button
 onClick={() => setIsCollapsed(!isCollapsed)}
 className={`flex h-8 w-8 items-center justify-center transition-colors ${isCollapsed ? "mx-auto" : ""} ${
   theme === "light"
     ? "bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200"
     : "bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800"
 }`}
 >
  {isCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
 </button>
 </div>

 <div className="flex-1 overflow-y-auto overflow-x-hidden pb-4 hide-scrollbar">

  {/* 2. Navegação com Categorias */}
 <div className="space-y-6 px-4">
 {navSections.map((section, idx) => (
 <div key={idx}>
 {!isCollapsed && (
 <h3 className="px-3 mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">
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
   ? theme === "light"
     ? "bg-purple text-white shadow-sm"
     : "bg-purple text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
   : theme === "light"
     ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
     : "text-gray-400 hover:bg-gray-900 hover:text-gray-200"
 }`}
 >
 <item.icon className={`h-6 w-6 shrink-0 ${isCollapsed ? "mx-auto" : "mr-3"} ${
   isActive
     ? "text-white drop-shadow-md"
     : theme === "light"
       ? "text-slate-400 group-hover:text-slate-700"
       : "text-gray-500 group-hover:text-gray-300"
 }`} />

 {!isCollapsed && (
 <span className="text-base font-medium whitespace-nowrap">{item.label}</span>
 )}

 {/* Tooltip para modo fechado */}
 {isCollapsed && (
 <div className={`absolute left-14 hidden group-hover:block px-2 py-1 text-sm whitespace-nowrap z-50 ${
   theme === "light" ? "bg-slate-800 text-white" : "bg-gray-800 text-white"
 }`}>
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
  const planData = isAdmin ? { label: "Admin", color: "from-purple-900/80 to-purple-600/40", colorLight: "from-purple-50 to-purple-100/60 border-purple-200", pct: 100, suffix: "acesso total" }
  : plan === "golden" ? { label: "Golden", color: "from-yellow-900/80 to-yellow-600/40", colorLight: "from-yellow-50 to-amber-100/60 border-amber-200", pct: 100, suffix: "acesso completo" }
  : plan === "smart" ? { label: "Smart", color: "from-green-900/80 to-green-600/40", colorLight: "from-green-50 to-emerald-100/60 border-emerald-200", pct: 60, suffix: "dos recursos usados" }
  : { label: "Grátis", color: "from-gray-900/80 to-gray-600/40", colorLight: "from-slate-50 to-slate-100/60 border-slate-200", pct: 20, suffix: "dos recursos usados" };
  const showUpgrade = !isAdmin && plan !== "golden";
  return (
  <div className={`mx-4 mt-10 p-4 bg-gradient-to-br relative overflow-hidden group border ${
    theme === "light" ? planData.colorLight : planData.color + " border-transparent"
  }`}>
  <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-white blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>

  <div className={`relative z-10 flex items-center justify-center w-10 h-10 mb-3 backdrop-blur-sm ${
    theme === "light" ? "bg-slate-200/60" : "bg-white/10"
  }`}>
  <img src="/logo.svg" alt="Icon" className={`w-5 h-5 brightness-0 ${theme === "light" ? "" : "invert"}`} />
  </div>

  <h4 className={`font-bold text-base ${theme === "light" ? "text-slate-800" : "text-white"}`}>Plano {planData.label}</h4>
  <div className={`mt-1 flex justify-between items-center text-sm ${theme === "light" ? "text-slate-500" : "text-white/70"}`}>
  <span>{planData.pct}% — {planData.suffix}</span>
  </div>

  <div className={`mt-2 h-1.5 w-full overflow-hidden sidebar-progress-bar ${theme === "light" ? "bg-slate-200" : "bg-black/30"}`}>
  <div style={{ width: `${planData.pct}%` }} className={`h-full relative ${theme === "light" ? "bg-purple" : "bg-white"}`}>
  <div className={`absolute right-0 top-0 bottom-0 w-1 shadow-[0_0_5px_white] ${theme === "light" ? "bg-white" : "bg-gray-900"}`}></div>
  </div>
  </div>

  <div className="mt-4 space-y-2">
  <Link href="/dashboard/courses"
    className={`block w-full py-2 px-4 text-sm font-semibold backdrop-blur-sm transition-colors text-center ${
      theme === "light"
        ? "bg-slate-200/60 hover:bg-slate-300/60 text-slate-800"
        : "bg-white/10 hover:bg-white/20 text-white"
    }`}>
  Saber mais
  </Link>
  {showUpgrade && (
  <Link href="/dashboard/finances"
    className={`flex w-full py-2 px-4 text-sm font-bold transition-colors items-center justify-between ${
      theme === "light"
        ? "bg-purple text-white hover:bg-purple-dark"
        : "bg-gray-950 text-white hover:bg-black"
    }`}>
  Fazer Upgrade
  <ChevronRight className="w-4 h-4" />
  </Link>
  )}
  </div>
  </div>
  );
  })()}
 </div>

 {/* 5. Footer da Sidebar (Temas + Logout) */}
 <div className={`p-4 shrink-0 space-y-3 ${theme === "light" ? "border-t border-slate-200" : ""}`}>

  {/* Toggle de Temas */}
  <div className={`flex items-center justify-center p-1 ${isCollapsed ? "flex-col gap-2 py-3" : "gap-1"} ${
    theme === "light" ? "bg-slate-100" : "bg-gray-900"
  }`}>
  <button onClick={onToggleTheme}
    className={`flex items-center justify-center transition-all ${
      theme === "light"
        ? "bg-white text-purple shadow-sm ring-1 ring-slate-200"
        : "text-gray-400 hover:text-white"
    } ${isCollapsed ? "w-8 h-8" : "w-1/2 py-1.5"}`}>
  <Sun className="w-5 h-5" />
  </button>
  <button onClick={onToggleTheme}
    className={`flex items-center justify-center transition-all ${
      theme === "dark"
        ? "bg-gray-800 text-purple shadow-sm"
        : "text-slate-400 hover:text-slate-600"
    } ${isCollapsed ? "w-8 h-8" : "w-1/2 py-1.5"}`}>
  <Moon className="w-5 h-5" />
  </button>
  </div>

 {/* Botão de Logout */}
 <button
 onClick={handleLogout}
 className={`flex items-center transition-all group ${isCollapsed ? "w-12 h-12 justify-center mx-auto" : "w-full px-3 py-2.5 gap-3"} ${
   theme === "light"
     ? "text-slate-400 hover:bg-red-50 hover:text-red-500"
     : "text-gray-500 hover:bg-red-500/10 hover:text-red-400"
 }`}
 title={isCollapsed ? "Terminar Sessão" : ""}
 >
 <LogOut className="h-6 w-6 shrink-0 group-hover:text-red-400" />
 {!isCollapsed && <span className="text-base font-medium">Sair</span>}
 </button>
 </div>
  </aside>
  </>
  );
}
