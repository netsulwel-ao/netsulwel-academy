"use client";

import Link from "next/link";
import { Users, ArrowUpRight } from "lucide-react";

export default function DashboardCommunityPage() {
  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 bg-green/10 border border-green/20 flex items-center justify-center shrink-0">
          <Users className="h-6 w-6 text-green" />
        </div>
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-white">Comunidade</h1>
          <p className="mt-1 text-gray-400">
            Espaço para discussões, dúvidas e partilha de projetos.
          </p>
        </div>
      </div>

      <div className="mt-8 bg-gray-900/40 border border-gray-800 p-6">
        <p className="text-sm text-gray-300">
          A comunidade dentro da plataforma ainda está a ser preparada. Enquanto isso, usa o catálogo para continuar a estudar.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/dashboard/courses"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-5 py-3 font-bold transition-colors"
          >
            Ir para cursos <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard/lives"
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 font-bold transition-colors border border-gray-800"
          >
            Ver aulas ao vivo
          </Link>
        </div>
      </div>
    </div>
  );
}

