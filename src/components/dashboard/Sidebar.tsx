"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, BookOpen, CreditCard, Users, Settings, LogOut,
  PanelLeftClose, PanelLeft, Sun, Moon, ChevronRight, FileText, Layers, Award,
  Crown, GraduationCap, Building2, User,
  LayoutDashboard, UserPlus, Link2, Mail,
  Video, DollarSign, TrendingUp, MessageCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface SidebarProps {
 isCollapsed: boolean;
 setIsCollapsed: (val: boolean) => void;
 mobileOpen: boolean;
 setMobileOpen: (val: boolean) => void;
 theme: "dark" | "light";
 onToggleTheme: () => void;
}

const studentNav = [
  { icon: Home, label: "Início", href: "/dashboard" },
  { icon: BookOpen, label: "Meus Cursos", href: "/dashboard/courses" },
  { icon: Layers, label: "Trilhas", href: "/dashboard/trails" },
  { icon: FileText, label: "Avaliações", href: "/dashboard/exams" },
  { icon: Award, label: "Certificados", href: "/dashboard/certificates" },
  { icon: GraduationCap, label: "Professores", href: "/dashboard/professores" },
  { icon: MessageCircle, label: "Chats", href: "/dashboard/chats" },
  { icon: Users, label: "Comunidade", href: "/dashboard/community" },
];

// institution students: just a link to the public institution page

const teacherNav = [
  { icon: LayoutDashboard, label: "Visão Geral", href: "/dashboard/teacher" },
  { icon: BookOpen, label: "Cursos", href: "/dashboard/teacher/courses" },
  { icon: FileText, label: "Avaliações", href: "/dashboard/teacher/exams" },
  { icon: Video, label: "Aulas ao Vivo", href: "/dashboard/teacher/lives" },
  { icon: Users, label: "Alunos", href: "/dashboard/teacher/students" },
  { icon: DollarSign, label: "Vendas", href: "/dashboard/teacher/sales" },
  { icon: CreditCard, label: "Carteira", href: "/dashboard/wallet" },
  { icon: MessageCircle, label: "Chats", href: "/dashboard/chats" },
  { icon: TrendingUp, label: "Analytics", href: "/dashboard/teacher/analytics" },
  { icon: Settings, label: "Definições", href: "/dashboard/settings" },
];

const institutionNav = [
  { icon: LayoutDashboard, label: "Visão Geral", href: "/dashboard/institution" },
  { icon: Users, label: "Membros", href: "/dashboard/institution/members" },
  { icon: BookOpen, label: "Cursos", href: "/dashboard/institution/courses" },
  { icon: Settings, label: "Definições", href: "/dashboard/institution/settings" },
];

