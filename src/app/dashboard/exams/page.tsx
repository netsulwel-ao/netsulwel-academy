"use client";

import Link from "next/link";
import { FileText, ArrowUpRight } from "lucide-react";

export default function DashboardExamsPage() {
  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 bg-purple/10 border border-purple/20 flex items-center justify-center shrink-0">
          <FileText className="h-6 w-6 text-purple-light" />
        </div>
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-white">Avaliações</h1>
          <p className="mt-1 text-gray-400">
            Aqui vão aparecer os teus testes, quizzes e avaliações por curso.
          </p>
        </div>
      </div>

      <div className="mt-8 bg-gray-900/40 border border-gray-800 p-6">
        <p className="text-sm text-gray-300">
          Ainda não há avaliações publicadas para a tua conta.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/dashboard/courses"
            className="inline-flex items-center gap-2 bg-purple hover:bg-purple-light text-white px-5 py-3 font-bold transition-colors"
          >
            Ver cursos <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 font-bold transition-colors border border-gray-800"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

