"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, LogIn, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { label: "Trilhas", href: "#trilhas" },
  { label: "Cursos", href: "#cursos" },
  { label: "Professores", href: "/professores" },
  { label: "Comunidade", href: "/community" },
  { label: "Planos", href: "#planos" },
  { label: "FAQ", href: "#faq" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 z-50 w-full border-b border-gray-800/60 bg-gray-900/40 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[5rem] max-w-6xl items-center justify-between px-6 py-2 sm:min-h-[6rem]">
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          <img src="/Logo-Academy-White.svg" alt="Netsulwel Academy" className="h-8 w-auto sm:h-10 lg:h-12" />
          <span className="text-base font-bold tracking-tight text-white sm:text-lg lg:text-xl">
            Netsulwel Academy
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Menu principal">
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
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm text-gray-300 transition-colors hover:text-gray-100">
                Dashboard
              </Link>
              <Button variant="secondary" size="sm" onClick={logout}>
                Sair
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="flex items-center gap-1.5 whitespace-nowrap text-sm text-gray-300 transition-colors hover:text-gray-100">
                <LogIn className="h-4 w-4" />
                Entrar
              </Link>
              <Button href="/register" as="link" size="sm">
                Criar conta grátis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}
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
            <div className="mt-2 flex flex-col gap-3">
              <Button variant="secondary" onClick={() => setOpen(false)} fullWidth>
                <LogIn className="h-4 w-4" />
                Entrar
              </Button>
              <Button onClick={() => setOpen(false)} fullWidth>
                Criar conta grátis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
