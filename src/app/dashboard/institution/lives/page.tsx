"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Radio, Loader2, Plus, Calendar, Eye, Users, Search, X, Trash2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { logger } from "@/lib/logger";

interface Live {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  scheduledAt: string;
  status: string;
  target: string;
  price?: number;
  hostName?: string;
  hostUid?: string;
  participantCount?: number;
  views?: number;
}

interface Member {
  userId: string;
  name: string;
  email: string;
}

function toDate(raw: unknown): Date {
  if (!raw) return new Date(0);
  if (raw instanceof Date) return raw;
  if (typeof raw === "object" && raw !== null && "toDate" in raw)
    return (raw as { toDate: () => Date }).toDate();
  return new Date(0);
}

const STATUS_MAP: Record<string, { cls: string; label: string }> = {
  scheduled: { cls: "border-blue-500 text-blue-400", label: "Agendada" },
  live:      { cls: "border-green text-green",       label: "Ao vivo"  },
  ended:     { cls: "border-gray-600 text-gray-500", label: "Encerrada" },
};

const inputCls =
  "w-full border border-gray-800 bg-gray-900 py-2.5 px-3 text-sm text-gray-200 focus:border-purple focus:outline-none transition-colors";

export default function InstitutionLivesPage() {
  const { institutionId } = useAuth();
  const router = useRouter();
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [target, setTarget] = useState<"free" | "standalone">("standalone");
  const [price, setPrice] = useState("");
  const [selectedHost, setSelectedHost] = useState<Member | null>(null);
  const [hostSearch, setHostSearch] = useState("");
  const [hostResults, setHostResults] = useState<Member[]>([]);
  const [hostLoading, setHostLoading] = useState(false);
  const [showHostDropdown, setShowHostDropdown] = useState(false);

  const loadLives = useCallback(async () => {
    if (!institutionId) return;
    try {
      const res = await fetchWithAuth(`/api/institutions/${institutionId}/lives`);
      if (!res.ok) throw new Error("Falha");
      const data = await res.json();
      setLives(data.lives || []);
    } catch (err) {
      logger.error("InstitutionLives: failed to load", err, { institutionId });
      toast.error("Erro ao carregar lives.");
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => { loadLives(); }, [loadLives]);

  const filtered = lives.filter(l => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return l.title.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q);
  });

  // ── Host search ──
  useEffect(() => {
    if (!institutionId || !showCreate) return;
    const timer = setTimeout(async () => {
      if (hostSearch.length < 2) { setHostResults([]); return; }
      setHostLoading(true);
      try {
        const res = await fetchWithAuth(`/api/institutions/${institutionId}/search-professors?q=${encodeURIComponent(hostSearch)}`);
        if (!res.ok) throw new Error("Falha");
        const data = await res.json();
        setHostResults((data.professors || []).map((p: { uid: string; name: string; email: string }) => ({
          userId: p.uid, name: p.name, email: p.email,
        })));
      } catch {
        toast.error("Erro ao pesquisar professores.");
      } finally {
        setHostLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [hostSearch, institutionId, showCreate]);

  const handleCreate = async () => {
    if (!institutionId || creating) return;
    if (!title.trim() || !scheduledAt) {
      toast.error("Título e data são obrigatórios.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetchWithAuth(`/api/institutions/${institutionId}/lives`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          scheduledAt,
          target,
          price: target === "standalone" ? price : undefined,
          hostUid: selectedHost?.userId,
          hostName: selectedHost?.name,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Falha");
      }
      toast.success("Live criada com sucesso!");
      setShowCreate(false);
      setTitle(""); setDescription(""); setScheduledAt(""); setTarget("standalone"); setPrice(""); setSelectedHost(null);
      loadLives();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar live.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="h-8 w-40 bg-gray-800 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-gray-800 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[80rem] mx-auto space-y-8 animate-in fade-in duration-300">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-purple mb-2">// lives</p>
          <h1 className="text-2xl font-bold text-gray-100">Lives</h1>
          <p className="mt-1 text-sm text-gray-600">
            {lives.length} live{lives.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 border border-green bg-green/8 px-4 py-2.5 font-mono text-[13px] uppercase tracking-widest text-green hover:bg-green/15 transition-all"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Criar Live
        </button>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-700" strokeWidth={1.5} />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Pesquisar lives..."
          className="w-full border border-gray-800 bg-gray-900 pl-9 pr-9 py-2.5 text-sm text-gray-200 focus:border-purple focus:outline-none transition-colors"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-3 w-3 text-gray-700 hover:text-gray-500 transition-colors" />
          </button>
        )}
      </div>

      {/* ── Empty ── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center border border-gray-800 bg-gray-900 py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
            <Radio className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
          </div>
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">
            {search ? "// sem resultados" : "// sem lives"}
          </p>
          <p className="text-sm text-gray-600 mb-5">
            {search ? "Nenhuma live corresponde à pesquisa." : "Cria a tua primeira live para começar."}
          </p>
          {!search && (
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 border border-purple bg-purple/8 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-purple hover:bg-purple/15 transition-all">
              Criar Live <Plus className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* ── Lives Grid ── */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(live => {
            const st = STATUS_MAP[live.status] || STATUS_MAP.ended;
            return (
              <Link
                key={live.id}
                href={`/dashboard/lives/${live.id}`}
                className="group border border-gray-800 bg-gray-900 overflow-hidden hover:border-purple hover:bg-gray-900 transition-all"
              >
                <div className="relative h-40 bg-gray-900 overflow-hidden">
                  {live.thumbnail ? (
                    <img src={live.thumbnail} alt={live.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Radio className="h-10 w-10 text-gray-800" strokeWidth={1} />
                    </div>
                  )}
                  <span className={`absolute top-3 left-3 font-mono text-[13px] uppercase tracking-widest px-2 py-0.5 border bg-gray-950 ${st.cls}`}>
                    {st.label}
                  </span>
                </div>

                <div className="p-4">
                  <p className="text-sm font-semibold text-gray-200 truncate group-hover:text-white transition-colors">
                    {live.title}
                  </p>
                  {live.hostName && (
                    <p className="text-xs text-green mt-1">Host: {live.hostName}</p>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-4">
                    <span className="flex items-center gap-1 font-mono text-[13px] text-gray-700">
                      <Calendar className="h-3 w-3" strokeWidth={1.5} />
                      {live.scheduledAt ? new Date(live.scheduledAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[13px] text-gray-700">
                      <Eye className="h-3 w-3" strokeWidth={1.5} /> {live.views || 0}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[13px] text-gray-700">
                      <Users className="h-3 w-3" strokeWidth={1.5} /> {live.participantCount || 0}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Create Live Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-gray-900 border border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-lg font-bold text-gray-100">Criar Live</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-700 hover:text-gray-400 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Title */}
              <div>
                <label className="block font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-1.5">Título</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Aula ao vivo de React" className={inputCls} />
              </div>

              {/* Description */}
              <div>
                <label className="block font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-1.5">Descrição</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Descreve o conteúdo da live..." className={inputCls} />
              </div>

              {/* Scheduled At */}
              <div>
                <label className="block font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-1.5">Data e hora</label>
                <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className={inputCls} />
              </div>

              {/* Target */}
              <div>
                <label className="block font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-1.5">Tipo</label>
                <div className="flex gap-2">
                  {(["standalone", "free"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setTarget(t)}
                      className={`flex-1 py-2.5 font-mono text-[13px] uppercase tracking-widest border transition-all ${
                        target === t ? "border-purple bg-purple/10 text-purple" : "border-gray-800 text-gray-600 hover:border-gray-700"
                      }`}
                    >
                      {t === "standalone" ? "Paga" : "Grátis"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              {target === "standalone" && (
                <div>
                  <label className="block font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-1.5">Preço (Kz)</label>
                  <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" className={inputCls} />
                </div>
              )}

              {/* Host search */}
              <div className="relative">
                <label className="block font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-1.5">Professor anfitrião</label>
                {selectedHost ? (
                  <div className="flex items-center justify-between border border-green bg-green/5 px-3 py-2.5">
                    <div>
                      <p className="text-sm text-gray-200">{selectedHost.name}</p>
                      <p className="font-mono text-xs text-gray-600">{selectedHost.email}</p>
                    </div>
                    <button onClick={() => setSelectedHost(null)} className="text-gray-700 hover:text-red-400 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-700" strokeWidth={1.5} />
                      <input
                        type="text" value={hostSearch}
                        onChange={e => { setHostSearch(e.target.value); setShowHostDropdown(true); }}
                        onFocus={() => setShowHostDropdown(true)}
                        placeholder="Pesquisar professor..."
                        className="w-full border border-gray-800 bg-gray-900 pl-9 pr-3 py-2.5 text-sm text-gray-200 focus:border-purple focus:outline-none transition-colors"
                      />
                    </div>
                    {showHostDropdown && hostSearch.length >= 2 && (
                      <div className="absolute z-20 mt-1 w-full bg-gray-900 border border-gray-800 shadow-xl max-h-48 overflow-y-auto">
                        {hostLoading && <div className="py-3 text-center"><Loader2 className="h-4 w-4 animate-spin text-purple mx-auto" /></div>}
                        {!hostLoading && hostResults.length === 0 && (
                          <div className="py-3 text-center text-sm text-gray-600">Nenhum professor encontrado</div>
                        )}
                        {!hostLoading && hostResults.map(m => (
                          <button
                            key={m.userId}
                            onClick={() => { setSelectedHost(m); setShowHostDropdown(false); setHostSearch(""); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-900/50 transition-colors flex items-center gap-3"
                          >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-gray-800 bg-gray-950 text-xs font-semibold text-gray-500">
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm text-gray-200 truncate">{m.name}</p>
                              <p className="font-mono text-xs text-gray-600 truncate">{m.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-800 flex items-center justify-between sticky bottom-0 bg-gray-900">
              <button onClick={() => setShowCreate(false)} className="font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:text-gray-400 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !title.trim() || !scheduledAt}
                className="flex items-center gap-2 border border-green bg-green/8 px-5 py-2.5 font-mono text-[13px] uppercase tracking-widest text-green hover:bg-green/15 disabled:opacity-40 transition-all"
              >
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radio className="h-3.5 w-3.5" />}
                {creating ? "A criar..." : "Criar Live"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
