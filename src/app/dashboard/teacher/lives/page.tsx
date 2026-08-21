"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  Plus, Loader2, Calendar, Clock, Edit,
  Radio, CheckCircle2, XCircle, Play,
  AlertTriangle, MailQuestion, Trash2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { deleteDoc, doc } from "firebase/firestore";
import type { LiveSession } from "@/types/live";

interface FreeRequest {
  id: string;
  title: string;
  description?: string;
  scheduledAt?: string;
  status: "pending" | "approved" | "rejected";
}

function toDate(d: unknown): Date | null {
  if (!d) return null;
  if (typeof d === "object" && "toDate" in (d as object))
    return (d as { toDate: () => Date }).toDate();
  return new Date(d as string);
}

function fmtDateTime(d: unknown): string {
  const dt = toDate(d);
  if (!dt) return "—";
  return dt.toLocaleDateString("pt-PT", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function TeacherLivesPage() {
  const { user, isTeacher } = useAuth();
  const [lives, setLives] = useState<LiveSession[]>([]);
  const [requests, setRequests] = useState<FreeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (liveId: string, title: string) => {
    // Toast de confirmação com acção de desfazer
    toast(`Eliminar "${title}"?`, {
      description: "Esta acção é permanente e não pode ser desfeita.",
      action: {
        label: "Eliminar",
        onClick: async () => {
          setDeletingId(liveId);
          try {
            await deleteDoc(doc(db, "lives", liveId));
            setLives(prev => prev.filter(l => l.id !== liveId));
            toast.success("Aula eliminada com sucesso.");
          } catch (err) {
            logger.error("TeacherLives: failed to delete", err, { liveId });
            toast.error("Erro ao eliminar. Tenta novamente.");
          } finally {
            setDeletingId(null);
          }
        },
      },
      cancel: {
        label: "Cancelar",
        onClick: () => {},
      },
      duration: 8000,
    });
  };

  const load = useCallback(async () => {
    if (!user || !isTeacher) return;
    setError(null);
    try {
      const [liveSnap, reqSnap] = await Promise.all([
        // Sem orderBy — ordenação em memória para evitar índice composto
        getDocs(query(collection(db, "lives"), where("createdBy", "==", user.uid))),
        getDocs(query(collection(db, "freeLiveRequests"), where("teacherId", "==", user.uid))),
      ]);

      const liveList = liveSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as LiveSession))
        .sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0));

      const reqList = reqSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as FreeRequest))
        .sort((a, b) => (b.scheduledAt ?? "").localeCompare(a.scheduledAt ?? ""));

      setLives(liveList);
      setRequests(reqList);
    } catch (err) {
      logger.error("TeacherLives: failed to load", err);
      setError("Não foi possível carregar as aulas ao vivo.");
    } finally {
      setLoading(false);
    }
  }, [user?.uid, isTeacher]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  if (!isTeacher) return null;

  const now = new Date();
  const active   = lives.filter(l => l.status === "live");
  const upcoming = lives.filter(l => l.status === "scheduled" && toDate(l.scheduledAt)! > now);
  const past     = lives.filter(l => l.status === "ended" || (l.scheduledAt && toDate(l.scheduledAt)! <= now && l.status !== "live"));

  return (
    <div className="max-w-[80rem] mx-auto space-y-8 animate-in fade-in duration-300">

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-green/60 mb-2">
            // aulas ao vivo
          </p>
          <h1 className="text-2xl font-bold text-gray-100">Aulas ao Vivo</h1>
          <p className="mt-1 text-sm text-gray-600">
            {loading ? "A carregar..." : `${lives.length} aula${lives.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          href="/dashboard/teacher/lives/new"
          className="flex items-center gap-2 bg-green px-5 py-2.5 text-sm font-bold text-gray-950 hover:bg-green-light transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" /> Nova aula
        </Link>
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-start gap-3 border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" strokeWidth={1.5} />
          <p className="text-sm text-amber-400/80">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
        </div>
      )}

      {/* Empty state */}
      {!loading && lives.length === 0 && requests.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center border border-gray-800 bg-gray-900 py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
            <Radio className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
          </div>
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">
            // sem aulas
          </p>
          <p className="text-sm text-gray-600 mb-5">Ainda não agendaste nenhuma aula ao vivo.</p>
          <Link
            href="/dashboard/teacher/lives/new"
            className="flex items-center gap-1.5 border border-green/25 bg-green/8 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-green/70 hover:bg-green/15 transition-all"
          >
            <Plus className="h-3 w-3" /> Agendar primeira aula
          </Link>
        </div>
      )}

      {!loading && (lives.length > 0 || requests.length > 0) && (
        <div className="space-y-8">

          {/* ── Ao Vivo Agora ── */}
          {active.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                <p className="font-mono text-[13px] uppercase tracking-widest text-red-400/70">ao vivo agora</p>
              </div>
              <div className="border border-red-500/20 divide-y divide-gray-800">
                {active.map(l => (
                  <div key={l.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 bg-red-500/5">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-100">{l.title}</h3>
                      {l.description && <p className="text-sm text-gray-600 mt-0.5 truncate">{l.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/dashboard/teacher/lives/${l.id}/studio`}
                        className="flex items-center gap-2 bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500 transition-colors">
                        <Play className="h-4 w-4" strokeWidth={1.5} /> Ir para estúdio
                      </Link>
                      <button type="button" onClick={() => handleDelete(l.id!, l.title)} disabled={deletingId === l.id}
                        className="flex h-8 w-8 items-center justify-center border border-red-500/20 bg-red-500/8 text-red-400/70 hover:bg-red-500/15 disabled:opacity-50 transition-all">
                        {deletingId === l.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Agendadas ── */}
          {upcoming.length > 0 && (
            <section>
              <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-3">// agendadas · {upcoming.length}</p>
              <div className="border border-gray-800 divide-y divide-gray-800">
                {upcoming.map(l => (
                  <div key={l.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 hover:bg-gray-900 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-200">{l.title}</h3>
                      <div className="mt-0.5 flex items-center gap-1 font-mono text-[13px] text-gray-700">
                        <Calendar className="h-3 w-3" strokeWidth={1.5} />
                        {fmtDateTime(l.scheduledAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/dashboard/teacher/lives/${l.id}/studio`}
                        className="flex items-center gap-1.5 bg-green px-3 py-2 text-sm font-bold text-gray-950 hover:bg-green-light transition-colors">
                        <Play className="h-3.5 w-3.5" strokeWidth={1.5} /> Iniciar
                      </Link>
                      <Link href={`/dashboard/teacher/lives/${l.id}/edit`}
                        className="flex h-8 w-8 items-center justify-center border border-gray-800 bg-gray-900 text-gray-600 hover:border-gray-700 hover:text-gray-400 transition-all">
                        <Edit className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </Link>
                      <button type="button" onClick={() => handleDelete(l.id!, l.title)} disabled={deletingId === l.id}
                        className="flex h-8 w-8 items-center justify-center border border-red-500/20 bg-red-500/8 text-red-400/70 hover:bg-red-500/15 disabled:opacity-50 transition-all">
                        {deletingId === l.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Realizadas ── */}
          {past.length > 0 && (
            <section>
              <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-3">// realizadas · {past.length}</p>
              <div className="border border-gray-800 divide-y divide-gray-800">
                {past.map(l => (
                  <div key={l.id} className="flex items-center justify-between gap-4 px-5 py-3.5 opacity-60 hover:opacity-80 transition-opacity">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-400 truncate">{l.title}</p>
                      <p className="font-mono text-[13px] text-gray-700">{fmtDateTime(l.scheduledAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[13px] uppercase tracking-widest text-gray-700">concluída</span>
                      <button type="button" onClick={() => handleDelete(l.id!, l.title)} disabled={deletingId === l.id}
                        className="flex h-7 w-7 items-center justify-center border border-red-500/20 bg-red-500/8 text-red-400/60 hover:bg-red-500/15 disabled:opacity-50 transition-all">
                        {deletingId === l.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" strokeWidth={1.5} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Pedidos de lives gratuitas ── */}
          {requests.length > 0 && (
            <section>
              <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-3">// pedidos de lives gratuitas · {requests.length}</p>
              <div className="border border-gray-800 divide-y divide-gray-800">
                {requests.map(r => (
                  <div key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-300 truncate">{r.title}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        {r.scheduledAt && (
                          <p className="font-mono text-[13px] text-gray-700 flex items-center gap-1">
                            <Calendar className="h-2.5 w-2.5" strokeWidth={1.5} />
                            {new Date(r.scheduledAt).toLocaleDateString("pt-PT")}
                          </p>
                        )}
                        {r.status === "approved" && (
                          <p className="font-mono text-[13px] text-green/60">
                            ✓ Live criada — aparece na lista acima
                          </p>
                        )}
                        {r.status === "rejected" && (
                          <p className="font-mono text-[13px] text-red-400/60">
                            Contacta o administrador para mais informações
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`shrink-0 flex items-center gap-1.5 font-mono text-[13px] uppercase tracking-widest border px-2.5 py-1 ${
                      r.status === "approved"
                        ? "border-green/25 bg-green/8 text-green/70"
                        : r.status === "rejected"
                        ? "border-red-500/25 bg-red-500/8 text-red-400/70"
                        : "border-amber-500/25 bg-amber-500/8 text-amber-400/70"
                    }`}>
                      {r.status === "approved"  && <><CheckCircle2 className="h-2.5 w-2.5" /> aprovado</>}
                      {r.status === "rejected"  && <><XCircle className="h-2.5 w-2.5" /> rejeitado</>}
                      {r.status === "pending"   && <><MailQuestion className="h-2.5 w-2.5" /> pendente</>}
                    </span>
                  </div>
                ))}
              </div>

              {/* Nota informativa */}
              <div className="mt-3 border border-gray-800 bg-gray-900 px-4 py-3">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Os pedidos de <strong className="text-gray-500">live gratuita</strong> precisam de aprovação do administrador.
                  Quando aprovados, a aula aparece automaticamente na lista acima e podes iniciá-la normalmente.
                </p>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
