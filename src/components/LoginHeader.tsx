"use client";

import Link from "next/link";
import { Sun, Moon } from "lucide-react";

interface LoginHeaderProps {
  theme: "dark" | "light";
  togglePublicTheme: () => void;
  view: string;
  toggleView: (view: "login" | "register" | "register-institution" | "forgot") => void;
}

export default function LoginHeader({ theme, togglePublicTheme, view, toggleView }: LoginHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 lg:px-12 lg:py-6 relative z-20">
      <Link href="/" className="flex lg:hidden items-center gap-3">
        <img src="/Logo-Academy-White.svg" alt="Academy Logo" className="h-10 w-auto" />
        <img src="/logo.svg" alt="Netsulwel" className="h-6 w-auto brightness-0 invert" />
      </Link>
      <div className="flex items-center gap-3">
        <button onClick={togglePublicTheme} className="flex items-center justify-center h-9 w-9 rounded-lg border border-gray-800 bg-gray-900/60 backdrop-blur-md hover:bg-gray-800 hover:border-gray-600 transition-all text-gray-400 hover:text-white">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        {view === "login" ? (
          <>
            <button onClick={() => toggleView("register")} className="text-sm font-medium text-white px-4 py-2.5 border border-gray-800 bg-gray-900/60 backdrop-blur-md hover:bg-gray-800 hover:border-gray-600 transition-all">
              Criar conta
            </button>
            <button onClick={() => toggleView("register-institution")} className="text-sm font-medium text-white px-4 py-2.5 border border-purple-800 bg-purple-900/60 backdrop-blur-md hover:bg-purple-800 hover:border-purple-600 transition-all">
              Instituição
            </button>
          </>
        ) : (
          <button onClick={() => toggleView("login")} className="text-sm font-medium text-white px-6 py-2.5 border border-gray-800 bg-gray-900/60 backdrop-blur-md hover:bg-gray-800 hover:border-gray-600 transition-all">
            Iniciar sessão
          </button>
        )}
      </div>
    </div>
  );
}
