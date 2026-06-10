"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { Megaphone, Plus, Loader2, X, Eye } from "lucide-react";
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
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-purple" /></div>;
  }

  return (
    <div className="max-w-[100rem] space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Comunicados</h1>
          <p className="mt-2 text-gray-400">Publica anúncios para os membros da instituição.</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-purple hover:bg-purple-light text-white font-bold px-5 py-2.5 transition-colors">
          <Plus className="h-5 w-5" />Novo Comunicado
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowCreate(false)}>
          <div className="bg-gray-900 border border-gray-800 p-6 w-full max-w-2xl mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Novo Comunicado</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Título do comunicado" required
                className="w-full bg-gray-800 border border-gray-700 py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple rounded-lg" />
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                placeholder="Conteúdo do comunicado..." required rows={6}
                className="w-full bg-gray-800 border border-gray-700 py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple rounded-lg" />
              <button type="submit" disabled={creating}
                className="w-full bg-purple hover:bg-purple-light text-white font-bold py-2.5 transition-colors disabled:opacity-50">
                {creating ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Publicar"}
              </button>
            </form>
          </div>
        </div>
      )}

      {announcements.length === 0 ? (
        <div className="bg-gray-900/40 border border-gray-800 p-12 text-center">
          <Megaphone className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum comunicado publicado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(a => (
            <div key={a.id} className="bg-gray-900/40 border border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Megaphone className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">{a.title}</h3>
                  <p className="text-xs text-gray-500">{a.createdAt.toLocaleDateString("pt-PT")}</p>
                </div>
              </div>
              <p className="text-gray-300 whitespace-pre-wrap">{a.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}