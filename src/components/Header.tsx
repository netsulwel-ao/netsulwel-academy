"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, LogIn, ArrowRight } from "lucide-react";

const navLinks = [
 { label: "Trilhas", href: "#trilhas" },
 { label: "Cursos", href: "#cursos" },
 { label: "Planos", href: "#planos" },
 { label: "FAQ", href: "#faq" },
];

export function Header() {
 const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-gray-800/60 bg-gray-900/40 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[5rem] max-w-6xl items-center justify-between px-6 py-2 sm:min-h-[6rem]">
        <Link href="/" className="flex items-center gap-2 sm:gap-4">
          <img src="/Logo-Academy-White.svg" alt="Netsulwel Academy" className="h-10 w-auto sm:h-16 lg:h-20" />
          <span className="text-lg font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
            Netsulwel Academy
          </span>
        </Link>

 <nav className="hidden items-center gap-8 md:flex">
 {navLinks.map((link) => (
 <a
 key={link.href}
 href={link.href}
 className="text-sm text-gray-300 transition-colors hover:text-gray-100"
 >
 {link.label}
 </a>
 ))}
 </nav>

 <div className="hidden items-center gap-4 md:flex">
 <Link
 href="/login"
 className="flex items-center gap-1.5 text-sm text-gray-300 transition-colors hover:text-gray-100"
 >
 <LogIn className="h-4 w-4" />
 Entrar
 </Link>
  <Link
  href="/register"
  className="flex items-center gap-1.5 bg-green px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-green-light"
  >
  Criar conta grátis
  <ArrowRight className="h-4 w-4" />
  </Link>
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

  {open && (
  <div className="border-t border-gray-800 bg-gray-900/40 px-6 py-4 backdrop-blur-xl md:hidden">
  <nav className="flex flex-col gap-4">
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
  <div className="mt-2 flex flex-col gap-3">
  <Link
  href="/login"
  className="flex items-center justify-center gap-2 border border-gray-600 bg-gray-800/80 py-3 font-medium text-gray-100"
  onClick={() => setOpen(false)}
  >
  <LogIn className="h-4 w-4" />
  Entrar
  </Link>
  <Link
  href="/register"
  className="flex items-center justify-center gap-2 bg-green py-3 font-semibold text-gray-900"
  onClick={() => setOpen(false)}
  >
  Criar conta grátis
  <ArrowRight className="h-4 w-4" />
  </Link>
  </div>
  </nav>
  </div>
  )}
 </header>
 );
}
