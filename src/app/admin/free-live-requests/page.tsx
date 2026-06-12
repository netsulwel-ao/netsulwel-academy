"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, CheckCircle2, XCircle, MailQuestion, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { LiveTarget } from "@/types/live";

interface FreeLiveRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description?: string;
  scheduledAt?: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: { toDate: () => Date };
}

export default function FreeLiveRequestsPage() {
  const [requests, setRequests] = useState<FreeLiveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "freeLiveRequests"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as FreeLiveRequest)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const generateRoomName = (title: string) => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
    const rand = Math.random().toString(36).substring(2, 8);
    return `${slug}-${rand}`;
  };

  const handleApprove = async (id: string) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    try {
      await addDoc(collection(db, "lives"), {
        title: req.title,
        description: req.description || "",
        thumbnail: "",
        scheduledAt: req.scheduledAt || "",
        target: "free" as LiveTarget,
        price: null,
        status: "scheduled",
        createdBy: req.teacherId,
        hostName: req.teacherName,
        roomName: generateRoomName(req.title),
        participantCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "freeLiveRequests", id), { status: "approved" });
    } catch (err) {
      console.error("Erro ao aprovar e criar live:", err);
    }
  };

  const handleReject = async (id: string) => {
    await updateDoc(doc(db, "freeLiveRequests", id), { status: "rejected" });
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "freeLiveRequests", id));
  };

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString("pt-PT") : "—";

  const pending = requests.filter(r => r.status === "pending");
  const history = requests.filter(r => r.status !== "pending");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Pedidos de Lives Gratuitas</h1>
        <p className="mt-1 text-gray-500">{pending.length} pedido{pending.length !== 1 ? "s" : ""} pendente{pending.length !== 1 ? "s" : ""}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-purple" /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-white/5 border border-gray-800">
          <MailQuestion className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum pedido de live gratuita.</p>
        </div>
      ) : (
        <>
          {/* Pending */}
          {pending.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400" /> Pendentes
              </h2>
              <div className="grid gap-4">
                {pending.map(r => (
                  <div key={r.id} className="bg-white/5 border border-yellow-500/20 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{r.title}</h3>
                          <span className="px-2 py-0.5 text-xs font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">Pendente</span>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{r.description || "Sem descrição"}</p>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span>👤 {r.teacherName}</span>
                          <span>📅 {formatDate(r.scheduledAt)}</span>
                          <Link href={`/profile/${r.teacherId}`} className="text-purple-400 hover:text-purple-300 flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" /> Ver perfil
                          </Link>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => handleApprove(r.id)}
                          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-bold transition-colors">
                          <CheckCircle2 className="h-4 w-4" /> Aprovar
                        </button>
                        <button onClick={() => handleReject(r.id)}
                          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-bold transition-colors">
                          <XCircle className="h-4 w-4" /> Rejeitar
                        </button>
                        <button onClick={() => handleDelete(r.id)}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* History */}
          {history.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold">Histórico</h2>
              <div className="grid gap-3">
                {history.map(r => (
                  <div key={r.id} className="bg-white/5 border border-gray-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 opacity-70">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{r.title}</h3>
                        <span className={`px-2 py-0.5 text-xs font-bold ${
                          r.status === "approved"
                            ? "bg-green-500/15 text-green-400 border border-green-500/25"
                            : "bg-red-500/15 text-red-400 border border-red-500/25"
                        }`}>
                          {r.status === "approved" ? "Aprovado" : "Rejeitado"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{r.teacherName} • {formatDate(r.scheduledAt)}</p>
                    </div>
                    <button onClick={() => handleDelete(r.id)}
                      className="p-2 text-gray-600 hover:text-red-400 transition-colors shrink-0" title="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </button>
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
