"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { Calendar, Loader2, ChevronDown, ChevronRight, Plus, Trash2, ImagePlus, Save, AlertCircle, CheckCircle2, X, Layers, Radio, Crown, Zap, Coins } from "lucide-react";
import type { Trail, TrailLiveSession } from "@/types/course";

const TARGET_OPTIONS: { value: TrailLiveSession["target"]; label: string; icon: typeof Crown; color: string }[] = [
  { value: "free", label: "Grátis", icon: Radio, color: "text-green-400 bg-green-500/10 border-green-500/20" },
  { value: "smart", label: "Smart", icon: Zap, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { value: "golden", label: "Golden", icon: Crown, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  { value: "standalone", label: "Standalone", icon: Coins, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
];

async function uploadToR2(file: File, folder: string): Promise<string> {
  const res = await fetch("/api/upload/presign", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type, folder }),
  });
  if (!res.ok) throw new Error("Falha ao obter URL.");
  const { presignedUrl, publicUrl } = await res.json();
  const up = await fetch(presignedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!up.ok) throw new Error("Falha ao enviar.");
  return publicUrl;
}

function toDatetimeLocal(iso: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ""; }
}

function emptySession(): TrailLiveSession {
  return { title: "", description: "", thumbnail: "", scheduledAt: "", target: "free", price: 0 };
}

