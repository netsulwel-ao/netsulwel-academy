"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection, getDocs, deleteDoc, doc, query, where, updateDoc, serverTimestamp,
} from "firebase/firestore";
import {
  Plus, Trash2, Pencil, Loader2, BookOpen, AlertTriangle,
  Layers, Radio, Search, X, Filter, Eye, EyeOff,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { Trail } from "@/types/course";

// ── Helpers ───────────────────────────────────────────────────
function toDate(raw: unknown): Date {
  if (!raw) return new Date(0);
  if (raw instanceof Date) return raw;
  if (typeof raw === "object" && raw !== null && "toDate" in raw)
    return (raw as { toDate: () => Date }).toDate();
  return new Date(0);
}

// ── Badges ────────────────────────────────────────────────────
function TypeBadge({ type }: { type?: string }) {
  const map: Record<string, string> = {
    standalone: "border-blue-500/25 text-blue-400/70",
    smart:      "border-green/25 text-green/70",
    golden:     "border-amber-500/25 text-amber-400/70",
  };
  const label: Record<string, string> = { standalone: "standalone", smart: "smart", golden: "golden" };
  const t = type ?? "standalone";
  return (
    <span className={`font-mono text-[13px] uppercase tracking-widest px-2 py-0.5 border ${map[t] ?? "border-gray-700 text-gray-600"}`}>
      {label[t] ?? t}
    </span>
  );
}

function StatusBadge({ status }: { status: "published" | "draft" }) {
  return (
    <span className={`font-mono text-[13px] uppercase tracking-widest px-2 py-0.5 border ${
      status === "published"
        ? "border-green/30 text-green/70 bg-green/8"
        : "border-amber-500/30 text-amber-400/70 bg-amber-500/8"
    }`}>
      {status === "published" ? "pub" : "draft"}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function TrailsPage() {
  const { isAdmin, isTeacher, user } = useAuth();
  const [trails,     setTrails]     = useState<Trail[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ── Filtros ────────────────────────────────────────────────
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");
  const [filterType,   setFilterType]   = useState<"all" | "standalone" | "smart" | "golden">("all");
  const [showFilters,  setShowFilters]  = useState(false);

  // ── Load ──────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError(null);
    try {
      // Sem orderBy composto — ordena em memória
      const q = isTeacher && !isAdmin
        ? query(collection(db, "trails"), where("createdBy", "==", user.uid))
        : query(collection(db, "trails"));
      const snap = await getDocs(q);
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Trail))
        .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
      setTrails(data);
    } catch (err) {
      logger.error("AdminTrails: failed to load", err);
      setError("Não foi possível carregar as trilhas.");
    } finally {
      setLoading(false);
    }
  }, [user?.uid, isTeacher, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // ── Filtrar ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return trails.filter(t => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterType   !== "all" && t.type   !== filterType)   return false;
      if (q) return t.title.toLowerCase().includes(q) || (t.description?.toLowerCase().includes(q) ?? false);
      return true;
    });
  }, [trails, search, filterStatus, filterType]);

  const hasFilters = filterStatus !== "all" || filterType !== "all" || search.trim() !== "";
  const clearFilters = () => { setSearch(""); setFilterStatus("all"); setFilterType("all"); };

  // ── Acções ─────────────────────────────────────────────────
  const handleDelete = useCallback((trail: Trail) => {
    toast.error(`Apagar "${trail.title}"?`, {
      description: "Os cursos associados não serão apagados.",
      action: {
        label: "Apagar",
        onClick: async () => {
          setDeletingId(trail.id!);
          try {
            await deleteDoc(doc(db, "trails", trail.id!));
            setTrails(prev => prev.filter(t => t.id !== trail.id));
            toast.success("Trilha apagada.");
          } catch (err) {
            logger.error("AdminTrails: delete failed", err, { trailId: trail.id });
            toast.error("Erro ao apagar a trilha.");
          } finally {
            setDeletingId(null);
          }
        },
      },
    });
  }, []);

  const handleToggleStatus = useCallback(async (trail: Trail) => {
    const next = trail.status === "published" ? "draft" : "published";
    setTogglingId(trail.id!);
    try {
      await updateDoc(doc(db, "trails", trail.id!), { status: next, updatedAt: serverTimestamp() });
      setTrails(prev => prev.map(t => t.id === trail.id ? { ...t, status: next } : t));
      toast.success(next === "published" ? `"${trail.title}" publicada.` : `"${trail.title}" movida para rascunho.`);
    } catch (err) {
      logger.error("AdminTrails: toggle status failed", err, { trailId: trail.id });
      toast.error("Erro ao alterar estado da trilha.");
    } finally {
      setTogglingId(null);
    }
  }, []);

  return (
    <div className="max-w-[80rem] mx-auto space-y-8 animate-in fade-in duration-300">

      {/* ── Cabeçalho ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-purple/60 mb-2">
            // gestão de trilhas
          </p>
          <h1 className="text-2xl font-bold text-gray-100">Trilhas</h1>
          <p className="mt-1 text-sm text-gray-600">
            {loading ? "A carregar..." : `${filtered.length} de ${trails.length} trilha${trails.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          href="/admin/trails/new"
          className="flex items-center gap-1.5 border border-purple/25 bg-purple/8 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-purple/70 hover:bg-purple/15 transition-all shrink-0"
        >
          <Plus className="h-3 w-3" /> Nova trilha
        </Link>
      </div>

      {/* ── Pesquisa + filtros ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-700" strokeWidth={1.5} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar trilhas..."
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
                : "border-gray-800 bg-gray-900 text-gray-600 hover:border-gray-700 hover:text-gray-400"
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
              className="border border-gray-800 bg-gray-900 text-sm text-gray-400 px-3 py-1.5 focus:outline-none focus:border-purple/30 transition-colors"
            >
              <option value="all">Todos os estados</option>
              <option value="published">Publicada</option>
              <option value="draft">Rascunho</option>
            </select>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as typeof filterType)}
              className="border border-gray-800 bg-gray-900 text-sm text-gray-400 px-3 py-1.5 focus:outline-none focus:border-purple/30 transition-colors"
            >
              <option value="all">Todos os tipos</option>
              <option value="standalone">Standalone</option>
              <option value="smart">Smart</option>
              <option value="golden">Golden</option>
            </select>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1"
              >
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

      {/* ── Empty state ── */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center border border-gray-800 bg-gray-900 py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
            <Layers className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
          </div>
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">
            {hasFilters ? "// sem resultados" : "// sem trilhas"}
          </p>
          <p className="text-sm text-gray-600 mb-5">
            {hasFilters ? "Nenhuma trilha corresponde aos filtros." : "Agrupa cursos em sequências de aprendizagem."}
          </p>
          {hasFilters ? (
            <button onClick={clearFilters} className="font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:text-gray-400 transition-colors">
              ← Limpar filtros
            </button>
          ) : (
            <Link
              href="/admin/trails/new"
              className="flex items-center gap-1.5 border border-purple/25 bg-purple/8 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-purple/70 hover:bg-purple/15 transition-all"
            >
              <Plus className="h-3 w-3" /> Criar trilha
            </Link>
          )}
        </div>
      )}

      {/* ── Tabela ── */}
      {!loading && filtered.length > 0 && (
        <div className="border border-gray-800">
          {/* Cabeçalho */}
          <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-gray-800 bg-gray-900">
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Trilha</p>
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Tipo</p>
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Conteúdo</p>
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Estado</p>
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">Acções</p>
          </div>

          <div className="divide-y divide-gray-800">
            {filtered.map(trail => (
              <div
                key={trail.id}
                className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 hover:bg-gray-900 transition-colors"
              >
                {/* Thumbnail + título */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-12 w-16 shrink-0 overflow-hidden border border-gray-800 bg-gray-900">
                    {trail.thumbnail
                      ? <img src={trail.thumbnail} alt={trail.title} className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center">
                          <Layers className="h-4 w-4 text-gray-800" strokeWidth={1} />
                        </div>
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-200 truncate">{trail.title}</p>
                    <p className="text-sm text-gray-600 truncate mt-0.5 line-clamp-1">
                      {trail.description || "Sem descrição"}
                    </p>
                  </div>
                </div>

                {/* Tipo */}
                <div className="hidden lg:block">
                  <TypeBadge type={trail.type} />
                </div>

                {/* Conteúdo */}
                <div className="hidden lg:flex items-center gap-3 font-mono text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" strokeWidth={1.5} />
                    {trail.coursesCount ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Radio className="h-3 w-3" strokeWidth={1.5} />
                    {trail.livesCount ?? 0}
                  </span>
                </div>

                {/* Estado */}
                <div className="hidden lg:flex items-center">
                  <StatusBadge status={trail.status} />
                </div>

                {/* Acções */}
                <div className="flex items-center gap-1.5 flex-wrap lg:flex-nowrap">
                  {/* Mobile badges */}
                  <div className="flex items-center gap-1.5 lg:hidden">
                    <StatusBadge status={trail.status} />
                    <TypeBadge type={trail.type} />
                  </div>

                  {/* Toggle pub/draft */}
                  <button
                    onClick={() => handleToggleStatus(trail)}
                    disabled={togglingId === trail.id}
                    title={trail.status === "published" ? "Mover para rascunho" : "Publicar"}
                    className="flex h-8 w-8 items-center justify-center border border-gray-800 bg-gray-900 text-gray-600 hover:border-gray-700 hover:text-gray-300 disabled:opacity-50 transition-all"
                  >
                    {togglingId === trail.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : trail.status === "published"
                        ? <EyeOff className="h-3.5 w-3.5" strokeWidth={1.5} />
                        : <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                    }
                  </button>

                  {/* Editar */}
                  <Link
                    href={`/admin/trails/${trail.id}/edit`}
                    title="Editar trilha"
                    className="flex h-8 w-8 items-center justify-center border border-gray-800 bg-gray-900 text-gray-600 hover:border-purple/30 hover:text-purple/70 transition-all"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </Link>

                  {/* Apagar */}
                  <button
                    onClick={() => handleDelete(trail)}
                    disabled={deletingId === trail.id}
                    title="Apagar trilha"
                    className="flex h-8 w-8 items-center justify-center border border-red-500/15 bg-red-500/5 text-red-400/50 hover:border-red-500/30 hover:text-red-400/80 disabled:opacity-40 transition-all"
                  >
                    {deletingId === trail.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-3 border-t border-gray-800 bg-gray-900">
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
              {hasFilters && ` (filtrado de ${trails.length})`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
