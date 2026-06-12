"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { Video, Plus, Loader2, Calendar, Clock, Eye, Edit, Radio, MailQuestion, CheckCircle2, XCircle, Play } from "lucide-react";
import Link from "next/link";

interface LiveSession {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  status: string;
  scheduledAt?: { toDate: () => Date };
  createdAt?: { toDate: () => Date };
  target?: string;
}

interface FreeRequest {
  id: string;
  title: string;
  description?: string;
  scheduledAt?: string;
  status: "pending" | "approved" | "rejected";
}

export default function TeacherLivesPage() {
  const { user, isTeacher } = useAuth();
  const [lives, setLives] = useState<LiveSession[]>([]);
  const [requests, setRequests] = useState<FreeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isTeacher) return;
    const load = async () => {
      try {
        const [liveSnap, reqSnap] = await Promise.all([
          getDocs(query(collection(db, "lives"), where("createdBy", "==", user.uid), orderBy("createdAt", "desc"))),
          getDocs(query(collection(db, "freeLiveRequests"), where("teacherId", "==", user.uid), orderBy("createdAt", "desc"))),
        ]);
        setLives(liveSnap.docs.map(d => ({ id: d.id, ...d.data() } as LiveSession)));
        setRequests(reqSnap.docs.map(d => ({ id: d.id, ...d.data() } as FreeRequest)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, isTeacher]);

  const now = new Date();
  const toDate = (d: unknown): Date | null => {
    if (!d) return null;
    if (typeof d === "object" && "toDate" in (d as object)) return (d as { toDate: () => Date }).toDate();
    return new Date(d as string);
  };
  const active = lives.filter(l => l.status === "active");
  const upcoming = lives.filter(l => l.status === "scheduled" && l.scheduledAt && toDate(l.scheduledAt)! > now);
  const past = lives.filter(l => l.status === "ended" || (l.scheduledAt && toDate(l.scheduledAt)! <= now));

  const formatDate = (d?: unknown) => { const dt = toDate(d); return dt ? dt.toLocaleDateString("pt-PT") : "—"; };
  const formatTime = (d?: unknown) => { const dt = toDate(d); return dt ? dt.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }) : "—"; };

  if (!isTeacher) {
    return <div className="text-center py-20"><p className="text-gray-400">Acesso não autorizado.</p></div>;
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Aulas ao Vivo</h1>
          <p className="mt-1 text-gray-400">{lives.length} aula{lives.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/dashboard/teacher/lives/new"
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-3 font-bold transition-colors">
          <Plus className="h-5 w-5" /> Nova Aula
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-purple" /></div>
      ) : lives.length === 0 && requests.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/40 border border-gray-800">
          <Radio className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">Ainda não criaste nenhuma aula ao vivo.</p>
          <Link href="/dashboard/teacher/lives/new"
            className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 font-bold">
            <Plus className="h-4 w-4" /> Agendar primeira aula
          </Link>
        </div>
      ) : (
        <>
          {/* Free Live Requests */}
          {requests.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MailQuestion className="h-5 w-5 text-purple-400" /> Pedidos de Lives Gratuitas
              </h2>
              <div className="grid gap-3">
                {requests.map(r => (
                  <div key={r.id} className={`p-4 border ${
                    r.status === "approved" ? "border-green-500/20 bg-green-500/5"
                    : r.status === "rejected" ? "border-red-500/20 bg-red-500/5"
                    : "border-yellow-500/20 bg-yellow-500/5"
                  }`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white">{r.title}</h3>
                        <p className="text-sm text-gray-400 mt-0.5">
                          {r.scheduledAt ? new Date(r.scheduledAt).toLocaleDateString("pt-PT") : "—"}
                        </p>
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 shrink-0 ${
                        r.status === "approved" ? "text-green-400 bg-green-500/10 border border-green-500/30"
                        : r.status === "rejected" ? "text-red-400 bg-red-500/10 border border-red-500/30"
                        : "text-yellow-400 bg-yellow-500/10 border border-yellow-500/30"
                      }`}>
                        {r.status === "approved" ? <><CheckCircle2 className="h-3 w-3" /> Aprovado</>
                        : r.status === "rejected" ? <><XCircle className="h-3 w-3" /> Rejeitado</>
                        : <><MailQuestion className="h-3 w-3" /> Pendente</>}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Active */}
          {active.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Ao Vivo Agora
              </h2>
              <div className="grid gap-3">
                {active.map(l => (
                  <div key={l.id} className="bg-gray-900/40 border border-red-500/20 p-5 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white">{l.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">{l.description}</p>
                    </div>
                    <Link href={`/admin/lives/${l.id}/studio`}
                      className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 font-bold text-sm transition-colors text-center shrink-0">
                      Ir para Estúdio
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-400" /> Agendadas
              </h2>
              <div className="grid gap-3">
                {upcoming.map(l => (
                  <div key={l.id} className="bg-gray-900/40 border border-gray-800 p-5 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white">{l.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        <Clock className="h-3.5 w-3.5 inline mr-1" />
                        {formatDate(l.scheduledAt)} às {formatTime(l.scheduledAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/admin/lives/${l.id}/studio`}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-bold transition-colors">
                        <Play className="h-4 w-4" />
                        Iniciar Aula
                      </Link>
                      <Link href={`/dashboard/teacher/lives/${l.id}/edit`}
                        className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 transition-all">
                        <Edit className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Past */}
          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white">Realizadas</h2>
              <div className="grid gap-3">
                {past.map(l => (
                  <div key={l.id} className="bg-gray-900/20 border border-gray-800/50 p-5 flex flex-col sm:flex-row sm:items-center gap-2 opacity-70">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white">{l.title}</h3>
                      <p className="text-sm text-gray-500">{formatDate(l.scheduledAt)}</p>
                    </div>
                    <span className="text-sm text-gray-600 shrink-0">Concluída</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
