"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  Plus,
  Radio,
  Calendar,
  Users,
  Trash2,
  Play,
  Eye,
  Loader2,
  Clock,
} from "lucide-react";
import type { LiveSession } from "@/types/live";

const STATUS_CONFIG = {
  scheduled: {
    label: "Agendada",
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
    dot: "bg-yellow-400",
  },
  live: {
    label: "Ao Vivo",
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/30",
    dot: "bg-red-400",
  },
  ended: {
    label: "Encerrada",
    bg: "bg-gray-500/10",
    text: "text-gray-400",
    border: "border-gray-500/30",
    dot: "bg-gray-400",
  },
};

const TARGET_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: "Gratuito", color: "text-green-400 bg-green-500/10" },
  smart: { label: "Smart", color: "text-blue-400 bg-blue-500/10" },
  golden: { label: "Golden", color: "text-amber-400 bg-amber-500/10" },
};

export default function AdminLivesPage() {
  const [lives, setLives] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function fetchLives() {
    try {
      const snap = await getDocs(
        query(collection(db, "lives"), orderBy("scheduledAt", "desc"))
      );
      const data = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as LiveSession)
      );
      setLives(data);
    } catch (err) {
      console.error("Erro ao carregar lives:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchLives();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem a certeza que deseja eliminar esta live?")) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, "lives", id));
      setLives((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error("Erro ao eliminar:", err);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Radio className="h-8 w-8 text-red-400" />
            Aulas ao Vivo
          </h1>
          <p className="mt-2 text-gray-400">
            Gerir e agendar aulas ao vivo para os alunos.
          </p>
        </div>
        <Link
          href="/admin/lives/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 font-bold transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nova Live
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["scheduled", "live", "ended"] as const).map((status) => {
          const count = lives.filter((l) => l.status === status).length;
          const cfg = STATUS_CONFIG[status];
          return (
            <div
              key={status}
              className={`p-4 ${cfg.bg} border ${cfg.border} backdrop-blur-xl`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} ${status === "live" ? "animate-pulse" : ""}`} />
                <span className={`text-sm font-medium ${cfg.text}`}>
                  {cfg.label}
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-white">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Lives List */}
      {lives.length === 0 ? (
        <div className="p-12 bg-gray-900/40 backdrop-blur-xl text-center">
          <div className="mx-auto w-16 h-16 bg-red-500/10 text-red-400 flex items-center justify-center mb-4">
            <Radio className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Nenhuma live criada
          </h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Crie a sua primeira aula ao vivo para começar a interagir com os
            alunos em tempo real.
          </p>
          <Link
            href="/admin/lives/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-bold transition-colors"
          >
            <Plus className="h-5 w-5" />
            Criar Primeira Live
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {lives.map((live) => {
            const cfg = STATUS_CONFIG[live.status];
            const target = TARGET_LABELS[live.target];
            return (
              <div
                key={live.id}
                className="bg-gray-900/40 backdrop-blur-xl overflow-hidden group hover:bg-gray-900/60 transition-all"
              >
                {/* Thumbnail */}
                <div className="relative h-40 overflow-hidden">
                  {live.thumbnail ? (
                    <img
                      src={live.thumbnail}
                      alt={live.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <Radio className="h-12 w-12 text-gray-700" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div
                    className={`absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 text-xs font-bold ${cfg.bg} ${cfg.text} backdrop-blur-md border ${cfg.border}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${live.status === "live" ? "animate-pulse" : ""}`} />
                    {cfg.label}
                  </div>
                  {/* Target Badge */}
                  <div
                    className={`absolute top-3 right-3 px-3 py-1 text-xs font-bold ${target.color} backdrop-blur-md`}
                  >
                    {target.label}
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 space-y-3">
                  <h3 className="text-lg font-bold text-white truncate">
                    {live.title}
                  </h3>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {live.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(live.scheduledAt)}
                    </span>
                    {live.participantCount !== undefined && (
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {live.participantCount} participantes
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                    {live.status === "scheduled" && (
                      <Link
                        href={`/admin/lives/${live.id}/studio`}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-bold transition-colors flex-1 justify-center"
                      >
                        <Play className="h-4 w-4" />
                        Iniciar Aula
                      </Link>
                    )}
                    {live.status === "live" && (
                      <Link
                        href={`/admin/lives/${live.id}/studio`}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-bold transition-colors flex-1 justify-center animate-pulse"
                      >
                        <Radio className="h-4 w-4" />
                        Entrar no Studio
                      </Link>
                    )}
                    {live.status === "ended" && (
                      <div className="flex items-center gap-2 text-gray-500 px-4 py-2 text-sm flex-1 justify-center">
                        <Clock className="h-4 w-4" />
                        {live.endedAt ? formatDate(live.endedAt) : "Encerrada"}
                      </div>
                    )}
                    <button
                      onClick={() => handleDelete(live.id!)}
                      disabled={deleting === live.id}
                      className="flex items-center justify-center h-9 w-9 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      {deleting === live.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
