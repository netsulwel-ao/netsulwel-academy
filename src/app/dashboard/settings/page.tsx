"use client";

import Link from "next/link";
import { Settings, User, Shield, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardSettingsPage() {
  const { user, isAdmin } = useAuth();

  return (
    <div className="max-w-[100rem] mx-auto animate-in fade-in duration-500">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 bg-gray-500/10 border border-gray-700/60 flex items-center justify-center shrink-0">
          <Settings className="h-6 w-6 text-gray-300" />
        </div>
        <div className="min-w-0">
          <h1 className="text-4xl font-bold text-white">Definições</h1>
          <p className="mt-1 text-gray-400">Dados do perfil e preferências da conta.</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900/40 border border-gray-800 p-6">
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <User className="h-5 w-5 text-purple-300" /> Perfil
          </h2>
          <div className="mt-4 space-y-2 text-base">
            <p className="text-gray-400">
              <span className="text-gray-500">Nome:</span>{" "}
              <span className="text-white font-medium">{user?.displayName || "—"}</span>
            </p>
            <p className="text-gray-400">
              <span className="text-gray-500">Email:</span>{" "}
              <span className="text-white font-medium">{user?.email || "—"}</span>
            </p>
          </div>
        </div>

        <div className="bg-gray-900/40 border border-gray-800 p-6">
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-300" /> Conta
          </h2>
          <p className="mt-2 text-base text-gray-400">
            {isAdmin
              ? "A tua conta tem permissões de administrador."
              : "Em breve vais poder gerir preferências e segurança por aqui."}
          </p>
          <div className="mt-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 font-bold transition-colors border border-gray-800"
            >
              Voltar ao início <ArrowUpRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