export default function SchedulesPage() {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Record<string, TrailLiveSession[]>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const thumbRefs = useRef<Map<string, Map<number, HTMLInputElement>>>(new Map());

  useEffect(() => {
    const fetchTrails = async () => {
      try {
        const q = query(collection(db, "trails"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trail));
        setTrails(all);
        const initial: Record<string, TrailLiveSession[]> = {};
        all.forEach((t) => { initial[t.id!] = (t.liveSessions || []).map((s) => ({ ...s })); });
        setEditing(initial);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrails();
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const addSession = (trailId: string) => {
    setEditing((prev) => ({
      ...prev,
      [trailId]: [...(prev[trailId] || []), emptySession()],
    }));
  };

  const updateSession = (trailId: string, idx: number, field: keyof TrailLiveSession, value: string | number) => {
    setEditing((prev) => ({
      ...prev,
      [trailId]: (prev[trailId] || []).map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    }));
  };

  const removeSession = (trailId: string, idx: number) => {
    setEditing((prev) => ({
      ...prev,
      [trailId]: (prev[trailId] || []).filter((_, i) => i !== idx),
    }));
  };

  const moveSession = (trailId: string, idx: number, dir: -1 | 1) => {
    const arr = [...(editing[trailId] || [])];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setEditing((prev) => ({ ...prev, [trailId]: arr }));
  };

  const handleThumbnail = async (trailId: string, idx: number, file: File) => {
    updateSession(trailId, idx, "thumbnail", "");
    try {
      const url = await uploadToR2(file, "thumbnails");
      updateSession(trailId, idx, "thumbnail", url);
    } catch {
      setError("Erro ao fazer upload da capa.");
    }
  };

  const handleSave = async (trailId: string) => {
    setSaving((prev) => ({ ...prev, [trailId]: true }));
    setError("");
    try {
      const liveSessions = editing[trailId] || [];
      const trail = trails.find((t) => t.id === trailId);
      await updateDoc(doc(db, "trails", trailId), {
        liveSessions,
        livesCount: (trail?.liveIds?.length || 0) + liveSessions.length,
        updatedAt: serverTimestamp(),
      });
      setTrails((prev) =>
        prev.map((t) => (t.id === trailId ? { ...t, liveSessions, livesCount: (t.liveIds?.length || 0) + liveSessions.length } : t))
      );
      setSuccess(`Cronograma "${trail?.title}" guardado.`);
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erro ao guardar cronograma.");
    } finally {
      setSaving((prev) => ({ ...prev, [trailId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Calendar className="h-8 w-8 text-orange-400" />
            Cronograma — Aulas ao Vivo
          </h1>
          <p className="mt-1 text-gray-400">Cria o cronograma de aulas ao vivo para cada trilha, como se fossem módulos de um curso</p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />{success}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
          <button onClick={() => setError("")} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      {trails.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 bg-gray-900/40 text-center">
          <Calendar className="h-12 w-12 text-gray-700 mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Nenhuma trilha encontrada</h2>
          <p className="text-gray-400">Cria trilhas primeiro para definires o cronograma de aulas ao vivo.</p>
        </div>
      )}

      <div className="space-y-6">
        {trails.map((trail) => {
          const isOpen = expanded.has(trail.id!);
          const sessions = editing[trail.id!] || [];
          const hasChanges = JSON.stringify(sessions) !== JSON.stringify(trail.liveSessions || []);

          return (
            <div key={trail.id} className="bg-gray-900/40 border border-gray-800 overflow-hidden">
              {/* Header — nome do cronograma (título da trilha) */}
              <button onClick={() => toggleExpand(trail.id!)}
                className="w-full flex items-center gap-4 px-6 py-5 hover:bg-gray-800/40 transition-colors text-left">
                <div className={`p-1.5 border transition-colors ${isOpen ? "border-orange-500/50 bg-orange-500/10" : "border-gray-700"}`}>
                  {isOpen ? <ChevronDown className="h-5 w-5 text-orange-400" /> : <ChevronRight className="h-5 w-5 text-gray-500" />}
                </div>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-9 bg-gray-800 overflow-hidden shrink-0">
                    {trail.thumbnail ? (
                      <img src={trail.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-900/30 to-gray-800">
                        <Calendar className="h-5 w-5 text-orange-600/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-white truncate">{trail.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                      <span>{sessions.length} aula{sessions.length !== 1 ? "s" : ""} no cronograma</span>
                      {sessions.filter((s) => s.target === "standalone").length > 0 && (
                        <span className="text-purple-400">· {sessions.filter((s) => s.target === "standalone").length} paga{sessions.filter((s) => s.target === "standalone").length !== 1 ? "s" : ""}</span>
                      )}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 shrink-0 ${
                    trail.status === "published"
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}>
                    {trail.status === "published" ? "Publicada" : "Rascunho"}
                  </span>
                </div>
              </button>

              {/* Expanded — criação de aulas como num curso */}
              {isOpen && (
                <div className="border-t border-gray-800">
                  {/* Lista de aulas */}
                  <div className="px-6 py-5 space-y-4">
                    {sessions.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Radio className="h-10 w-10 text-gray-700 mb-3" />
                        <p className="text-sm text-gray-500">Nenhuma aula no cronograma</p>
                        <p className="text-xs text-gray-600 mt-1">Adiciona a primeira aula ao vivo abaixo</p>
                      </div>
                    )}

                    {sessions.map((sess, idx) => (
                      <div key={idx}
                        className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors overflow-hidden">
                        {/* Cabeçalho da aula */}
                        <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-950/50 border-b border-gray-800">
                          <div className="flex items-center gap-1">
                            <button onClick={() => moveSession(trail.id!, idx, -1)} disabled={idx === 0}
                              className="p-0.5 text-gray-600 hover:text-white disabled:opacity-20 transition-colors"><span className="text-xs leading-none">▲</span></button>
                            <span className="text-xs font-bold text-orange-400 min-w-[1.2rem] text-center">{idx + 1}</span>
                            <button onClick={() => moveSession(trail.id!, idx, 1)} disabled={idx === sessions.length - 1}
                              className="p-0.5 text-gray-600 hover:text-white disabled:opacity-20 transition-colors"><span className="text-xs leading-none">▼</span></button>
                          </div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Aula {idx + 1}</span>
                          <div className="flex-1" />
                          <button onClick={() => removeSession(trail.id!, idx)}
                            className="p-1 text-gray-600 hover:text-red-400 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Corpo da aula */}
                        <div className="p-4 space-y-4">
                          {/* Linha 1: Thumbnail + Título + Data */}
                          <div className="flex gap-4">
                            <div className="w-28 shrink-0">
                              <div onClick={() => { thumbRefs.current.get(trail.id!)?.get(idx)?.click(); }}
                                className="relative aspect-video bg-gray-800 border border-dashed border-gray-700 hover:border-orange-500/50 cursor-pointer overflow-hidden group transition-colors">
                                {sess.thumbnail ? (
                                  <img src={sess.thumbnail} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="flex flex-col items-center justify-center h-full gap-1 text-gray-500 group-hover:text-orange-400">
                                    <ImagePlus className="h-6 w-6" />
                                    <span className="text-[10px] font-medium">Capa</span>
                                  </div>
                                )}
                              </div>
                              <input ref={(el) => {
                                if (!thumbRefs.current.has(trail.id!)) thumbRefs.current.set(trail.id!, new Map());
                                if (el) thumbRefs.current.get(trail.id!)!.set(idx, el);
                              }}
                                type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleThumbnail(trail.id!, idx, f); }} />
                            </div>

                            <div className="flex-1 space-y-2">
                              <input type="text" value={sess.title}
                                onChange={(e) => updateSession(trail.id!, idx, "title", e.target.value)}
                                placeholder="Título da aula ao vivo"
                                className="w-full bg-gray-800 border border-gray-700 focus:border-orange-500/50 py-2 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all" />
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                                  <input type="datetime-local" value={toDatetimeLocal(sess.scheduledAt)}
                                    onChange={(e) => updateSession(trail.id!, idx, "scheduledAt", e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 focus:border-orange-500/50 py-2 pl-10 pr-3 text-white text-sm focus:outline-none transition-all" />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Descrição */}
                          <textarea rows={2} value={sess.description}
                            onChange={(e) => updateSession(trail.id!, idx, "description", e.target.value)}
                            placeholder="Descrição da aula (opcional)"
                            className="w-full bg-gray-800 border border-gray-700 focus:border-orange-500/50 py-2 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all resize-none" />

                          {/* Plano / Preço */}
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Plano de Acesso</label>
                            <div className="flex flex-wrap gap-2">
                              {TARGET_OPTIONS.map((opt) => {
                                const Icon = opt.icon;
                                const selected = sess.target === opt.value;
                                return (
                                  <button key={opt.value} type="button"
                                    onClick={() => updateSession(trail.id!, idx, "target", opt.value)}
                                    className={`flex items-center gap-1.5 px-3 py-2 border text-xs font-bold transition-all ${
                                      selected
                                        ? opt.color
                                        : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                                    }`}>
                                    <Icon className={`h-3.5 w-3.5 ${selected ? "" : "text-gray-500"}`} />
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                            {sess.target === "standalone" && (
                              <div className="mt-2 flex items-center gap-2">
                                <Coins className="h-4 w-4 text-purple-400" />
                                <input type="number" min={0} step={100} value={sess.price || ""}
                                  onChange={(e) => updateSession(trail.id!, idx, "price", Number(e.target.value) || 0)}
                                  placeholder="Preço (Kz)"
                                  className="w-40 bg-gray-800 border border-gray-700 focus:border-purple-500/50 py-1.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all" />
                                <span className="text-xs text-gray-500">Kz</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-3 px-6 pb-5">
                    <button onClick={() => addSession(trail.id!)}
                      className="flex items-center gap-2 border-2 border-dashed border-gray-700 hover:border-orange-500/50 py-3 px-5 text-sm font-medium text-gray-400 hover:text-orange-400 transition-colors">
                      <Plus className="h-4 w-4" /> Adicionar Aula ao Vivo
                    </button>
                    <div className="flex-1" />
                    {hasChanges && (
                      <button onClick={() => handleSave(trail.id!)} disabled={saving[trail.id!]}
                        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 text-sm font-bold transition-colors shadow-lg shadow-orange-500/20 disabled:opacity-50">
                        {saving[trail.id!] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Guardar Cronograma
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
