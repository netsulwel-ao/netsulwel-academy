"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass, BookOpen, CreditCard, Users, Settings, LogOut,
  PanelLeftClose, PanelLeft, FileText, Award,
  Crown, GraduationCap, Building2, User,
  LayoutDashboard,
  Video, DollarSign, TrendingUp, MessageCircle, X,
  Radio,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { listenUnreadCount } from "@/lib/chat";

interface SidebarProps {
 isCollapsed: boolean;
 setIsCollapsed: (val: boolean) => void;
 mobileOpen: boolean;
 setMobileOpen: (val: boolean) => void;
}

const studentNav = [
  { icon: Compass, label: "Explorar", href: "/dashboard" },
  { icon: BookOpen, label: "Meus Cursos", href: "/dashboard/courses" },
  { icon: FileText, label: "Avaliações", href: "/dashboard/exams" },
  { icon: Award, label: "Certificados", href: "/dashboard/certificates" },
  { icon: GraduationCap, label: "Professores", href: "/dashboard/professores" },
  { icon: MessageCircle, label: "Chats", href: "/dashboard/chats" },
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
  { icon: MessageCircle, label: "Chats", href: "/dashboard/teacher/chats" },
  { icon: TrendingUp, label: "Analytics", href: "/dashboard/teacher/analytics" },
  { icon: Settings, label: "Definições", href: "/dashboard/settings" },
];

const institutionNav = [
  { icon: LayoutDashboard, label: "Visão Geral", href: "/dashboard/institution" },
  { icon: Users, label: "Membros", href: "/dashboard/institution/members" },
  { icon: BookOpen, label: "Cursos", href: "/dashboard/institution/courses" },
  { icon: Radio, label: "Lives", href: "/dashboard/institution/lives" },
  { icon: Settings, label: "Definições", href: "/dashboard/institution/settings" },
];

