"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, orderBy, query, where } from "firebase/firestore";
import { Plus, Trash2, Pencil, Loader2, BookOpen, AlertTriangle, Layers, Radio } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import type { Trail } from "@/types/course";

const TYPE_LABELS = { golden: "Golden", smart: "Smart", standalone: "Standalone" };
const TYPE_COLORS = {
  golden: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  smart: "bg-green-500/15 text-green-400 border-green-500/25",
  standalone: "bg-blue-500/15 text-blue-400 border-blue-500/25",
};

export default function TrailsPage() {
  const { isAdmin, isTeacher, user } = useAuth();
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTrails = async () => {
    try {
      // Teacher vê apenas as suas trilhas
      const constraints = isTeacher && user?.uid
        ? [orderBy("createdAt", "desc"), where("createdBy", "==", user.uid)]
        : [orderBy("createdAt", "desc")];
      const q = query(collection(db, "trails"), ...constraints);
      const snap = await getDocs(q);
      setTrails(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trail)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrails();
  }, [isTeacher, user?.uid]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "trails", id));
      setTrails((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Trilhas</h1>
          <p className="mt-1 text-gray-400">{loading ? "A carregar..." : `${trails.length} trilha${trails.length !== 1 ? "s" : ""}`}</p>
        </div>
        <Link href="/admin/trails/new"
          className="flex items-center gap-2 bg-purple hover:bg-purple-light text-white px-5 py-2.5 font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Nova Trilha
        </Link>
      </div>

      {loading && <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-purple" /></div>}

      {!loading && trails.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 bg-gray-900/40 text-center">
          <Layers className="h-12 w-12 text-gray-700 mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Nenhuma trilha ainda</h2>
          <p className="text-gray-400 mb-6 max-w-sm">Crie trilhas para agrupar cursos em sequências de aprendizagem.</p>
          <Link href="/admin/trails/new" className="flex items-center gap-2 bg-purple hover:bg-purple-light text-white px-6 py-3 font-bold transition-colors">
            <Plus className="w-4 h-4" /> Criar Primeira Trilha
          </Link>
        </div>
      )}

      {!loading && trails.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {trails.map((trail) => (
            <div key={trail.id} className="group bg-gray-900/40 backdrop-blur-xl flex flex-col overflow-hidden hover:bg-gray-900/60 transition-all">
              <div className="relative h-40 bg-gray-800 overflow-hidden">
                {trail.thumbnail ? (
                  <img src={trail.thumbnail} alt={trail.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-900/40 to-gray-900">
                    <Layers className="h-12 w-12 text-blue-500/40" />
                  </div>
                )}
                <span className={`absolute top-3 right-3 px-2.5 py-1 text-xs font-bold uppercase tracking-wider border ${TYPE_COLORS[trail.type ?? "standalone"]}`}>
                  {TYPE_LABELS[trail.type ?? "standalone"]}
                </span>
              </div>

              <div className="flex flex-col flex-1 p-5">
                <h3 className="font-bold text-white text-lg leading-snug">{trail.title}</h3>
                <p className="mt-2 text-sm text-gray-400 line-clamp-2 flex-1">{trail.description || "Sem descrição."}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{trail.coursesCount ?? 0} cursos</span>
<span className="flex items-center gap-1"><Radio className="h-3.5 w-3.5" />{trail.livesCount ?? 0} aulas</span>
                  <span className={`px-2 py-0.5 border text-xs font-medium ${trail.status === "published" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                    {trail.status === "published" ? "Publicada" : "Rascunho"}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3 border-t border-gray-800 pt-4">
                  <Link href={`/admin/trails/${trail.id}/edit`}
                    className="flex flex-1 items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-2 text-sm font-medium transition-colors">
                    <Pencil className="h-4 w-4" /> Editar
                  </Link>
        <button onClick={() => setConfirmDelete(trail.id!)}
                    className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-2 text-sm transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 p-8 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Apagar Trilha</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6">Tens a certeza? Os cursos associados não serão apagados, apenas a trilha.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(confirmDelete)} disabled={!!deletingId}
                className="flex flex-1 items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 font-bold transition-colors disabled:opacity-60">
                {deletingId ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apagar"}
              </button>
              <button onClick={() => setConfirmDelete(null)}
                className="flex flex-1 items-center justify-center bg-gray-800 hover:bg-gray-700 text-white py-2.5 font-medium transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
