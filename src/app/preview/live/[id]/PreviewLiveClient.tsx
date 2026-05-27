"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Radio, Calendar, Users, Share2, CheckCircle2,
  Lock, LogIn, Crown, Zap, Play, Clock,
} from "lucide-react";
import Link from "next/link";

const TARGET_LABELS: Record<string, string> = {
  all: "Gratuito — todos os alunos",
  smart: "Plano Smart ou Golden",
  golden: "Exclusivo Plano Golden",
};

function useCountdown(scheduledAt: string) {
  const calc = () => {
    const diff = new Date(scheduledAt).getTime() - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, expired: true };
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      expired: false,
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, [scheduledAt]);
  return time;
}

interface LivePreview {
  id: string; title: string; description: string; thumbnail: string;
  status: string; scheduledAt: string; target: string;
  hostName: string; participantsCount: number;
}

export default function PreviewLiveClient({ live }: { live: LivePreview }) {
  const { user, plan, loading } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const time = useCountdown(live.scheduledAt);

  const hasAccess = !loading && user && (
    live.target === "all" ||
    (live.target === "smart" && (plan === "smart" || plan === "golden")) ||
    (live.target === "golden" && plan === "golden")
  );

  const handleWatch = () => {
    if (!user) { router.push(`/login?redirect=/dashboard/lives/${live.id}`); return; }
    if (hasAccess) { router.push(`/dashboard/lives/${live.id}`); return; }
    router.push("/dashboard/plans");
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: live.title, text: live.description, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch { /* cancelled */ }
  };

  const isLive = live.status === "live";
  const isEnded = live.status === "ended";
  const isScheduled = live.status === "scheduled";

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-gray-950/90 backdrop-blur-xl border-b border-gray-800">
        <Link href="/" className="flex items-center gap-3">
          <img src="/Logo-Academy-White.svg" alt="Netsulwel Academy" className="h-10 w-auto" />
          <span className="text-lg font-bold text-white hidden sm:block">Netsulwel Academy</span>
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white text-sm transition-colors">
            {copied ? <><CheckCircle2 className="h-4 w-4 text-green-400" /> Copiado!</> : <><Share2 className="h-4 w-4" /> Partilhar</>}
          </button>
          {!user && (
            <Link href="/login" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors">
              <LogIn className="h-4 w-4" /> Entrar
            </Link>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="relative">
        {live.thumbnail && (
          <div className="absolute inset-0 overflow-hidden">
            <img src={live.thumbnail} alt="" className="w-full h-full object-cover opacity-10 blur-2xl scale-110" />
            <div className="absolute inset-0 bg-gradient-to-b from-gray-950/60 via-gray-950/80 to-gray-950" />
          </div>
        )}

        <div className="relative mx-auto max-w-6xl px-6 py-16 flex flex-col lg:flex-row gap-12 items-start">

          {/* Left */}
          <div className="flex-1 space-y-6">
            {/* Status badge */}
            <div className="flex flex-wrap items-center gap-3">
              {isLive && (
                <div className="flex items-center gap-2 bg-red-600 px-4 py-1.5 text-sm font-bold text-white">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  AO VIVO AGORA
                </div>
              )}
              {isScheduled && (
                <div className="flex items-center gap-2 bg-blue-500/15 border border-blue-500/30 px-4 py-1.5 text-sm font-bold text-blue-400">
                  <Calendar className="h-4 w-4" />
                  Agendada
                </div>
              )}
              {isEnded && (
                <div className="flex items-center gap-2 bg-gray-800 px-4 py-1.5 text-sm font-bold text-gray-400">
                  Encerrada
                </div>
              )}
              <span className="text-xs text-gray-500 border border-gray-700 px-3 py-1">
                {TARGET_LABELS[live.target] ?? "Todos os alunos"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">{live.title}</h1>
            <p className="text-lg text-gray-300 leading-relaxed max-w-2xl">{live.description}</p>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-2">
                <Radio className="h-4 w-4" />
                {live.hostName}
              </span>
              {live.scheduledAt && (
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(live.scheduledAt).toLocaleDateString("pt-AO", {
                    day: "2-digit", month: "long", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              )}
              {isLive && (
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {live.participantsCount} online
                </span>
              )}
            </div>

            {/* Countdown */}
            {isScheduled && !time.expired && (
              <div className="bg-gray-900/60 border border-gray-800 p-5 inline-flex flex-col gap-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" /> Começa em
                </p>
                <div className="flex items-center gap-3">
                  {time.d > 0 && (
                    <>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-white tabular-nums">{String(time.d).padStart(2, "0")}</p>
                        <p className="text-xs text-gray-500 mt-1">dias</p>
                      </div>
                      <span className="text-2xl text-gray-600 font-bold">:</span>
                    </>
                  )}
                  {[{ v: time.h, l: "horas" }, { v: time.m, l: "min" }, { v: time.s, l: "seg" }].map(({ v, l }, i, arr) => (
                    <div key={l} className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-white tabular-nums">{String(v).padStart(2, "0")}</p>
                        <p className="text-xs text-gray-500 mt-1">{l}</p>
                      </div>
                      {i < arr.length - 1 && <span className="text-2xl text-gray-600 font-bold">:</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile CTA */}
            <div className="lg:hidden">
              <LiveCTABox live={live} hasAccess={!!hasAccess} user={user} loading={loading} onWatch={handleWatch} />
            </div>
          </div>

          {/* Right — desktop CTA */}
          <div className="hidden lg:block w-80 shrink-0 sticky top-24">
            <LiveCTABox live={live} hasAccess={!!hasAccess} user={user} loading={loading} onWatch={handleWatch} />
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveCTABox({ live, hasAccess, user, loading, onWatch }: {
  live: LivePreview; hasAccess: boolean; user: unknown; loading: boolean; onWatch: () => void;
}) {
  const isLive = live.status === "live";
  const isEnded = live.status === "ended";

  return (
    <div className="bg-gray-900 border border-gray-800 overflow-hidden shadow-2xl">
      {live.thumbnail && (
        <div className="relative aspect-video overflow-hidden">
          <img src={live.thumbnail} alt={live.title} className="w-full h-full object-cover" />
          {isLive && (
            <div className="absolute inset-0 bg-gray-950/40 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-red-600 px-4 py-2 text-sm font-bold text-white">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                AO VIVO
              </div>
            </div>
          )}
          {!isLive && (
            <div className="absolute inset-0 bg-gray-950/50 flex items-center justify-center">
              <Lock className="h-8 w-8 text-white/50" />
            </div>
          )}
        </div>
      )}

      <div className="p-6 space-y-4">
        {isEnded ? (
          <p className="text-center text-gray-500 py-4">Esta aula já terminou.</p>
        ) : (
          <>
            <button onClick={onWatch} disabled={loading || isEnded}
              className={`w-full flex items-center justify-center gap-2 py-4 font-bold text-sm transition-colors disabled:opacity-60 ${
                isLive && hasAccess ? "bg-red-600 hover:bg-red-500 text-white animate-pulse"
                : hasAccess ? "bg-green-600 hover:bg-green-500 text-white"
                : live.target === "golden" ? "bg-yellow-500 hover:bg-yellow-400 text-gray-900"
                : live.target === "smart" ? "bg-green-600 hover:bg-green-500 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}>
              {loading ? <span className="animate-pulse">A verificar...</span>
              : !user ? <><LogIn className="h-4 w-4" /> Entrar para Assistir</>
              : hasAccess && isLive ? <><Radio className="h-4 w-4" /> Entrar na Aula Agora</>
              : hasAccess ? <><Play className="h-4 w-4" /> Entrar quando começar</>
              : live.target === "golden" ? <><Crown className="h-4 w-4" /> Ativar Plano Golden</>
              : live.target === "smart" ? <><Zap className="h-4 w-4" /> Ativar Plano Smart</>
              : <><LogIn className="h-4 w-4" /> Entrar para Assistir</>}
            </button>

            <ul className="space-y-2 text-sm text-gray-400">
              {[
                "Aula ao vivo interativa",
                "Chat em tempo real",
                "Levantar a mão para perguntas",
                live.target === "all" ? "Acesso gratuito" : `Requer ${TARGET_LABELS[live.target]}`,
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
