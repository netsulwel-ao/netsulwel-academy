"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building2, Search, Loader2, Check, X, Mail,
  Calendar, Users, Eye, AlertTriangle, Filter,
  ChevronRight, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { logger } from "@/lib/logger";
import type { Institution } from "@/types/institution";

// ── Helpers ───────────────────────────────────────────────────
function toDate(raw: unknown): Date {
  if (!raw) return new Date(0);
  if (raw instanceof Date) return raw;
  if (typeof raw === "object" && raw !== null && "toDate" in raw)
    return (raw as { toDate: () => Date }).toDate();
  return new Date(0);
}

// ── Badges ────────────────────────────────────────────────────
const STATUS_MAP = {
  pending:   { label: "pendente",  cls: "border-amber-500/30 text-amber-400/80 bg-amber-500/8", dot: "bg-amber-400" },
  approved:  { label: "aprovada",  cls: "border-green/30 text-green/80 bg-green/8",             dot: "bg-green-400" },
  suspended: { label: "suspensa",  cls: "border-red-500/30 text-red-400/80 bg-red-500/8",       dot: "bg-red-400" },
} as const;

function StatusBadge({ status }: { status: keyof typeof STATUS_MAP }) {
  const { label, cls } = STATUS_MAP[status] ?? STATUS_MAP.pending;
  return (
    <span className={`font-mono text-[13px] uppercase tracking-widest px-2 py-0.5 border ${cls}`}>
      {label}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function AdminInstitutionsPage() {
  const { isAdmin } = useAuth();
  const [institutions, setInstitutions] = useState<(Institution & { id: string; createdAt: Date })[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [actioningId,  setActioningId]  = useState<string | null>(null);
  const [selected,     setSelected]     = useState<string | null>(null);

  // Filters
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "suspended">("all");
  const [showFilters,  setShowFilters]  = useState(false);

  // ── Load — sem orderBy, ordena em memória ─────────────────
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const snap = await getDocs(query(collection(db, "institutions")));
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data(), createdAt: toDate(d.data().createdAt) }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) as (Institution & { id: string; createdAt: Date })[];
      setInstitutions(data);
    } catch (err) {
      logger.error("AdminInstitutions: failed to load", err);
      setError("Não foi possível carregar as instituições.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filter ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return institutions.filter(i => {
      if (filterStatus !== "all" && i.status !== filterStatus) return false;
      if (q) return i.name.toLowerCase().includes(q) || (i.email?.toLowerCase().includes(q) ?? false);
      return true;
    });
  }, [institutions, search, filterStatus]);

  const hasFilters = filterStatus !== "all" || search.trim() !== "";
  const clearFilters = () => { setSearch(""); setFilterStatus("all"); };

  // ── Counts ────────────────────────────────────────────────
  const counts = useMemo(() => ({
    pending:   institutions.filter(i => i.status === "pending").length,
    approved:  institutions.filter(i => i.status === "approved").length,
    suspended: institutions.filter(i => i.status === "suspended").length,
  }), [institutions]);

  // ── Actions ───────────────────────────────────────────────
  const handleApprove = useCallback(async (inst: Institution & { id: string }) => {
    if (actioningId) return;
    setActioningId(inst.id);
    try {
      const res = await fetchWithAuth(`/api/institutions/${inst.id}/approve`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to approve");
      setInstitutions(prev => prev.map(i => i.id === inst.id ? { ...i, status: "approved" as const } : i));
      setSelected(null);
      toast.success(`"${inst.name}" aprovada.`);
    } catch (err) {
      logger.error("AdminInstitutions: approve failed", err, { id: inst.id });
      toast.error("Erro ao aprovar.");
    } finally {
      setActioningId(null);
    }
  }, [actioningId]);

  const handleSuspend = useCallback(async (inst: Institution & { id: string }) => {
    if (actioningId) return;
    toast.error(`Suspender "${inst.name}"?`, {
      description: "A instituição e os seus membros perderão acesso.",
      action: {
        label: "Suspender",
        onClick: async () => {
          setActioningId(inst.id);
          try {
            const res = await fetchWithAuth(`/api/institutions/${inst.id}/suspend`, { method: "POST" });
            if (!res.ok) throw new Error("Failed to suspend");
            setInstitutions(prev => prev.map(i => i.id === inst.id ? { ...i, status: "suspended" as const } : i));
            setSelected(null);
            toast.success(`"${inst.name}" suspensa.`);
          } catch (err) {
            logger.error("AdminInstitutions: suspend failed", err, { id: inst.id });
            toast.error("Erro ao suspender.");
          } finally {
            setActioningId(null);
          }
        },
      },
    });
  }, [actioningId]);

  const selectedInst = selected ? institutions.find(i => i.id === selected) : null;

  if (!isAdmin) return null;

  return (
    <div className="max-w-[80rem] mx-auto space-y-8 animate-in fade-in duration-300">

      {/* ── Cabeçalho ── */}
      <div>
        <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-purple/60 mb-2">
          // gestão de instituições
        </p>
        <h1 className="text-2xl font-bold text-gray-100">Instituições</h1>
        <p className="mt-1 text-sm text-gray-600">
          {loading ? "A carregar..." : `${filtered.length} de ${institutions.length} instituição${institutions.length !== 1 ? "ões" : ""}`}
        </p>
      </div>

      {/* ── KPIs ── */}
      {!loading && institutions.length > 0 && (
        <div className="grid grid-cols-3 gap-px bg-gray-800">
          {(["pending", "approved", "suspended"] as const).map(s => {
            const { label, cls, dot } = STATUS_MAP[s];
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
                className={`border border-gray-800 bg-gray-900 px-4 py-3 text-left transition-all ${filterStatus === s ? "ring-1 ring-inset ring-purple/20" : "hover:bg-gray-900"}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`h-1.5 w-1.5 shrink-0 ${dot}`} />
                  <span className={`font-mono text-[13px] uppercase tracking-widest ${cls.split(" ")[1]}`}>{label}</span>
                </div>
                <p className="text-xl font-bold text-gray-200 tabular-nums">{counts[s]}</p>
              </button>
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
              placeholder="Pesquisar por nome ou email..."
              className="w-full border border-gray-800 bg-gray-900 pl-9 pr-9 py-2.5 text-sm text-gray-200 placeholder-gray-700 focus:border-purple/30 focus:outline-none transition-colors"
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
                ? "border-purple/30 bg-purple/8 text-purple/70"
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
              className="border border-gray-800 bg-gray-900 text-sm text-gray-400 px-3 py-1.5 focus:outline-none focus:border-purple/30"
            >
              <option value="all">Todos os estados</option>
              <option value="pending">Pendentes</option>
              <option value="approved">Aprovadas</option>
              <option value="suspended">Suspensas</option>
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
        <div className="flex items-start gap-3 border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" strokeWidth={1.5} />
          <p className="text-sm text-amber-400/80">{error}</p>
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
            <Building2 className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
          </div>
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">
            {hasFilters ? "// sem resultados" : "// sem instituições"}
          </p>
          <p className="text-sm text-gray-600">
            {hasFilters ? "Nenhuma corresponde aos filtros." : "Ainda não há instituições registadas."}
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-4 font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:text-gray-400 transition-colors">
              ← Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* ── Tabela ── */}
      {!loading && filtered.length > 0 && (
        <div className="border border-gray-800">
          <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-gray-800 bg-gray-900">
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Instituição</p>
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Email</p>
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Estado</p>
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Registada</p>
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Acções</p>
          </div>

          <div className="divide-y divide-gray-800">
            {filtered.map(inst => (
              <div
                key={inst.id}
                className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 items-center px-5 py-4 hover:bg-gray-900 transition-colors"
              >
                {/* Nome */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-gray-800 bg-gray-900 font-semibold text-sm text-gray-400">
                    {inst.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-200 truncate">{inst.name}</p>
                    <p className="font-mono text-[13px] text-gray-700 truncate">{inst.id.slice(0, 12)}…</p>
                  </div>
                </div>

                {/* Email */}
                <div className="hidden lg:flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-gray-700 shrink-0" strokeWidth={1.5} />
                  <span className="font-mono text-sm text-gray-500 truncate">{inst.email}</span>
                </div>

                {/* Estado */}
                <div className="hidden lg:block">
                  <StatusBadge status={inst.status as keyof typeof STATUS_MAP} />
                </div>

                {/* Data */}
                <div className="hidden lg:flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-gray-700 shrink-0" strokeWidth={1.5} />
                  <span className="font-mono text-sm text-gray-600">
                    {inst.createdAt.toLocaleDateString("pt-PT")}
                  </span>
                </div>

                {/* Acções */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Mobile badge */}
                  <div className="lg:hidden">
                    <StatusBadge status={inst.status as keyof typeof STATUS_MAP} />
                  </div>

                  {inst.status === "pending" && (
                    <button
                      onClick={() => handleApprove(inst)}
                      disabled={actioningId === inst.id}
                      className="flex items-center gap-1 border border-green/25 bg-green/8 px-3 py-1.5 font-mono text-[13px] uppercase tracking-widest text-green/80 hover:bg-green/15 disabled:opacity-40 transition-all"
                    >
                      {actioningId === inst.id
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Check className="h-3 w-3" strokeWidth={1.5} />
                      }
                      Aprovar
                    </button>
                  )}
                  {inst.status === "approved" && (
                    <button
                      onClick={() => handleSuspend(inst)}
                      disabled={actioningId === inst.id}
                      className="flex items-center gap-1 border border-red-500/25 bg-red-500/8 px-3 py-1.5 font-mono text-[13px] uppercase tracking-widest text-red-400/80 hover:bg-red-500/15 disabled:opacity-40 transition-all"
                    >
                      {actioningId === inst.id
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <X className="h-3 w-3" strokeWidth={1.5} />
                      }
                      Suspender
                    </button>
                  )}

                  {/* Detalhes */}
                  <button
                    onClick={() => setSelected(inst.id === selected ? null : inst.id)}
                    title="Ver detalhes"
                    className="flex h-8 w-8 items-center justify-center border border-gray-800 bg-gray-900 text-gray-600 hover:border-purple/30 hover:text-purple/70 transition-all"
                  >
                    <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>

                  {/* Membros */}
                  <Link
                    href={`/admin/institutions/${inst.id}`}
                    title="Gerir membros"
                    className="flex h-8 w-8 items-center justify-center border border-gray-800 bg-gray-900 text-gray-600 hover:border-gray-700 hover:text-gray-300 transition-all"
                  >
                    <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-800 bg-gray-900">
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
              {hasFilters && ` (filtrado de ${institutions.length})`}
            </p>
          </div>
        </div>
      )}

      {/* ── Drawer de detalhes ── */}
      {selectedInst && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-sm bg-gray-950 border-l border-gray-800 p-6 overflow-y-auto animate-in slide-in-from-right duration-200">

            <div className="flex items-center justify-between mb-6">
              <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">// detalhes</p>
              <button onClick={() => setSelected(null)} className="p-1 text-gray-600 hover:text-gray-400 transition-colors">
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* Identidade */}
            <div className="flex flex-col items-center gap-3 mb-6 pb-6 border-b border-gray-800 text-center">
              <div className="flex h-14 w-14 items-center justify-center border border-gray-800 bg-gray-900 text-lg font-bold text-gray-300">
                {selectedInst.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-base font-bold text-gray-100">{selectedInst.name}</p>
                <StatusBadge status={selectedInst.status as keyof typeof STATUS_MAP} />
              </div>
            </div>

            {/* Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-3.5 w-3.5 text-gray-700 shrink-0" strokeWidth={1.5} />
                <span className="text-gray-400 truncate">{selectedInst.email}</span>
              </div>
              {selectedInst.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <ChevronRight className="h-3.5 w-3.5 text-gray-700 shrink-0" strokeWidth={1.5} />
                  <span className="text-gray-400">{selectedInst.phone}</span>
                </div>
              )}
              {selectedInst.address && (
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-3.5 w-3.5 text-gray-700 shrink-0" strokeWidth={1.5} />
                  <span className="text-gray-400">{selectedInst.address}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-3.5 w-3.5 text-gray-700 shrink-0" strokeWidth={1.5} />
                <span className="text-gray-500">
                  Registada a {(selectedInst as { createdAt: Date }).createdAt.toLocaleDateString("pt-PT")}
                </span>
              </div>
            </div>

            {/* Acções */}
            <div className="space-y-2">
              {selectedInst.status === "pending" && (
                <button
                  onClick={() => handleApprove(selectedInst as Institution & { id: string })}
                  disabled={actioningId === selectedInst.id}
                  className="w-full flex items-center justify-center gap-1.5 border border-green/30 bg-green/8 py-2.5 font-mono text-[13px] uppercase tracking-widest text-green/80 hover:bg-green/15 disabled:opacity-40 transition-all"
                >
                  {actioningId === selectedInst.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" strokeWidth={1.5} />}
                  Aprovar instituição
                </button>
              )}
              {selectedInst.status === "approved" && (
                <button
                  onClick={() => handleSuspend(selectedInst as Institution & { id: string })}
                  disabled={actioningId === selectedInst.id}
                  className="w-full flex items-center justify-center gap-1.5 border border-red-500/30 bg-red-500/8 py-2.5 font-mono text-[13px] uppercase tracking-widest text-red-400/80 hover:bg-red-500/15 disabled:opacity-40 transition-all"
                >
                  {actioningId === selectedInst.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" strokeWidth={1.5} />}
                  Suspender instituição
                </button>
              )}
              <Link
                href={`/admin/institutions/${selectedInst.id}`}
                className="w-full flex items-center justify-center gap-1.5 border border-gray-800 bg-gray-900 py-2.5 font-mono text-[13px] uppercase tracking-widest text-gray-500 hover:border-gray-700 hover:text-gray-300 transition-all"
              >
                <Users className="h-3 w-3" strokeWidth={1.5} />
                Gerir membros
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