export default function Sidebar({ isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen, theme, onToggleTheme }: SidebarProps) {
   const pathname = usePathname();
   const { user, role, isAdmin, isTeacher, isInstitution, institutionId, logout } = useAuth();
   const [institutionName, setInstitutionName] = useState("");

   useEffect(() => {
     if (!institutionId) { setInstitutionName(""); return; }
     const unsub = onSnapshot(doc(db, "institutions", institutionId), snap => {
       if (snap.exists()) setInstitutionName(snap.data().name || "");
     });
     return () => unsub();
   }, [institutionId]);

   const handleNavClick = () => {
     if (mobileOpen) setMobileOpen(false);
   };

   const handleLogout = async () => {
    await logout();
   };

  if (!user) return null;

   return (
   <>
   {/* Mobile overlay */}
  {mobileOpen && (
  <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
  )}

  <aside
  role="navigation"
  aria-label="Menu do painel"
  className={`fixed left-0 top-0 h-screen overflow-hidden backdrop-blur-2xl transition-all duration-300 flex flex-col ${
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
 aria-label={isCollapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
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

  <div className="space-y-6 px-4">
  {/* Secção para Instituições */}
  {isInstitution && (
    <div>
      {!isCollapsed && (
        <>
          {institutionName && (
            <p className="px-3 mb-1 text-sm font-medium text-purple-300 truncate">{institutionName}</p>
          )}
          <h3 className="px-3 mb-2 text-xs font-bold uppercase tracking-widest text-purple-400">INSTITUIÇÃO</h3>
        </>
      )}
      <ul className="space-y-1">
        {institutionNav.map((item) => {
          const isActive = item.href === "/dashboard/institution"
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
               <Link
                 href={item.href}
                 onClick={handleNavClick}
                 aria-current={isActive ? "page" : undefined}
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
   )}

    {/* Secção de Navegação (apenas para alunos) */}
    {!isAdmin && !isInstitution && !isTeacher && (
     <div>
       {!isCollapsed && (
         <h3 className="px-3 mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">NAVEGAÇÃO</h3>
       )}
       <ul className="space-y-1">
         {studentNav.map((item) => {
           const isActive = pathname === item.href;
           return (
             <li key={item.href}>
               <Link
                 href={item.href}
                 onClick={handleNavClick}
                 aria-current={isActive ? "page" : undefined}
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
  )}

 </div>

  {/* Secção para Professores */}
  {isTeacher && !isInstitution && (
    <div>
      {!isCollapsed && (
        <>
          <h3 className="px-3 pl-6 mb-2 text-xs font-bold uppercase tracking-widest text-green-400">PROFESSOR</h3>
        </>
      )}
      <ul className="space-y-1">
        {teacherNav.map((item) => {
          const isActive = item.href === "/dashboard/teacher"
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={handleNavClick}
                aria-current={isActive ? "page" : undefined}
                title={isCollapsed ? item.label : ""}
                className={`group flex items-center pl-6 py-2.5 pr-3 transition-all relative ${isActive
                  ? theme === "light"
                    ? "bg-green-600 text-white shadow-sm"
                    : "bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]"
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
  )}

  {/* 4. Card de Role (Escondido se fechado) */}
  {!isCollapsed && (() => {
  const roleData = isAdmin ? { label: "Admin", color: "from-purple-900/80 to-purple-600/40", colorLight: "bg-white border-purple-200 shadow-sm", icon: Crown }
  : isTeacher ? { label: "Professor", color: "from-green-900/80 to-green-600/40", colorLight: "bg-white border-emerald-200 shadow-sm", icon: GraduationCap }
  : isInstitution ? { label: "Instituição", color: "from-cyan-900/80 to-cyan-600/40", colorLight: "bg-white border-cyan-200 shadow-sm", icon: Building2 }
  : { label: "Aluno", color: "from-blue-900/80 to-blue-600/40", colorLight: "bg-white border-blue-200 shadow-sm", icon: User };
  const RoleIcon = roleData.icon;
  return (
  <div className={`mx-4 mt-10 p-4 bg-gradient-to-br relative overflow-hidden group border ${
    theme === "light" ? roleData.colorLight : roleData.color + " border-transparent"
  }`}>
  <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-white blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>

  <div className={`relative z-10 flex items-center justify-center w-10 h-10 mb-3 backdrop-blur-sm ${
    theme === "light" ? "bg-slate-200/60" : "bg-white/10"
  }`}>
  <RoleIcon className={`w-5 h-5 ${theme === "light" ? "text-slate-700" : "text-white"}`} />
  </div>

  <h4 className={`font-bold text-base ${theme === "light" ? "text-slate-800" : "text-white"}`}>{roleData.label}</h4>
  <div className={`mt-1 text-sm ${theme === "light" ? "text-slate-500" : "text-white/70"}`}>
  {isAdmin ? "Acesso total ao sistema" : isTeacher ? "Gere os teus cursos" : isInstitution ? "Gere a tua instituição" : "Acesso aos cursos"}
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
   <button onClick={onToggleTheme} aria-label="Ativar tema claro" aria-pressed={theme === "light"}
     className={`flex items-center justify-center transition-all ${
       theme === "light"
         ? "bg-white text-purple shadow-sm ring-1 ring-slate-200"
         : "text-gray-400 hover:text-white"
     } ${isCollapsed ? "w-8 h-8" : "w-1/2 py-1.5"}`}>
   <Sun className="w-5 h-5" />
   </button>
   <button onClick={onToggleTheme} aria-label="Ativar tema escuro" aria-pressed={theme === "dark"}
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
 aria-label="Sair"
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
