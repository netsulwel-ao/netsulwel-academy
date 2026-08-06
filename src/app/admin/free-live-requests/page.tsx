"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, deleteDoc, addDoc, getDoc, serverTimestamp,
} from "firebase/firestore";
import {
  Loader2, CheckCircle2, XCircle, MailQuestion,
  Trash2, AlertTriangle, Clock, Calendar, User,
} from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { LiveTarget } from "@/types/live";

// ── Type ──────────────────────────────────────────────────────
interface FreeLiveRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description?: string;
  scheduledAt?: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: unknown;
}

// ── Helpers ───────────────────────────────────────────────────
function toDate(raw: unknown): Date {
  if (!raw) return new Date(0);
  if (raw instanceof Date) return raw;
  if (typeof raw === "object" && raw !== null && "toDate" in raw)
    return (raw as { toDate: () => Date }).toDate();
  return new Date(0);
}

/** Returns formatted date string, or null if raw is falsy / epoch */
function fmtRaw(raw: unknown): string | null {
  if (!raw) return null;
  const d = toDate(raw);
  if (d.getTime() === 0) return null;
  return d.toLocaleDateString("pt-PT");
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function generateRoomName(title: string) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
  return `${slug}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Status badge ──────────────────────────────────────────────
function StatusBadge({ status }: { status: FreeLiveRequest["status"] }) {
  const map = {
    pending:  "border-amber-500/30 text-amber-400/80 bg-amber-500/8",
    approved: "border-green/30 text-green/80 bg-green/8",
    rejected: "border-red-500/30 text-red-400/80 bg-red-500/8",
  };
  const labels = { pending: "pendente", approved: "aprovado", rejected: "rejeitado" };
  return (
    <span className={`font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 border ${map[status]}`}>
      {labels[status]}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function FreeLiveRequestsPage() {
  const [requests,    setRequests]    = useState<FreeLiveRequest[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // ── Real-time listener — sem orderBy composto, ordena em memória ──
  useEffect(() => {
    // Sem orderBy — evita índice composto. Ordena em memória por createdAt desc.
    const unsub = onSnapshot(
      query(collection(db, "freeLiveRequests")),
      snap => {
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as FreeLiveRequest))
          .sort((a, b) => {
            const ta = toDate(a.createdAt)?.getTime() ?? 0;
            const tb = toDate(b.createdAt)?.getTime() ?? 0;
            return tb - ta;
          });
        setRequests(data);
        setLoading(false);
      },
      err => {
        logger.error("FreeLiveRequests: snapshot failed", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // ── Approve: create live + mark approved + notify teacher ──
  const handleApprove = async (req: FreeLiveRequest) => {
    if (actioningId) return;
    setActioningId(req.id);
    try {
      // Fetch teacher's institutionId
      const teacherSnap = await getDoc(doc(db, "users", req.teacherId));
      const teacherData  = teacherSnap.exists() ? teacherSnap.data() : {};
      const institutionId = teacherData?.institutionId ?? null;

      // Create the live session
      await addDoc(collection(db, "lives"), {
        title:            req.title,
        description:      req.description || "",
        thumbnail:        "",
        scheduledAt:      req.scheduledAt || "",
        target:           "free" as LiveTarget,
        price:            null,
        status:           "scheduled",
        createdBy:        req.teacherId,
        institutionId,
        hostName:         req.teacherName,
        roomName:         generateRoomName(req.title),
        participantCount: 0,
        createdAt:        serverTimestamp(),
        updatedAt:        serverTimestamp(),
      });

      // Mark request as approved
      await updateDoc(doc(db, "freeLiveRequests", req.id), {
        status: "approved",
        approvedAt: serverTimestamp(),
      });

      // Notify teacher via user notifications subcollection
      await addDoc(collection(db, "users", req.teacherId, "notifications"), {
        uid:       req.teacherId,
        type:      "live_approved",
        title:     "Live aprovada!",
        message:   `A tua live "${req.title}" foi aprovada e criada. Podes encontrá-la nas tuas aulas ao vivo.`,
        read:      false,
        createdAt: serverTimestamp(),
      }).catch(err => {
        // Non-critical — log but don't fail the approval
        logger.error("FreeLiveRequests: failed to notify teacher", err, { teacherId: req.teacherId });
      });

      toast.success(`Live "${req.title}" aprovada e criada com sucesso.`);
    } catch (err) {
      logger.error("FreeLiveRequests: approve failed", err, { requestId: req.id });
      toast.error("Erro ao aprovar. Tenta novamente.");
    } finally {
      setActioningId(null);
    }
  };

  // ── Reject: mark rejected + notify teacher ──
  const handleReject = async (req: FreeLiveRequest) => {
    if (actioningId) return;
    setActioningId(req.id);
    try {
      await updateDoc(doc(db, "freeLiveRequests", req.id), {
        status:     "rejected",
        rejectedAt: serverTimestamp(),
      });

      // Notify teacher
      await addDoc(collection(db, "users", req.teacherId, "notifications"), {
        uid:       req.teacherId,
        type:      "live_rejected",
        title:     "Pedido de live rejeitado",
        message:   `O teu pedido para a live "${req.title}" foi rejeitado pelo administrador.`,
        read:      false,
        createdAt: serverTimestamp(),
      }).catch(err => {
        logger.error("FreeLiveRequests: failed to notify teacher on reject", err, { teacherId: req.teacherId });
      });

      toast.success("Pedido rejeitado.");
    } catch (err) {
      logger.error("FreeLiveRequests: reject failed", err, { requestId: req.id });
      toast.error("Erro ao rejeitar.");
    } finally {
      setActioningId(null);
    }
  };

  // ── Delete with toast confirmation ──
  const handleDelete = (req: FreeLiveRequest) => {
    toast.error(`Eliminar pedido "${req.title}"?`, {
      description: "Esta acção é irreversível.",
      action: {
        label: "Eliminar",
        onClick: async () => {
          try {
            await deleteDoc(doc(db, "freeLiveRequests", req.id));
            toast.success("Pedido eliminado.");
          } catch (err) {
            logger.error("FreeLiveRequests: delete failed", err, { requestId: req.id });
            toast.error("Erro ao eliminar.");
          }
        },
      },
    });
  };

  const pending  = requests.filter(r => r.status === "pending");
  const history  = requests.filter(r => r.status !== "pending");

  return (
    <div className="max-w-[80rem] mx-auto space-y-8 animate-in fade-in duration-300">

      {/* ── Cabeçalho ── */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-purple/60 mb-2">
          // pedidos de lives
        </p>
        <h1 className="text-2xl font-bold text-gray-100">Lives Gratuitas</h1>
        <p className="mt-1 text-sm text-gray-600">
          {loading
            ? "A carregar..."
            : `${pending.length} pedido${pending.length !== 1 ? "s" : ""} pendente${pending.length !== 1 ? "s" : ""}`
          }
        </p>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && requests.length === 0 && (
        <div className="flex flex-col items-center justify-center border border-gray-800/60 bg-gray-900/10 py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
            <MailQuestion className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-gray-700 mb-2">
            // sem pedidos
          </p>
          <p className="text-sm text-gray-600">
            Nenhum professor pediu uma live gratuita ainda.
          </p>
        </div>
      )}

      {!loading && requests.length > 0 && (
        <div className="space-y-8">

          {/* ── Pendentes ── */}
          {pending.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-1.5 w-1.5 bg-amber-400 animate-pulse" />
                <p className="font-mono text-[10px] uppercase tracking-widest text-amber-400/70">
                  pendentes · {pending.length}
                </p>
              </div>

              <div className="border border-amber-500/20 divide-y divide-gray-800/40">
                {pending.map(req => (
                  <div key={req.id} className="px-5 py-5 hover:bg-gray-900/20 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-gray-100 truncate">{req.title}</p>

                        {req.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{req.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 mt-3">
                          <span className="flex items-center gap-1.5 font-mono text-[10px] text-gray-600">
                            <User className="h-3 w-3" strokeWidth={1.5} />
                            {req.teacherName}
                          </span>
                          {req.scheduledAt && (
                            <span className="flex items-center gap-1.5 font-mono text-[10px] text-gray-600">
                              <Calendar className="h-3 w-3" strokeWidth={1.5} />
                              {fmtDate(req.scheduledAt)}
                            </span>
                          )}
                          {fmtRaw(req.createdAt) !== null && (
                            <span className="flex items-center gap-1.5 font-mono text-[10px] text-gray-700">
                              <Clock className="h-3 w-3" strokeWidth={1.5} />
                              pedido em {fmtRaw(req.createdAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Acções */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleApprove(req)}
                          disabled={!!actioningId}
                          className="flex items-center gap-1.5 border border-green/30 bg-green/8 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-green/80 hover:bg-green/15 disabled:opacity-40 transition-all"
                        >
                          {actioningId === req.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <CheckCircle2 className="h-3 w-3" strokeWidth={1.5} />
                          }
                          Aprovar
                        </button>

                        <button
                          onClick={() => handleReject(req)}
                          disabled={!!actioningId}
                          className="flex items-center gap-1.5 border border-red-500/30 bg-red-500/8 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-red-400/80 hover:bg-red-500/15 disabled:opacity-40 transition-all"
                        >
                          {actioningId === req.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <XCircle className="h-3 w-3" strokeWidth={1.5} />
                          }
                          Rejeitar
                        </button>

                        <button
                          onClick={() => handleDelete(req)}
                          title="Eliminar pedido"
                          className="flex h-8 w-8 items-center justify-center border border-gray-800/60 bg-gray-900/10 text-gray-700 hover:border-gray-700 hover:text-gray-400 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Nota informativa */}
              <div className="mt-3 flex items-start gap-2.5 border border-gray-800/40 bg-gray-900/10 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-700" strokeWidth={1.5} />
                <p className="text-xs text-gray-600 leading-relaxed">
                  Ao <strong className="text-gray-500">aprovar</strong>, uma aula ao vivo gratuita é criada
                  automaticamente com os dados do pedido e o professor é notificado.
                  Ao <strong className="text-gray-500">rejeitar</strong>, o professor é notificado mas nenhuma live é criada.
                </p>
              </div>
            </section>
          )}

          {/* ── Histórico ── */}
          {history.length > 0 && (
            <section>
              <p className="font-mono text-[10px] uppercase tracking-widest text-gray-700 mb-3">
                // histórico · {history.length}
              </p>

              <div className="border border-gray-800/60 divide-y divide-gray-800/30">
                {history.map(req => (
                  <div
                    key={req.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-gray-900/10 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-gray-300 truncate">{req.title}</p>
                        <StatusBadge status={req.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 font-mono text-[9px] text-gray-700">
                          <User className="h-2.5 w-2.5" strokeWidth={1.5} />
                          {req.teacherName}
                        </span>
                        {req.scheduledAt && (
                          <span className="flex items-center gap-1 font-mono text-[9px] text-gray-700">
                            <Calendar className="h-2.5 w-2.5" strokeWidth={1.5} />
                            {fmtDate(req.scheduledAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(req)}
                      title="Eliminar do histórico"
                      className="flex h-7 w-7 shrink-0 items-center justify-center border border-gray-800/40 text-gray-700 hover:border-gray-700 hover:text-gray-400 transition-all"
                    >
                      <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}