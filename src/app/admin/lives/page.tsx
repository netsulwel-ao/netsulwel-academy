"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
  collection, getDocs, deleteDoc, doc, query, where,
} from "firebase/firestore";
import {
  Plus, Radio, Calendar, Users, Trash2, Play,
  Loader2, Clock, AlertTriangle, Search, X, Filter,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { LiveSession } from "@/types/live";

// ── Helpers ───────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function toDate(raw: unknown): Date {
  if (!raw) return new Date(0);
  if (raw instanceof Date) return raw;
  if (typeof raw === "object" && raw !== null && "toDate" in raw)
    return (raw as { toDate: () => Date }).toDate();
  return new Date(0);
}

// ── Status badge ──────────────────────────────────────────────
const STATUS: Record<string, { label: string; cls: string; dot: string; pulse?: boolean }> = {
  scheduled: { label: "Agendada",  cls: "border-amber-500 text-amber-400",  dot: "bg-amber-400" },
  live:      { label: "Ao Vivo",   cls: "border-red-500 text-red-400",      dot: "bg-red-400",  pulse: true },
  ended:     { label: "Encerrada", cls: "border-gray-700 text-gray-600",       dot: "bg-gray-600" },
};

const TARGET: Record<string, string> = {
  free:       "border-green text-green",
  smart:      "border-blue-500 text-blue-400",
  golden:     "border-amber-500 text-amber-400",
  standalone: "border-purple text-purple",
};
const TARGET_LABEL: Record<string, string> = {
  free: "grátis", smart: "smart", golden: "golden", standalone: "pago",
};

