"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import {
  Radio,
  Calendar,
  Clock,
  Users,
  Play,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";
import type { LiveSession } from "@/types/live";

/* ─── Countdown Hook ──────────────────────────────────── */
function useCountdown(targetDate: string) {
  const calc = () => {
    const diff = new Date(targetDate).getTime() - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, expired: true };
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s, expired: false };
  };

  const [time, setTime] = useState(calc);

  useEffect(() => {
    const t = setInterval(() => setTime(calc), 1000);
    return () => clearInterval(t);
  }, [targetDate]);

  return time;
}

/* ─── Countdown Display ───────────────────────────────── */
function CountdownDisplay({ scheduledAt }: { scheduledAt: string }) {
  const time = useCountdown(scheduledAt);

  if (time.expired) return null;

  return (
    <div className="flex items-center gap-2">
      {time.d > 0 && (
        <span className="text-sm text-gray-400">{time.d}d</span>
      )}
      <div className="flex items-center gap-1 text-sm font-mono tabular-nums text-gray-300">
        <span className="bg-gray-800 px-1.5 py-0.5">
          {String(time.h).padStart(2, "0")}
        </span>
        <span className="text-gray-600">:</span>
        <span className="bg-gray-800 px-1.5 py-0.5">
          {String(time.m).padStart(2, "0")}
        </span>
        <span className="text-gray-600">:</span>
        <span className="bg-gray-800 px-1.5 py-0.5">
          {String(time.s).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}

/* ─── Target Access Check ─────────────────────────────── */
function canAccess(plan: string, target: string, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  if (target === "free") return true;
  if (target === "smart") return plan === "smart" || plan === "golden";
  if (target === "golden") return plan === "golden";
  return false;
}

const TARGET_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: "Gratuito", color: "text-green-400 bg-green-500/10" },
  smart: { label: "Smart", color: "text-blue-400 bg-blue-500/10" },
  golden: { label: "Golden", color: "text-amber-400 bg-amber-500/10" },
};

/* ─── Main Page ────────────────────────────────────────── */
export default function DashboardLivesPage() {
  const { plan, isAdmin } = useAuth();
  const [lives, setLives] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLives = async () => {
      try {
        // Tem de filtrar por status — regras Firestore só permitem scheduled/live/ended a alunos.
        const snap = await getDocs(
          query(
            collection(db, "lives"),
            where("status", "in", ["scheduled", "live", "ended"]),
            orderBy("scheduledAt", "desc")
          )
        );
        const all = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as LiveSession)
        );
        setLives(all);
      } catch (err) {
        console.error("Erro ao carregar lives:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLives();
  }, []);

  const liveSessions = lives.filter((l) => l.status === "live");
  const scheduledSessions = lives.filter((l) => l.status === "scheduled");
  const endedSessions = lives.filter((l) => l.status === "ended");

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-purple" />
      </div>
    );
  }

  return (
    <div className="max-w-[100rem] mx-auto space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white flex items-center gap-3">
          <Radio className="h-10 w-10 text-red-400" />
          Aulas ao Vivo
        </h1>
        <p className="mt-2 text-gray-400">
          Assista às aulas em direto e interaja com o professor em tempo real.
        </p>
      </div>

      {/* Currently Live */}
      {liveSessions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            A Decorrer Agora
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveSessions.map((live) => {
              const hasAccess = canAccess(plan, live.target, isAdmin);
              const target = TARGET_LABELS[live.target];

              return (
                <div
                  key={live.id}
                  className="bg-gray-900/40 backdrop-blur-xl overflow-hidden group border border-red-500/20 hover:border-red-500/40 transition-all"
                >
                  <div className="relative h-44 overflow-hidden">
                    {live.thumbnail ? (
                      <img
                        src={live.thumbnail}
                        alt={live.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-900/40 to-gray-900 flex items-center justify-center">
                        <Radio className="h-12 w-12 text-red-800" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white text-sm font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      AO VIVO
                    </div>
                    <div className={`absolute top-3 right-3 px-2 py-1 text-sm font-bold ${target.color} backdrop-blur-md`}>
                      {target.label}
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="text-xl font-bold text-white">{live.title}</h3>
                    <p className="text-base text-gray-400 line-clamp-2">{live.description}</p>

                    {hasAccess ? (
                      <Link
                        href={`/dashboard/lives/${live.id}`}
                        className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white py-3 font-bold transition-colors"
                      >
                        <Play className="h-6 w-6" />
                        Entrar na Aula
                      </Link>
                    ) : (
                      <div className="flex items-center justify-center gap-2 w-full bg-gray-800 text-gray-500 py-3 text-base">
                        <Lock className="h-5 w-5" />
                        Requer Plano {live.target === "golden" ? "Golden" : "Smart"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Scheduled */}
      {scheduledSessions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-400" />
            Próximas Aulas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scheduledSessions.map((live) => {
              const hasAccess = canAccess(plan, live.target, isAdmin);
              const target = TARGET_LABELS[live.target];

              return (
                <div
                  key={live.id}
                  className="bg-gray-900/40 backdrop-blur-xl overflow-hidden group hover:bg-gray-900/60 transition-all"
                >
                  <div className="relative h-36 overflow-hidden">
                    {live.thumbnail ? (
                      <img
                        src={live.thumbnail}
                        alt={live.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-900/30 to-gray-900 flex items-center justify-center">
                        <Radio className="h-10 w-10 text-gray-700" />
                      </div>
                    )}
                    <div className={`absolute top-3 right-3 px-2 py-1 text-sm font-bold ${target.color} backdrop-blur-md`}>
                      {target.label}
                    </div>
                    {!hasAccess && (
                      <div className="absolute inset-0 bg-gray-950/60 flex items-center justify-center">
                        <Lock className="h-10 w-10 text-gray-500" />
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    <h3 className="text-base font-bold text-white truncate">{live.title}</h3>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {formatDate(live.scheduledAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                      <span className="flex items-center gap-1.5 text-sm text-gray-400">
                        <Clock className="h-4 w-4" />
                        Começa em:
                      </span>
                      <CountdownDisplay scheduledAt={live.scheduledAt} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Past Sessions */}
      {endedSessions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="h-6 w-6 text-gray-500" />
            Aulas Anteriores
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {endedSessions.map((live) => (
              <div
                key={live.id}
                className="bg-gray-900/30 backdrop-blur-xl overflow-hidden opacity-70"
              >
                <div className="relative h-28 overflow-hidden">
                  {live.thumbnail ? (
                    <img
                      src={live.thumbnail}
                      alt={live.title}
                      className="w-full h-full object-cover grayscale"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                      <Radio className="h-10 w-10 text-gray-800" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 px-2 py-1 bg-gray-800 text-gray-400 text-sm font-bold">
                    Encerrada
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-bold text-gray-400 truncate">{live.title}</h3>
                  <span className="text-sm text-gray-600 mt-1 block">
                    {formatDate(live.scheduledAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {lives.length === 0 && (
        <div className="p-12 bg-gray-900/40 backdrop-blur-xl text-center">
          <div className="mx-auto w-16 h-16 bg-purple/10 text-purple flex items-center justify-center mb-4">
            <Sparkles className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Nenhuma aula ao vivo agendada
          </h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Quando o professor agendar uma nova aula ao vivo, ela aparecerá aqui
            com uma contagem regressiva.
          </p>
        </div>
      )}
    </div>
  );
}
