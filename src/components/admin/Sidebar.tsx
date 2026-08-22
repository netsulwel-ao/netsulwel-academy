"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, Settings, LogOut, Search, 
  PanelLeftClose, PanelLeft, Video, DollarSign, Folders, Megaphone, Radio, Calendar, GraduationCap, BookOpen, MailQuestion
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

interface SidebarProps {
 isCollapsed: boolean;
 setIsCollapsed: (val: boolean) => void;
 mobileOpen: boolean;
 setMobileOpen: (val: boolean) => void;
}

const navSections = [
 {
 title: "GESTÃO",
 items: [
 { icon: LayoutDashboard, label: "Visão Geral", href: "/admin" },
 { icon: Folders, label: "Meus Cursos", href: "/admin/courses" },
 { icon: Video, label: "Criar Curso", href: "/admin/courses/new" },
    { icon: Calendar, label: "Cronograma", href: "/admin/schedules" },
    { icon: Radio, label: "Aulas ao Vivo", href: "/admin/lives" },
    { icon: MailQuestion, label: "Pedidos de Lives", href: "/admin/free-live-requests" },
   { icon: GraduationCap, label: "Professores", href: "/admin/teachers" },
   { icon: Users, label: "Alunos", href: "/admin/students" },
   { icon: DollarSign, label: "Vendas", href: "/admin/sales" },
 ]
 },
 {
 title: "SISTEMA",
 items: [
  { icon: Settings, label: "Configurações", href: "/admin/settings" },
  { icon: Megaphone, label: "Anúncios", href: "/admin/announcements" },
  { icon: BookOpen, label: "Manual do Admin", href: "/admin/manual" },
 ]
 }
];

// Rotas acessíveis a professores (não apenas admins)
const teacherAllowed = new Set([
  "/admin", "/admin/courses", "/admin/courses/new",
  "/admin/schedules", "/admin/lives",
  "/admin/students", "/admin/announcements",
  "/admin/sales",
  "/admin/manual",
]);

// Secção extra só para admins (gestão de sistema)
const adminOnlyItems = [
  { icon: Users, label: "Utilizadores", href: "/admin/users" },
];

