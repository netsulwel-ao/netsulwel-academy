"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Menu, X, LogIn, ArrowRight, Search, BookOpen, Loader2 } from "lucide-react";
import { TransitionLink } from "./TransitionLink";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import type { Course } from "@/types/course";

const navLinks = [
 { label: "Cursos", href: "#cursos" },
 { label: "Professores", href: "/professores" },
 { label: "Planos", href: "#planos" },
 { label: "FAQ", href: "#faq" },
];

export function Header() {
 const [open, setOpen] = useState(false);
 const reduceMotion = useReducedMotion();

 const [searchOpen, setSearchOpen] = useState(false);
 const [searchQuery, setSearchQuery] = useState("");
 const [searchResults, setSearchResults] = useState<Course[]>([]);
 const [searchLoading, setSearchLoading] = useState(false);
 const searchRef = useRef<HTMLDivElement>(null);
 const inputRef = useRef<HTMLInputElement>(null);
 const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

 const doSearch = useCallback(async (q: string) => {
   if (q.trim().length < 2) { setSearchResults([]); return; }
   setSearchLoading(true);
   try {
     // Get AI-expanded search terms
     const aiRes = await fetch("/api/ai/search", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ query: q }),
     });
     const { terms } = await aiRes.json();

     // Fetch published courses
     const snap = await getDocs(query(
       collection(db, "courses"),
       where("status", "==", "published"),
     ));

     const allCourses = snap.docs.map(d => ({ id: d.id, ...d.data() } as Course));
     const lower = q.toLowerCase().trim();

     // Score each course
     const scored = allCourses.map(c => {
       const title = c.title?.toLowerCase() || "";
       const desc = c.description?.toLowerCase() || "";
       const tags = (c.tags || []).join(" ").toLowerCase();
       const cat = c.category?.toLowerCase() || "";
       let score = 0;

       if (title.includes(lower)) score += 10;

       for (const term of terms) {
         const t = term.toLowerCase();
         if (title.includes(t)) score += 5;
         if (tags.includes(t)) score += 3;
         if (cat.includes(t)) score += 3;
         if (desc.includes(t)) score += 1;
       }

       return { course: c, score };
     });

     const matches = scored
       .filter(s => s.score > 0)
       .sort((a, b) => b.score - a.score)
       .slice(0, 6)
       .map(s => s.course);

     setSearchResults(matches);
   } catch { setSearchResults([]); }
   setSearchLoading(false);
 }, []);

 useEffect(() => {
   if (debounceRef.current) clearTimeout(debounceRef.current);
   debounceRef.current = setTimeout(() => doSearch(searchQuery), 300);
   return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
 }, [searchQuery, doSearch]);

 useEffect(() => {
   const handler = (e: KeyboardEvent) => {
     if ((e.metaKey || e.ctrlKey) && e.key === "k") {
       e.preventDefault();
       setSearchOpen(prev => !prev);
       if (!searchOpen) setTimeout(() => inputRef.current?.focus(), 50);
     }
   };
   window.addEventListener("keydown", handler);
   return () => window.removeEventListener("keydown", handler);
 }, [searchOpen]);

  return (
    <>
    <motion.header
      className="fixed top-0 z-50 w-full border-b border-gray-800 bg-gray-900"
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mx-auto flex min-h-[5rem] max-w-6xl items-center justify-between px-6 py-2 sm:min-h-[6rem]">
        <TransitionLink href="/" className="flex items-center gap-2 sm:gap-3">
          <img src="/Logo-Academy-White.svg" alt="Netsulwel Academy" className="h-8 w-auto sm:h-10 lg:h-12" />
          <span className="text-base font-bold tracking-tight text-white sm:text-lg lg:text-xl">
            Netsulwel Academy
          </span>
        </TransitionLink>

 <nav className="hidden items-center gap-8 md:flex" aria-label="Menu principal">
 {navLinks.map((link) => (
 <a
 key={link.href}
 href={link.href}
 className="group relative text-sm text-gray-300 transition-colors hover:text-gray-100"
 >
 {link.label}
 <span className="absolute -bottom-1 left-0 h-px w-0 bg-purple/70 transition-all duration-300 group-hover:w-full" />
 </a>
 ))}
 </nav>

 {/* Search trigger */}
 <div className="hidden md:block">
   <button
     onClick={() => { setSearchOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
     className="flex items-center gap-2 h-9 px-3 border border-gray-800 bg-gray-900 text-sm text-gray-500 transition-colors hover:border-gray-700 hover:text-gray-300"
   >
     <Search className="h-4 w-4 shrink-0" />
     <span>Pesquisar</span>
     <span className="ml-4 text-[11px] font-mono text-gray-700">Ctrl+K</span>
   </button>
 </div>

 <div className="hidden items-center gap-4 md:flex">
  <TransitionLink
  href="/login"
  className="group flex items-center gap-1.5 whitespace-nowrap text-sm text-gray-300 transition-colors hover:text-gray-100"
  whileHover={{ y: -1 }}
  whileTap={{ scale: 0.97 }}
  >
  <LogIn className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
  Entrar
  </TransitionLink>
   <TransitionLink
   href="/register"
   whileHover={{ scale: 1.04, y: -1 }}
   whileTap={{ scale: 0.97 }}
   className="group relative flex items-center gap-1.5 overflow-hidden bg-green px-5 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-green-light"
   >
   <span className="absolute inset-0 -translate-x-full bg-white transition-transform duration-500 group-hover:translate-x-full" />
   <span className="relative flex items-center gap-1.5">
     Criar conta grátis
     <ArrowRight className="h-4 w-4" />
   </span>
   </TransitionLink>
  </div>

 <button
 type="button"
 className="text-gray-100 md:hidden"
 onClick={() => setOpen(!open)}
 aria-label={open ? "Fechar menu" : "Abrir menu"}
 >
 {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
 </button>
 </div>

  <AnimatePresence>
  {open && (
  <motion.div
  className="border-t border-gray-800 bg-gray-900 px-6 py-4 md:hidden"
  initial={{ height: 0, opacity: 0 }}
  animate={{ height: "auto", opacity: 1 }}
  exit={{ height: 0, opacity: 0 }}
  transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
  >
   <nav className="flex flex-col gap-4" aria-label="Menu de navegação móvel">
  {navLinks.map((link) => (
  <a
  key={link.href}
  href={link.href}
  className="text-gray-300 hover:text-gray-100"
  onClick={() => setOpen(false)}
  >
  {link.label}
  </a>
  ))}
  {/* Mobile search */}
  <div className="relative" ref={searchRef}>
    <div className="flex items-center gap-2 border border-gray-700 bg-gray-800 px-3">
      <Search className="h-4 w-4 text-gray-500 shrink-0" />
      <input
        type="text"
        placeholder="Pesquisar cursos..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        onFocus={() => setSearchOpen(true)}
        className="w-full bg-transparent py-3 text-sm text-white outline-none"
      />
      {searchLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-500 shrink-0" />}
    </div>
    <AnimatePresence>
      {searchOpen && searchQuery.length >= 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="mt-1 max-h-60 overflow-y-auto border border-gray-700 bg-gray-900"
        >
          {searchResults.length === 0 && !searchLoading ? (
            <p className="px-4 py-4 text-center text-sm text-gray-500">Nenhum curso encontrado</p>
          ) : (
            searchResults.map(c => (
              <a
                key={c.id}
                href={`/preview/course/${c.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-800"
                onClick={() => { setOpen(false); setSearchQuery(""); setSearchOpen(false); }}
              >
                {c.thumbnail ? (
                  <img src={c.thumbnail} alt="" className="h-8 w-11 shrink-0 object-cover" />
                ) : (
                  <div className="flex h-8 w-11 shrink-0 items-center justify-center bg-gray-800">
                    <BookOpen className="h-3.5 w-3.5 text-gray-600" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{c.title}</p>
                  <p className="truncate text-sm text-gray-500">
                    {c.price === 0 ? "Grátis" : `${c.price?.toLocaleString("pt-AO")} Kz`}
                  </p>
                </div>
              </a>
            ))
          )}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
  <div className="mt-2 flex flex-col gap-3">
  <TransitionLink
  href="/login"
  className="flex items-center justify-center gap-2 border border-gray-600 bg-gray-800 py-3 font-medium text-gray-100"
  onClick={() => setOpen(false)}
  whileTap={{ scale: 0.98 }}
  >
  <LogIn className="h-4 w-4" />
  Entrar
  </TransitionLink>
  <TransitionLink
  href="/register"
  className="flex items-center justify-center gap-2 bg-green py-3 font-semibold text-gray-900"
  onClick={() => setOpen(false)}
  whileTap={{ scale: 0.98 }}
  >
  Criar conta grátis
  <ArrowRight className="h-4 w-4" />
  </TransitionLink>
  </div>
  </nav>
  </motion.div>
  )}
  </AnimatePresence>
 </motion.header>

 {/* Search modal overlay */}
 {searchOpen && (
   <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 animate-in fade-in duration-200" onKeyDown={e => { if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); } }}>
     <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setSearchOpen(false); setSearchQuery(""); }} />
     <div className="relative w-full max-w-2xl border border-gray-800 bg-gray-900 shadow-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 fade-in duration-200">
       {/* Search input */}
       <div className="flex items-center gap-3 border-b border-gray-800 px-5 shrink-0">
         <Search className="h-5 w-5 shrink-0 text-gray-600" />
         <input
           ref={inputRef}
           type="text"
           placeholder="Pesquisar cursos..."
           value={searchQuery}
           onChange={e => setSearchQuery(e.target.value)}
           className="w-full bg-transparent py-5 text-lg text-white outline-none"
         />
         {searchLoading && <Loader2 className="h-5 w-5 animate-spin shrink-0 text-gray-600" />}
         <button
           onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
           className="shrink-0 text-xs font-mono px-2 py-1 border border-gray-700 text-gray-600"
         >
           ESC
         </button>
       </div>

       {/* Results */}
       <div className="flex-1 overflow-y-auto">
         {searchQuery.length < 2 ? (
           <div className="px-5 py-12 text-center text-sm text-gray-600">
             Escreva para pesquisar cursos...
           </div>
         ) : searchResults.length === 0 && !searchLoading ? (
           <p className="px-5 py-12 text-center text-sm text-gray-600">
             Nenhum curso encontrado para "{searchQuery}"
           </p>
         ) : (
           <>
             <p className="px-5 pt-4 pb-2 text-xs font-medium text-gray-600">
               {searchResults.length} resultado{searchResults.length !== 1 && "s"}
             </p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-5 pb-5">
               {searchResults.map(c => (
                 <a
                   key={c.id}
                   href={`/preview/course/${c.id}`}
                   className="group flex gap-3 border border-gray-800 p-3 transition-all hover:border-gray-700 hover:bg-gray-800/40"
                 >
                   {c.thumbnail ? (
                     <img src={c.thumbnail} alt="" className="h-20 w-28 shrink-0 object-cover" />
                   ) : (
                     <div className="flex h-20 w-28 shrink-0 items-center justify-center bg-gray-800">
                       <BookOpen className="h-6 w-6 text-gray-600" />
                     </div>
                   )}
                   <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                     <div>
                       <p className="text-sm font-semibold line-clamp-2 leading-snug text-gray-200 group-hover:text-white">{c.title}</p>
                       <p className="text-xs mt-1 line-clamp-1 text-gray-500">
                         {c.description || "Sem descrição"}
                       </p>
                     </div>
                     <p className="text-sm font-bold text-gray-400">
                       {c.price === 0 ? "Grátis" : `${c.price?.toLocaleString("pt-AO")} Kz`}
                     </p>
                   </div>
                 </a>
               ))}
             </div>
           </>
         )}
       </div>
     </div>
   </div>
 )}
  </>
  );
}
