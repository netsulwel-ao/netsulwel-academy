"use client";

import Link from "next/link";
import { Radio, Calendar, Clock, Lock, Play } from "lucide-react";
import type { LiveSession } from "@/types/live";
import type { TrailLiveSession } from "@/types/course";
import { useAuth } from "@/contexts/AuthContext";
import { fmtDate, fmtDateShort } from "../_types/trails";

// ── Lives referenciadas ───────────────────────────────────────

interface TrailLiveListProps {
  lives: LiveSession[];
  enrolledLives: string[];
}

export function TrailLiveList({ lives, enrolledLives }: TrailLiveListProps) {
  const { isAdmin } = useAuth();

  if (lives.length === 0) return null;

  return (
    <section>
      <div className="mb-4">
        <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-red-400 mb-1">
          // aulas ao vivo
        </p>
        <h2 className="text-base font-bold text-gray-200">
          Sessões ao vivo
          <span className="ml-2 font-mono text-sm text-gray-700">({lives.length})</span>
        </h2>
      </div>

      <div className="divide-y divide-gray-800 border border-gray-800">
        {lives.map((live, idx) => {
          const hasAccess =
            isAdmin ||
            live.target === "free" ||
            enrolledLives.includes(live.id ?? "");

          const isLive      = live.status === "live";
          const isScheduled = live.status === "scheduled";
          const isEnded     = live.status === "ended";

          return (
            <div
              key={live.id}
              className="flex items-center gap-3 sm:gap-4 px-4 py-3.5 bg-gray-900 hover:bg-gray-900 transition-colors"
            >
              {/* Número */}
              <span className="w-6 shrink-0 text-center font-mono text-[13px] text-gray-700">
                {String(idx + 1).padStart(2, "0")}
              </span>

              {/* Thumbnail */}
              <div className="h-12 w-16 sm:w-20 shrink-0 overflow-hidden bg-gray-900 border border-gray-800 relative">
                {live.thumbnail ? (
                  <img src={live.thumbnail} alt={live.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Radio className="h-4 w-4 text-gray-800" strokeWidth={1} />
                  </div>
                )}
                {isLive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-950">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-300 truncate">{live.title}</p>
                <div className="mt-0.5 font-mono text-[13px] text-gray-700">
                  {isLive ? (
                    <span className="flex items-center gap-1 text-red-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                      ao vivo agora
                    </span>
                  ) : isScheduled ? (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" strokeWidth={1.5} />
                      {fmtDate(live.scheduledAt)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-700">
                      <Clock className="h-3 w-3" strokeWidth={1.5} />
                      Encerrada · {fmtDateShort(live.scheduledAt)}
                    </span>
                  )}
                </div>
              </div>

              {/* Acção */}
              <div className="shrink-0">
                {isLive && hasAccess ? (
                  <Link
                    href={`/dashboard/lives/${live.id}`}
                    className="flex items-center gap-1.5 bg-red-600 px-3 py-2 font-mono text-[13px] uppercase tracking-widest text-white hover:bg-red-500 transition-colors"
                  >
                    <Play className="h-3 w-3" strokeWidth={1.5} />
                    <span className="hidden sm:inline">Entrar</span>
                  </Link>
                ) : isLive && !hasAccess ? (
                  <span className="flex items-center gap-1.5 border border-gray-800 bg-gray-900 px-3 py-2 font-mono text-[13px] uppercase tracking-widest text-gray-700">
                    <Lock className="h-3 w-3" strokeWidth={1.5} />
                    <span className="hidden sm:inline">{live.target === "standalone" ? "Pago" : "Grátis"}</span>
                  </span>
                ) : isScheduled ? (
                  <span className="border border-gray-800 bg-gray-900 px-3 py-2 font-mono text-[13px] text-gray-700">
                    {fmtDateShort(live.scheduledAt)}
                  </span>
                ) : (
                  <span className="font-mono text-[13px] text-gray-700 px-3 py-2">
                    Encerrada
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Sessões próprias da trilha (liveSessions) ─────────────────

interface TrailScheduleListProps {
  sessions: TrailLiveSession[];
}

export function TrailScheduleList({ sessions }: TrailScheduleListProps) {
  if (!sessions || sessions.length === 0) return null;

  const TARGET_BADGE: Record<string, string> = {
    free:       "border-green  bg-green/8   text-green",
    smart:      "border-blue-500 bg-blue-500/10 text-blue-400",
    golden:     "border-yellow-500 bg-yellow-500/10 text-yellow-400",
    standalone: "border-purple bg-purple/8  text-purple",
  };

  return (
    <section>
      <div className="mb-4">
        <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-amber-400 mb-1">
          // cronograma
        </p>
        <h2 className="text-base font-bold text-gray-200">
          Sessões agendadas
          <span className="ml-2 font-mono text-sm text-gray-700">({sessions.length})</span>
        </h2>
      </div>

      <div className="divide-y divide-gray-800 border border-gray-800">
        {sessions.map((sess, idx) => {
          const isPast = new Date(sess.scheduledAt) < new Date();
          const targetColor = TARGET_BADGE[sess.target ?? "standalone"] ?? TARGET_BADGE.standalone;

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 sm:gap-4 px-4 py-3.5 bg-gray-900 transition-colors ${
                isPast ? "opacity-50" : "hover:bg-gray-900"
              }`}
            >
              {/* Número */}
              <span className="w-6 shrink-0 text-center font-mono text-[13px] text-gray-700">
                {String(idx + 1).padStart(2, "0")}
              </span>

              {/* Thumbnail */}
              <div className="h-12 w-16 sm:w-20 shrink-0 overflow-hidden bg-gray-900 border border-gray-800">
                {sess.thumbnail ? (
                  <img src={sess.thumbnail} alt={sess.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Calendar className="h-4 w-4 text-gray-800" strokeWidth={1} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-gray-300 truncate">{sess.title}</p>
                  <span className={`font-mono text-[13px] uppercase tracking-widest border px-1.5 py-0.5 ${targetColor}`}>
                    {sess.target ?? "standalone"}
                    {sess.target === "standalone" && sess.price > 0
                      ? ` · ${sess.price.toLocaleString("pt-AO")} Kz`
                      : ""}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1 font-mono text-[13px] text-gray-700">
                  <Calendar className="h-3 w-3" strokeWidth={1.5} />
                  {fmtDate(sess.scheduledAt)}
                </div>
              </div>

              {/* Estado */}
              <span className={`shrink-0 font-mono text-[13px] uppercase tracking-widest border px-2 py-1 ${
                isPast
                  ? "border-gray-800 text-gray-700"
                  : "border-green bg-green/5 text-green"
              }`}>
                {isPast ? "Realizada" : "Agendada"}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