export default function Sidebar({ isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
   const pathname = usePathname();
   const searchRef = useRef<HTMLInputElement>(null);
   const [searchQuery, setSearchQuery] = useState("");
   const { user, isAdmin, isTeacher, logout } = useAuth();
    const { theme } = useTheme();

   useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
       if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
         e.preventDefault();
         searchRef.current?.focus();
       }
     };
     window.addEventListener("keydown", handleKeyDown);
     return () => window.removeEventListener("keydown", handleKeyDown);
   }, []);

   const roleFiltered = isAdmin
     ? navSections
     : navSections.map(section => ({
         ...section,
         items: section.items.filter(item => teacherAllowed.has(item.href)),
       })).filter(section => section.items.length > 0);

   // Adiciona secção de sistema só para admins
   const sectionsWithAdminOnly = isAdmin
     ? [
         ...roleFiltered.slice(0, 1), // GESTÃO
         {
           title: "GESTÃO AVANÇADA",
           items: adminOnlyItems,
         },
         ...roleFiltered.slice(1), // SISTEMA
       ]
     : roleFiltered;

   const filteredSections = sectionsWithAdminOnly.map(section => ({
     ...section,
     items: section.items.filter(item =>
       item.label.toLowerCase().includes(searchQuery.toLowerCase())
     )
   })).filter(section => section.items.length > 0);

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
  <div className="absolute inset-0 z-40 bg-black lg:hidden" onClick={() => setMobileOpen(false)} />
  )}

  <aside
  role="navigation"
  aria-label="Menu admin"
  className={`flex-shrink-0 flex flex-col h-full transition-all duration-300 ${
  isCollapsed ? "w-20" : "w-[280px]"
  } absolute inset-y-0 left-0 z-50 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 lg:z-auto ${
    theme === "light"
      ? "bg-bg-surface border-r border-border-default shadow-[1px_0_0_0_var(--border-default)]"
      : "bg-bg-page"
  }`}
  >
 <div className="flex h-20 items-center justify-between px-6 shrink-0">
 <a href="/admin" className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
 <img
   src="/Logo-Academy-White.svg"
   alt="Netsulwel"
   className={`h-10 w-auto brightness-0 ${theme === "light" ? "" : "invert drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"}`}
 />
 <span className={`text-lg font-bold tracking-wide ${theme === "light" ? "text-text-primary" : "text-white"}`}>ADMIN</span>
 </a>
 
  <button 
  onClick={() => setIsCollapsed(!isCollapsed)}
  aria-label={isCollapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
  className={`flex h-8 w-8 items-center justify-center transition-colors ${isCollapsed ? "mx-auto" : ""} ${
   theme === "light"
     ? "bg-bg-surface-2 text-text-muted hover:text-text-primary hover:bg-hover-bg"
     : "bg-bg-surface-2 text-text-muted hover:text-text-primary hover:bg-hover-bg"
 }`}
 >
 {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
 </button>
 </div>

  <div className="flex-1 overflow-y-auto overflow-x-hidden pb-4 hide-scrollbar">
 
 <div className={`px-4 mb-6 transition-all duration-300 ${isCollapsed ? "opacity-0 invisible h-0 mb-0" : "opacity-100 visible"}`}>
 <div className="relative flex items-center">
 <Search className={`absolute left-3 h-4 w-4 ${theme === "light" ? "text-text-muted" : "text-text-muted"}`} />
  <input 
  ref={searchRef}
  type="text" 
  placeholder="Pesquisar..." 
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className={`w-full py-2.5 pl-10 pr-10 text-sm placeholder focus:outline-none transition-all ${
    theme === "light"
      ? "bg-bg-surface-2 text-text-primary placeholder:text-text-muted focus:bg-bg-surface focus:ring-1 focus:ring-border-strong"
      : "bg-bg-surface-2 text-text-primary placeholder-text-muted"
  }`} />
 <div className={`absolute right-3 flex items-center justify-center h-5 w-5 text-[13px] font-bold ${
   theme === "light" ? "bg-border-default text-text-muted" : "bg-bg-surface-2 text-text-muted"
 }`}>
 /
 </div>
 </div>
 </div>

 <div className="space-y-6 px-4">
  {filteredSections.map((section, idx) => (
 <div key={idx}>
 {!isCollapsed && (
 <h3 className={`px-3 mb-2 text-[13px] font-bold uppercase tracking-widest ${
   theme === "light" ? "text-text-muted" : "text-text-muted"
 }`}>
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
                  onClick={handleNavClick}
                  aria-current={isActive ? "page" : undefined}
                  title={isCollapsed ? item.label : ""}
 className={`group flex items-center px-3 py-2.5 transition-all relative ${
 isActive 
   ? theme === "light"
     ? "bg-blue-600 text-white shadow-sm"
     : "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]"
   : theme === "light"
     ? "text-text-secondary hover:bg-hover-bg hover:text-text-primary"
     : "text-text-secondary hover:bg-hover-bg hover:text-text-primary"
 }`}
 >
 <item.icon className={`h-5 w-5 shrink-0 ${isCollapsed ? "mx-auto" : "mr-3"} ${
   isActive
     ? "text-white drop-shadow-md"
     : theme === "light"
       ? "text-text-muted group-hover:text-text-primary"
        : "text-text-muted group-hover:text-text-primary"
 }`} />
 
 {!isCollapsed && (
 <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
 )}

 {isCollapsed && (
 <div className={`absolute left-14 hidden group-hover:block px-2 py-1 text-sm text-white whitespace-nowrap z-50 ${
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
 ))}
 </div>

 </div>

 <div className={`p-4 shrink-0 space-y-3 border-t ${theme === "light" ? "border-border-default" : "border-gray-800"}`}>

  <button
  onClick={handleLogout}
  aria-label="Sair do Admin"
  className={`flex items-center transition-all group ${
 isCollapsed ? "w-12 h-12 justify-center mx-auto" : "w-full px-3 py-2.5 gap-3"
 } ${
   theme === "light"
     ? "text-red-500 hover:bg-red-50"
     : "text-red-400 hover:bg-red-500/10"
 }`}
 title={isCollapsed ? "Terminar Sessão" : ""}
 >
 <LogOut className="h-5 w-5 shrink-0" />
 {!isCollapsed && <span className="text-sm font-bold">Sair do Admin</span>}
 </button>
 </div>
  </aside>
  </>
  );
}
