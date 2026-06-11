"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { GraduationCap, Plus, Loader2, Users, X, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface Class {
  id: string;
  name: string;
  description: string;
  memberCount?: number;
}

export default function InstitutionClassesPage() {
  const { institutionId } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!institutionId) return;
    loadData();
  }, [institutionId]);

  const loadData = async () => {
    try {
      const [classesSnap, membersSnap] = await Promise.all([
        getDocs(query(collection(db, "institutionClasses"), where("institutionId", "==", institutionId))),
        getDocs(query(collection(db, "users"), where("institutionId", "==", institutionId))),
      ]);
      const membersData = membersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMembers(membersData);
      setClasses(classesSnap.docs.map(d => {
        const data = d.data();
        const classMemberIds: string[] = data.members || [];
        return { id: d.id, name: data.name, description: data.description, memberCount: classMemberIds.length };
      }));
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !institutionId) return;
    setCreating(true);
    try {
      await addDoc(collection(db, "institutionClasses"), {
        institutionId,
        name: form.name,
        description: form.description,
        members: [],
        createdAt: serverTimestamp(),
      });
      toast.success("Turma criada!");
      setForm({ name: "", description: "" });
      setShowCreate(false);
      loadData();
    } catch {
      toast.error("Erro ao criar turma.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="h-8 w-40 bg-gray-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[100rem] space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-gray-800/60 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 blur-3xl rounded-full" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
              <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Turmas</h1>
              <p className="text-sm sm:text-base text-gray-400">Organiza os membros em turmas</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-purple hover:bg-purple-light text-white px-5 py-2.5 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-purple-500/25">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />Nova Turma
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowCreate(false)}>
          <div className="relative w-full max-w-md mx-4 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800/70 shadow-2xl">
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 blur-3xl rounded-full" />
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Nova Turma</h3>
                  </div>
                  <button onClick={() => setShowCreate(false)} className="h-8 w-8 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Nome da Turma</label>
                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Ex: 10ª Classe A" required
                      className="w-full bg-gray-800/80 border border-gray-700/50 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 focus:bg-gray-800 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Descrição</label>
                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Descrição da turma (opcional)" rows={3}
                      className="w-full bg-gray-800/80 border border-gray-700/50 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 focus:bg-gray-800 transition-all resize-none" />
                  </div>
                  <button type="submit" disabled={creating}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold py-2.5 rounded-lg transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-purple-500/25">
                    {creating ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Criar Turma"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {classes.length === 0 ? (
        <div className="rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/70 p-8 sm:p-16 text-center">
          <div className="relative inline-flex mb-4 sm:mb-6">
            <div className="absolute inset-0 bg-purple-500/10 blur-2xl rounded-full" />
            <GraduationCap className="h-12 w-12 sm:h-16 sm:w-16 text-gray-600 relative" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Nenhuma turma criada</h3>
          <p className="text-gray-400">Cria a primeira turma para organizar os membros.</p>
          <button onClick={() => setShowCreate(true)}
            className="mt-6 inline-flex items-center gap-2 bg-purple hover:bg-purple-light text-white px-5 py-2.5 rounded-lg font-bold transition-all hover:shadow-lg hover:shadow-purple-500/20">
            <Plus className="h-4 w-4" />Criar Primeira Turma
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {classes.map(c => (
            <div key={c.id} className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/70 p-4 sm:p-6 hover:border-purple/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-700/20 flex items-center justify-center border border-purple-500/10 shrink-0">
                    <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-base sm:text-lg truncate">{c.name}</h3>
                    {c.description && <p className="text-xs sm:text-sm text-gray-400 truncate">{c.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>{c.memberCount || 0} membro{(c.memberCount || 0) !== 1 ? "s" : ""}</span>
                </div>
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-800/50 flex gap-2">
                  <button className="flex-1 text-xs text-gray-400 hover:text-purple-400 transition-colors font-medium py-1.5 px-3 rounded-lg bg-gray-800/30 hover:bg-purple-500/10">
                    Gerir Membros
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
