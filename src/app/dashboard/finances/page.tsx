"use client";

import Link from "next/link";
import { CreditCard, Crown, Zap, Lock, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardFinancesPage() {
  const { plan, isAdmin } = useAuth();

  const pill = isAdmin ? (
    <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold border bg-purple-500/15 text-purple-300 border-purple-500/25">
      <Crown className="h-3.5 w-3.5" /> Admin
    </span>
  ) : plan === "golden" ? (
    <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold border bg-yellow-500/15 text-yellow-300 border-yellow-500/25">
      <Crown className="h-3.5 w-3.5" /> Golden
    </span>
  ) : plan === "smart" ? (
    <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold border bg-green-500/15 text-green-300 border-green-500/25">
      <Zap className="h-3.5 w-3.5" /> Smart
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold border bg-gray-500/10 text-gray-300 border-gray-700/60">
      <Lock className="h-3.5 w-3.5" /> Gratuito
    </span>
  );

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
          <CreditCard className="h-6 w-6 text-blue-400" />
        </div>
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-white">Finanças</h1>
          <p className="mt-1 text-gray-400">
            Plano atual, compras e histórico de pagamentos.
          </p>
          <div className="mt-3">{pill}</div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900/40 border border-gray-800 p-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Plano</h2>
          <p className="mt-2 text-sm text-gray-300">
            O teu plano define o acesso aos cursos Smart/Golden e lives exclusivas.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/dashboard/courses"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 font-bold transition-colors"
            >
              Ver cursos <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="bg-gray-900/40 border border-gray-800 p-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Histórico</h2>
          <p className="mt-2 text-sm text-gray-400">
            Em breve vais ver aqui os pagamentos e compras avulsas.
          </p>
        </div>
      </div>
    </div>
  );
}