// ── Page ──────────────────────────────────────────────────────
export default function AdminLivesPage() {
  const { isAdmin, isTeacher, user } = useAuth();
  const [lives,      setLives]      = useState<LiveSession[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "scheduled" | "live" | "ended">("all");
  const [showFilters,  setShowFilters]  = useState(false);

  // ── Load ──────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError(null);
    try {
      // No orderBy + where compound — sort in memory
      const q = isTeacher && !isAdmin
        ? query(collection(db, "lives"), where("createdBy", "==", user.uid))
        : query(collection(db, "lives"));
      const snap = await getDocs(q);
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as LiveSession))
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
      setLives(data);
    } catch (err) {
      logger.error("AdminLives: failed to load", err);
      setError("Não foi possível carregar as aulas ao vivo.");
    } finally {
      setLoading(false);
    }
  }, [user?.uid, isTeacher, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // ── Filter ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return lives.filter(l => {
      if (filterStatus !== "all" && l.status !== filterStatus) return false;
      if (q) return l.title.toLowerCase().includes(q) || (l.description?.toLowerCase().includes(q) ?? false);
      return true;
    });
  }, [lives, search, filterStatus]);

  const hasFilters = filterStatus !== "all" || search.trim() !== "";
  const clearFilters = () => { setSearch(""); setFilterStatus("all"); };

  // ── Stats ────────────────────────────────────────────────
  const counts = useMemo(() => ({
    scheduled: lives.filter(l => l.status === "scheduled").length,
    live:      lives.filter(l => l.status === "live").length,
    ended:     lives.filter(l => l.status === "ended").length,
  }), [lives]);

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = useCallback((live: LiveSession) => {
    toast.error(`Apagar "${live.title}"?`, {
      description: "Esta acção é irreversível.",
      action: {
        label: "Apagar",
        onClick: async () => {
          setDeletingId(live.id!);
          try {
            await deleteDoc(doc(db, "lives", live.id!));
            setLives(prev => prev.filter(l => l.id !== live.id));
            toast.success("Aula apagada.");
          } catch (err) {
            logger.error("AdminLives: delete failed", err, { liveId: live.id });
            toast.error("Erro ao apagar.");
          } finally {
            setDeletingId(null);
          }
        },
      },
    });
  }, []);

  return (
    <div className="max-w-[80rem] mx-auto space-y-8 animate-in fade-in duration-300">

      {/* ── Cabeçalho ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-purple mb-2">
            // aulas ao vivo
          </p>
          <h1 className="text-2xl font-bold text-gray-100">Lives</h1>
          <p className="mt-1 text-sm text-gray-600">
            {loading ? "A carregar..." : `${filtered.length} de ${lives.length} sessão${lives.length !== 1 ? "ões" : ""}`}
          </p>
        </div>
        <Link
          href="/admin/lives/new"
          className="flex items-center gap-1.5 border border-red-500 bg-red-500/5 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-red-400 hover:bg-red-500/15 transition-all shrink-0"
        >
          <Plus className="h-3 w-3" /> Nova live
        </Link>
      </div>

      {/* ── KPI mini ── */}
      {!loading && lives.length > 0 && (
        <div className="grid grid-cols-3 gap-px bg-gray-800">
          {(["scheduled", "live", "ended"] as const).map(s => {
            const cfg = STATUS[s];
            return (
              <div key={s} className="border border-gray-800 bg-gray-900 px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`h-1.5 w-1.5 shrink-0 ${cfg.dot} ${cfg.pulse ? "animate-pulse" : ""}`} />
                  <span className={`font-mono text-[13px] uppercase tracking-widest ${cfg.cls}`}>{cfg.label}</span>
                </div>
                <p className="text-xl font-bold text-gray-200 tabular-nums">{counts[s]}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pesquisa + filtros ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-700" strokeWidth={1.5} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar por título..."
              className="w-full border border-gray-800 bg-gray-900 pl-9 pr-9 py-2.5 text-sm text-gray-200 focus:border-purple focus:outline-none transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-3 w-3 text-gray-700 hover:text-gray-500 transition-colors" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 border px-3 py-2.5 font-mono text-[13px] uppercase tracking-widest transition-all shrink-0 ${
              hasFilters
                ? "border-purple bg-purple/8 text-purple"
                : "border-gray-800 bg-gray-900 text-gray-600 hover:border-gray-700"
            }`}
          >
            <Filter className="h-3 w-3" strokeWidth={1.5} />
            Filtros
            {hasFilters && <span className="h-1.5 w-1.5 bg-purple/70 rounded-full" />}
          </button>
        </div>
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 border border-gray-800 bg-gray-900 px-4 py-3">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
              className="border border-gray-800 bg-gray-900 text-sm text-gray-400 px-3 py-1.5 focus:outline-none focus:border-purple transition-colors"
            >
              <option value="all">Todos os estados</option>
              <option value="scheduled">Agendada</option>
              <option value="live">Ao Vivo</option>
              <option value="ended">Encerrada</option>
            </select>
            {hasFilters && (
              <button onClick={clearFilters} className="font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:text-gray-400 flex items-center gap-1 transition-colors">
                <X className="h-3 w-3" /> Limpar
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Erro ── */}
      {error && (
        <div className="flex items-start gap-3 border border-amber-500 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" strokeWidth={1.5} />
          <p className="text-sm text-amber-400">{error}</p>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center border border-gray-800 bg-gray-900 py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
            <Radio className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
          </div>
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">
            {hasFilters ? "// sem resultados" : "// sem lives"}
          </p>
          <p className="text-sm text-gray-600 mb-5">
            {hasFilters ? "Nenhuma sessão corresponde aos filtros." : "Agenda a tua primeira aula ao vivo."}
          </p>
          {hasFilters ? (
            <button onClick={clearFilters} className="font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:text-gray-400 transition-colors">
              ← Limpar filtros
            </button>
          ) : (
            <Link href="/admin/lives/new" className="flex items-center gap-1.5 border border-red-500 bg-red-500/5 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-red-400 hover:bg-red-500/15 transition-all">
              <Plus className="h-3 w-3" /> Criar live
            </Link>
          )}
        </div>
      )}

      {/* ── Tabela ── */}
      {!loading && filtered.length > 0 && (
        <div className="border border-gray-800">
          {/* Header */}
          <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-gray-800 bg-gray-900">
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Sessão</p>
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Data</p>
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Acesso</p>
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Estado</p>
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Acções</p>
          </div>

          <div className="divide-y divide-gray-800">
            {filtered.map(live => {
              const cfg = STATUS[live.status] ?? STATUS.ended;
              const tgt = TARGET[live.target] ?? "border-gray-700 text-gray-600";
              const tgtLabel = TARGET_LABEL[live.target] ?? live.target;

              return (
                <div
                  key={live.id}
                  className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 items-center px-5 py-4 hover:bg-gray-900 transition-colors"
                >
                  {/* Thumb + título */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-16 shrink-0 overflow-hidden border border-gray-800 bg-gray-900">
                      {live.thumbnail
                        ? <img src={live.thumbnail} alt={live.title} className="h-full w-full object-cover" />
                        : <div className="flex h-full w-full items-center justify-center">
                            <Radio className="h-4 w-4 text-gray-800" strokeWidth={1} />
                          </div>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-200 truncate">{live.title}</p>
                      {live.participantCount !== undefined && (
                        <p className="font-mono text-[13px] text-gray-700 mt-0.5 flex items-center gap-1">
                          <Users className="h-2.5 w-2.5" strokeWidth={1.5} />
                          {live.participantCount} participante{live.participantCount !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Data */}
                  <div className="hidden lg:block">
                    <p className="font-mono text-sm text-gray-400 flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-gray-700" strokeWidth={1.5} />
                      {fmtDate(live.scheduledAt)}
                    </p>
                  </div>

                  {/* Acesso */}
                  <div className="hidden lg:block">
                    <span className={`font-mono text-[13px] uppercase tracking-widest px-2 py-0.5 border ${tgt}`}>
                      {tgtLabel}
                    </span>
                    {live.price ? (
                      <p className="font-mono text-[13px] text-gray-700 mt-0.5">
                        {live.price.toLocaleString("pt-AO")} Kz
                      </p>
                    ) : null}
                  </div>

                  {/* Estado */}
                  <div className="hidden lg:flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 shrink-0 ${cfg.dot} ${cfg.pulse ? "animate-pulse" : ""}`} />
                    <span className={`font-mono text-[13px] uppercase tracking-widest ${cfg.cls}`}>{cfg.label}</span>
                  </div>

                  {/* Acções */}
                  <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
                    {/* Mobile badges */}
                    <div className="flex items-center gap-1.5 lg:hidden">
                      <span className={`font-mono text-[13px] uppercase tracking-widest px-2 py-0.5 border ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </div>

                    {/* CTA */}
                    {live.status === "scheduled" && (
                      <Link
                        href={`/admin/lives/${live.id}/studio`}
                        className="flex items-center gap-1.5 border border-red-500 bg-red-500/8 px-3 py-1.5 font-mono text-[13px] uppercase tracking-widest text-red-400 hover:bg-red-500/15 transition-all whitespace-nowrap"
                      >
                        <Play className="h-3 w-3" strokeWidth={1.5} /> Iniciar
                      </Link>
                    )}
                    {live.status === "live" && (
                      <Link
                        href={`/admin/lives/${live.id}/studio`}
                        className="flex items-center gap-1.5 border border-red-500 bg-red-500/15 px-3 py-1.5 font-mono text-[13px] uppercase tracking-widest text-red-400 animate-pulse transition-all whitespace-nowrap"
                      >
                        <Radio className="h-3 w-3" strokeWidth={1.5} /> Entrar
                      </Link>
                    )}
                    {live.status === "ended" && (
                      <span className="flex items-center gap-1 font-mono text-[13px] text-gray-700 px-1 whitespace-nowrap">
                        <Clock className="h-3 w-3" strokeWidth={1.5} />
                        {live.endedAt ? fmtDate(live.endedAt) : "Encerrada"}
                      </span>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(live)}
                      disabled={deletingId === live.id}
                      title="Apagar"
                      className="flex h-8 w-8 items-center justify-center border border-red-500 bg-red-500/5 text-red-400 hover:border-red-500 hover:text-red-400 disabled:opacity-40 transition-all shrink-0"
                    >
                      {deletingId === live.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      }
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-5 py-3 border-t border-gray-800 bg-gray-900">
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
              {hasFilters && ` (filtrado de ${lives.length})`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
