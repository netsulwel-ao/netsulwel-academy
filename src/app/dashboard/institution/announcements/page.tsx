"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { Megaphone, Plus, Loader2, X, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  status: string;
}

export default function InstitutionAnnouncementsPage() {
  const { user, institutionId } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!institutionId) return;
    loadAnnouncements();
  }, [institutionId]);

  const loadAnnouncements = async () => {
    try {
      const q = query(
        collection(db, "institutionAnnouncements"),
        where("institutionId", "==", institutionId),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setAnnouncements(snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title,
          content: data.content,
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
          status: data.status || "active",
        };
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content || !institutionId) return;
    setCreating(true);
    try {
      await addDoc(collection(db, "institutionAnnouncements"), {
        institutionId,
        title: form.title,
        content: form.content,
        status: "active",
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
      });
      toast.success("Comunicado publicado!");
      setForm({ title: "", content: "" });
      setShowCreate(false);
      loadAnnouncements();
    } catch {
      toast.error("Erro ao publicar comunicado.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="h-8 w-56 bg-gray-800 rounded-lg animate-pulse" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[100rem] space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-gray-800/60 p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 blur-3xl rounded-full" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Megaphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Comunicados</h1>
              <p className="text-gray-400">Publica anúncios para os membros da instituição</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-purple hover:bg-purple-light text-white px-5 py-2.5 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-purple-500/25">
            <Plus className="h-5 w-5" />Novo Comunicado
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowCreate(false)}>
          <div className="relative w-full max-w-2xl mx-4 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800/70 shadow-2xl">
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 blur-3xl rounded-full" />
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Megaphone className="h-5 w-5 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Novo Comunicado</h3>
                  </div>
                  <button onClick={() => setShowCreate(false)} className="h-8 w-8 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Título</label>
                    <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                      placeholder="Título do comunicado" required
                      className="w-full bg-gray-800/80 border border-gray-700/50 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 focus:bg-gray-800 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Conteúdo</label>
                    <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                      placeholder="Escreve o conteúdo do comunicado..." required rows={6}
                      className="w-full bg-gray-800/80 border border-gray-700/50 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 focus:bg-gray-800 transition-all resize-none" />
                  </div>
                  <button type="submit" disabled={creating}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold py-2.5 rounded-lg transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-purple-500/25">
                    {creating ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Publicar Comunicado"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {announcements.length === 0 ? (
        <div className="rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/70 p-16 text-center">
          <div className="relative inline-flex mb-6">
            <div className="absolute inset-0 bg-purple-500/10 blur-2xl rounded-full" />
            <Megaphone className="h-16 w-16 text-gray-600 relative" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Nenhum comunicado</h3>
          <p className="text-gray-400">Publica o primeiro comunicado para os membros da instituição.</p>
          <button onClick={() => setShowCreate(true)}
            className="mt-6 inline-flex items-center gap-2 bg-purple hover:bg-purple-light text-white px-5 py-2.5 rounded-lg font-bold transition-all hover:shadow-lg hover:shadow-purple-500/20">
            <Plus className="h-4 w-4" />Criar Primeiro Comunicado
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(a => (
            <div key={a.id} className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/70 hover:border-purple/30 transition-all duration-300 p-6">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-purple-700 rounded-l" />
              <div className="relative flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Megaphone className="h-5 w-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h3 className="font-bold text-white text-lg">{a.title}</h3>
                    <span className="text-xs text-gray-500 flex items-center gap-1.5 shrink-0">
                      <Calendar className="h-3.5 w-3.5" />
                      {a.createdAt.toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{a.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
