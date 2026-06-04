"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, Settings, LogOut, Search, 
  PanelLeftClose, PanelLeft, Sun, Moon, Video, DollarSign, Folders, Layers, Megaphone, Radio, Calendar, MessageSquare, GraduationCap, BookOpen
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
 isCollapsed: boolean;
 setIsCollapsed: (val: boolean) => void;
 mobileOpen: boolean;
 setMobileOpen: (val: boolean) => void;
 theme?: string;
 onToggleTheme?: () => void;
}

const navSections = [
 {
 title: "GESTÃO",
 items: [
 { icon: LayoutDashboard, label: "Visão Geral", href: "/admin" },
 { icon: Folders, label: "Meus Cursos", href: "/admin/courses" },
 { icon: Video, label: "Criar Curso", href: "/admin/courses/new" },
   { icon: Layers, label: "Trilhas", href: "/admin/trails" },
   { icon: Calendar, label: "Cronograma", href: "/admin/schedules" },
   { icon: Radio, label: "Aulas ao Vivo", href: "/admin/lives" },
   { icon: GraduationCap, label: "Professores", href: "/admin/teachers" },
   { icon: Users, label: "Alunos", href: "/admin/students" },
   { icon: DollarSign, label: "Vendas", href: "/admin/sales" },
   { icon: MessageSquare, label: "Comunidade", href: "/admin/community" },
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
  "/admin/trails", "/admin/schedules", "/admin/lives",
  "/admin/students", "/admin/announcements",
  "/admin/sales", "/admin/community",
  "/admin/manual",
]);

// Secção extra só para admins (gestão de sistema)
const adminOnlyItems = [
  { icon: Users, label: "Utilizadores", href: "/admin/users" },
];

export default function Sidebar({ isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen, theme, onToggleTheme }: SidebarProps) {
   const pathname = usePathname();
   const searchRef = useRef<HTMLInputElement>(null);
   const [searchQuery, setSearchQuery] = useState("");
   const { isAdmin, isTeacher, logout } = useAuth();

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
 <div className="flex h-20 items-center justify-between px-6 shrink-0">
 <a href="/admin" className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
 <img
   src="/Logo-Academy-White.svg"
   alt="Netsulwel"
   className={`h-10 w-auto brightness-0 ${theme === "light" ? "" : "invert drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"}`}
 />
 <span className={`text-lg font-bold tracking-wide ${theme === "light" ? "text-slate-800" : "text-white"}`}>ADMIN</span>
 </a>
 
 <button 
 onClick={() => setIsCollapsed(!isCollapsed)}
 className={`flex h-8 w-8 items-center justify-center transition-colors ${isCollapsed ? "mx-auto" : ""} ${
   theme === "light"
     ? "bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200"
     : "bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800"
 }`}
 >
 {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
 </button>
 </div>

  <div className="flex-1 overflow-y-auto overflow-x-hidden pb-4 hide-scrollbar">
 
 <div className={`px-4 mb-6 transition-all duration-300 ${isCollapsed ? "opacity-0 invisible h-0 mb-0" : "opacity-100 visible"}`}>
 <div className="relative flex items-center">
 <Search className={`absolute left-3 h-4 w-4 ${theme === "light" ? "text-slate-400" : "text-gray-500"}`} />
  <input 
  ref={searchRef}
  type="text" 
  placeholder="Pesquisar..." 
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className={`w-full py-2.5 pl-10 pr-10 text-sm placeholder focus:outline-none transition-all ${
    theme === "light"
      ? "bg-slate-100 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-300"
      : "bg-gray-900 text-gray-200 placeholder-gray-500"
  }`} />
 <div className={`absolute right-3 flex items-center justify-center h-5 w-5 text-[10px] font-bold ${
   theme === "light" ? "bg-slate-200 text-slate-500" : "bg-gray-800 text-gray-400"
 }`}>
 /
 </div>
 </div>
 </div>

 <div className="space-y-6 px-4">
  {filteredSections.map((section, idx) => (
 <div key={idx}>
 {!isCollapsed && (
 <h3 className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-widest ${
   theme === "light" ? "text-slate-400" : "text-gray-500"
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
 title={isCollapsed ? item.label : ""}
 className={`group flex items-center px-3 py-2.5 transition-all relative ${
 isActive 
   ? theme === "light"
     ? "bg-blue-600 text-white shadow-sm"
     : "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]"
   : theme === "light"
     ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
     : "text-gray-400 hover:bg-gray-900 hover:text-gray-200"
 }`}
 >
 <item.icon className={`h-5 w-5 shrink-0 ${isCollapsed ? "mx-auto" : "mr-3"} ${
   isActive
     ? "text-white drop-shadow-md"
     : theme === "light"
       ? "text-slate-400 group-hover:text-slate-700"
       : "text-gray-500 group-hover:text-gray-300"
 }`} />
 
 {!isCollapsed && (
 <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
 )}

 {isCollapsed && (
 <div className={`absolute left-14 hidden group-hover:block px-2 py-1 text-xs text-white whitespace-nowrap z-50 ${
   theme === "light" ? "bg-slate-800" : "bg-gray-800"
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

 <div className={`p-4 shrink-0 space-y-3 ${theme === "light" ? "border-t border-slate-200" : ""}`}>
  <div className={`flex items-center justify-center p-1 ${isCollapsed ? "flex-col gap-2 py-3" : "gap-1"} ${
    theme === "light" ? "bg-slate-100" : "bg-gray-900"
  }`}>
  <button onClick={onToggleTheme} className={`flex items-center justify-center transition-all ${
    theme === "light"
      ? "bg-white text-purple shadow-sm ring-1 ring-slate-200"
      : "text-gray-400 hover:text-white"
  } ${isCollapsed ? "w-8 h-8" : "w-1/2 py-1.5"}`}>
  <Sun className="w-4 h-4" />
  </button>
  <button onClick={onToggleTheme} className={`flex items-center justify-center transition-all ${
    theme === "dark"
      ? "bg-gray-800 text-blue-500 shadow-sm"
      : "text-slate-400 hover:text-slate-600"
  } ${isCollapsed ? "w-8 h-8" : "w-1/2 py-1.5"}`}>
  <Moon className="w-4 h-4" />
  </button>
  </div>

 <button
 onClick={handleLogout}
 className={`flex items-center transition-all group ${
 isCollapsed ? "w-12 h-12 justify-center mx-auto" : "w-full px-3 py-2.5 gap-3"
 } ${
   theme === "light"
     ? "text-slate-400 hover:bg-red-50 hover:text-red-500"
     : "text-gray-500 hover:bg-red-500/10 hover:text-red-400"
 }`}
 title={isCollapsed ? "Terminar Sessão" : ""}
 >
 <LogOut className="h-5 w-5 shrink-0 group-hover:text-red-400" />
 {!isCollapsed && <span className="text-sm font-medium">Sair do Admin</span>}
 </button>
 </div>
  </aside>
  </>
  );
}