export default function Sidebar({ isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
   const pathname = usePathname();
   const { user, isAdmin, isTeacher, isInstitution, institutionId, logout } = useAuth();
   const { theme } = useTheme();
   const [institutionName, setInstitutionName] = useState("");
   const [unreadCount, setUnreadCount] = useState(0);

   useEffect(() => {
     if (!institutionId) return;
     const unsub = onSnapshot(doc(db, "institutions", institutionId), snap => {
       if (snap.exists()) setInstitutionName(snap.data().name || "");
     });
     return () => unsub();
   }, [institutionId]);

   useEffect(() => {
     if (!user) return;
     const unsub = listenUnreadCount(user.uid, setUnreadCount);
     return () => unsub();
   }, [user?.uid]);

   const handleNavClick = () => {
     if (mobileOpen) setMobileOpen(false);
     setIsCollapsed(true);
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
  className={`fixed left-0 top-0 h-full transition-all duration-300 flex flex-col ${
    mobileOpen ? "w-full" : isCollapsed ? "w-20" : "w-[280px]"
  } ${mobileOpen ? "translate-x-0 z-50" : "-translate-x-full invisible pointer-events-none"} lg:translate-x-0 lg:z-40 lg:visible lg:pointer-events-auto ${
    theme === "light"
      ? "bg-bg-surface border-r border-border-default shadow-[2px_0_12px_rgba(0,0,0,0.04)]"
      : "bg-bg-surface/80 backdrop-blur-2xl border-r border-border-default"
  }`}
  >

 {/* 1. Header da Sidebar (Logo + Toggle) */}
 <div className="flex h-20 items-center justify-between px-6 shrink-0">
    <Link href="/" className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isCollapsed && !mobileOpen ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
      <img
        src="/Logo-Academy-White.svg"
        alt="Netsulwel"
        className={`h-14 w-auto brightness-0 ${theme === "light" ? "" : "invert drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"}`}
      />
      <span className={`text-xl font-bold tracking-wide ${theme === "light" ? "text-text-primary" : "text-white"}`}>Academy</span>
    </Link>

 {mobileOpen ? (
 <button
 onClick={() => setMobileOpen(false)}
 aria-label="Fechar menu"
 className={`flex h-8 w-8 items-center justify-center transition-colors ${
   theme === "light"
     ? "bg-bg-surface-2 text-text-muted hover:text-text-primary hover:bg-hover-bg"
     : "bg-bg-surface-2 text-text-muted hover:text-text-primary hover:bg-hover-bg"
 }`}
 >
  <X className="h-5 w-5" />
 </button>
 ) : (
 <button
 onClick={() => setIsCollapsed(!isCollapsed)}
 aria-label={isCollapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
 className={`flex h-8 w-8 items-center justify-center transition-colors ${isCollapsed ? "mx-auto" : ""} ${
   theme === "light"
     ? "bg-bg-surface-2 text-text-muted hover:text-text-primary hover:bg-hover-bg"
     : "bg-bg-surface-2 text-text-muted hover:text-text-primary hover:bg-hover-bg"
 }`}
 >
  {isCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
 </button>
 )}
 </div>

     <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-4 hide-scrollbar">

  <div className="space-y-6 px-4">
   {/* Secção para Instituições */}
   {isInstitution && (
     <div>
       {!isCollapsed && (
         <>
           {institutionName && (
             <p className="px-3 mb-1 text-sm font-medium text-brand-purple-on-dark truncate">{institutionName}</p>
           )}
           <h3 className="px-3 mb-2 text-xs font-bold uppercase tracking-widest text-brand-purple">INSTITUIÇÃO</h3>
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
                  title={isCollapsed && !mobileOpen ? item.label : ""}
 className={`group transition-all relative ${mobileOpen ? "flex flex-col items-center justify-center py-4 mx-2 rounded-xl text-center gap-1.5" : "flex items-center px-3 py-2.5"} ${isActive
                    ? theme === "light"
                      ? "bg-brand-purple/10 text-brand-purple-on-light font-semibold"
                      : "bg-brand-purple text-text-on-brand shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    : theme === "light"
                      ? "text-text-secondary hover:bg-hover-bg hover:text-text-primary"
                      : "text-text-secondary hover:bg-hover-bg hover:text-text-primary"
                  }`}
                >
                  <item.icon className={`shrink-0 ${mobileOpen ? "h-7 w-7" : "h-6 w-6"} ${mobileOpen ? "" : isCollapsed ? "mx-auto" : "mr-3"} ${
                     isActive
                       ? theme === "light"
                         ? "text-brand-purple"
                         : "text-white"
                       : theme === "light"
                         ? "text-text-muted group-hover:text-text-primary"
                         : "text-text-muted group-hover:text-text-primary"
                  }`} />
                  {(mobileOpen || !isCollapsed) && (
                    <span className="text-base font-medium whitespace-nowrap">{item.label}</span>
                  )}
                  {!mobileOpen && isCollapsed && (
                    <div className={`absolute left-14 hidden group-hover:block px-2 py-1 text-sm whitespace-nowrap z-50 ${
                      theme === "light" ? "bg-bg-surface text-text-primary border border-border-default" : "bg-bg-surface text-text-primary"
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
       {(!isCollapsed || mobileOpen) && (
         <h3 className="px-3 mb-2 text-xs font-bold uppercase tracking-widest text-text-muted text-center sm:text-left">NAVEGAÇÃO</h3>
       )}
       <ul className="space-y-1">
         {studentNav.map((item) => {
           const isActive = pathname === item.href;
           const showBadge = item.href === "/dashboard/chats" && unreadCount > 0;
           return (
              <li key={item.href}>
                 <Link
                   href={item.href}
                   onClick={handleNavClick}
                   aria-current={isActive ? "page" : undefined}
                   title={isCollapsed && !mobileOpen ? item.label : ""}
                  className={`group transition-all relative ${mobileOpen ? "flex flex-col items-center justify-center py-4 mx-2 rounded-xl text-center gap-1.5" : "flex items-center px-3 py-2.5"} ${isActive
                    ? theme === "light"
                      ? "bg-brand-purple/10 text-brand-purple-on-light font-semibold"
                      : "bg-brand-purple text-text-on-brand shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    : theme === "light"
                      ? "text-text-secondary hover:bg-hover-bg hover:text-text-primary"
                      : "text-text-secondary hover:bg-hover-bg hover:text-text-primary"
                  }`}
               >
                 <div className="relative shrink-0">
                    <item.icon className={`${mobileOpen ? "h-7 w-7" : "h-6 w-6"} ${mobileOpen ? "" : isCollapsed ? "mx-auto" : "mr-3"} ${
                      isActive
                        ? theme === "light"
                          ? "text-brand-purple"
                          : "text-white"
                        : theme === "light"
                          ? "text-text-muted group-hover:text-text-primary"
                          : "text-text-muted group-hover:text-text-primary"
                    }`} />
                    {showBadge && (
                      <span className={`absolute -top-1.5 ${!mobileOpen && isCollapsed ? "right-0" : "-right-1.5"} flex items-center justify-center h-4 min-w-[16px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full`}>
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                 </div>
                 {(mobileOpen || !isCollapsed) && (
                   <span className="text-base font-medium whitespace-nowrap">{item.label}</span>
                 )}
                 {!mobileOpen && isCollapsed && (
                   <div className={`absolute left-14 hidden group-hover:block px-2 py-1 text-sm whitespace-nowrap z-50 ${
                     theme === "light" ? "bg-bg-surface text-text-primary border border-border-default" : "bg-bg-surface text-text-primary"
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

  {/* Secção para Professores */}
  {isTeacher && !isInstitution && (
    <div>
      {!isCollapsed && (
        <>
          <h3 className="px-3 mb-2 text-xs font-bold uppercase tracking-widest text-brand-green">PROFESSOR</h3>
        </>
      )}
      <ul className="space-y-1">
        {teacherNav.map((item) => {
          const isActive = item.href === "/dashboard/teacher"
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const showBadge = item.href === "/dashboard/teacher/chats" && unreadCount > 0;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={handleNavClick}
                aria-current={isActive ? "page" : undefined}
                title={isCollapsed && !mobileOpen ? item.label : ""}
                className={`group transition-all relative ${mobileOpen ? "flex flex-col items-center justify-center py-4 mx-2 rounded-xl text-center gap-1.5" : "flex items-center px-3 py-2.5"} ${isActive
                  ? theme === "light"
                    ? "bg-brand-green/10 text-brand-green-on-light font-semibold"
                    : "bg-brand-green text-text-on-brand shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                  : theme === "light"
                    ? "text-text-secondary hover:bg-hover-bg hover:text-text-primary"
                    : "text-text-secondary hover:bg-hover-bg hover:text-text-primary"
                }`}
              >
                <div className="relative shrink-0">
                  <item.icon className={`${mobileOpen ? "h-7 w-7" : "h-6 w-6"} ${mobileOpen ? "" : isCollapsed ? "mx-auto" : "mr-3"} ${
                    isActive
                      ? theme === "light"
                        ? "text-brand-green"
                        : "text-white"
                      : theme === "light"
                        ? "text-text-muted group-hover:text-text-primary"
                        : "text-text-muted group-hover:text-text-primary"
                  }`} />
                  {showBadge && (
                    <span className={`absolute -top-1.5 ${!mobileOpen && isCollapsed ? "right-0" : "-right-1.5"} flex items-center justify-center h-4 min-w-[16px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full`}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
                {(mobileOpen || !isCollapsed) && (
                  <span className="text-base font-medium whitespace-nowrap">{item.label}</span>
                )}
                {!mobileOpen && isCollapsed && (
                  <div className={`absolute left-14 hidden group-hover:block px-2 py-1 text-sm whitespace-nowrap z-50 ${
                    theme === "light" ? "bg-bg-surface text-text-primary border border-border-default" : "bg-bg-surface text-text-primary"
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
  const roleData = isAdmin ? { label: "Admin", color: "from-purple-900/80 to-purple-600/40", colorLight: "bg-brand-purple/5 border-brand-purple/20", icon: Crown }
  : isTeacher ? { label: "Professor", color: "from-green-900/80 to-green-600/40", colorLight: "bg-brand-green/5 border-brand-green/20", icon: GraduationCap }
  : isInstitution ? { label: "Instituição", color: "from-cyan-900/80 to-cyan-600/40", colorLight: "bg-cyan-50 border-cyan-200", icon: Building2 }
  : { label: "Aluno", color: "from-blue-900/80 to-blue-600/40", colorLight: "bg-blue-50 border-blue-200", icon: User };
  const RoleIcon = roleData.icon;
  return (
  <div className={`p-4 bg-gradient-to-br relative overflow-hidden group border ${
    theme === "light" ? roleData.colorLight : roleData.color + " border-transparent"
  }`}>
  <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-white blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>

  <div className={`relative z-10 flex items-center justify-center w-10 h-10 mb-3 ${
    theme === "light" ? "bg-bg-surface/80" : "bg-white/10 backdrop-blur-sm"
  }`}>
  <RoleIcon className={`w-5 h-5 ${theme === "light" ? "text-text-primary" : "text-white"}`} />
  </div>

  <h4 className={`font-bold text-base ${theme === "light" ? "text-text-primary" : "text-white"}`}>{roleData.label}</h4>
  <div className={`mt-1 text-sm ${theme === "light" ? "text-text-secondary" : "text-white"}`}>
  {isAdmin ? "Acesso total ao sistema" : isTeacher ? "Gere os teus cursos" : isInstitution ? "Gere a tua instituição" : "Acesso aos cursos"}
  </div>
  </div>
  );
  })()}

 </div>
 </div>

 {/* 5. Footer da Sidebar (Temas + Logout) */}
 <div className={`p-4 shrink-0 space-y-3 ${theme === "light" ? "border-t border-border-default" : ""}`}>

 
 {/* Botão de Logout */}
 <button
 onClick={handleLogout}
 aria-label="Sair"
 className={`flex items-center transition-all group ${mobileOpen || !isCollapsed ? "w-full px-3 py-2.5 gap-3" : "w-12 h-12 justify-center mx-auto"} ${
    theme === "light"
      ? "text-text-muted hover:bg-red-50 hover:text-red-500"
      : "text-text-muted hover:bg-red-500/10 hover:text-red-400"
  }`}
 title={mobileOpen || !isCollapsed ? "" : "Terminar Sessão"}
 >
 <LogOut className="h-6 w-6 shrink-0 group-hover:text-red-400" />
 {(mobileOpen || !isCollapsed) && <span className="text-base font-medium">Sair</span>}
 </button>
 </div>
  </aside>
  </>
  );
}
