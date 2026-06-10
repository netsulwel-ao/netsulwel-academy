"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { GraduationCap, Plus, Loader2, Users, X } from "lucide-react";
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
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-purple" /></div>;
  }

  return (
    <div className="max-w-[100rem] space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Turmas</h1>
          <p className="mt-2 text-gray-400">Organiza os membros em turmas.</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-purple hover:bg-purple-light text-white font-bold px-5 py-2.5 transition-colors">
          <Plus className="h-5 w-5" />Nova Turma
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowCreate(false)}>
          <div className="bg-gray-900 border border-gray-800 p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Nova Turma</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Nome da turma" required
                className="w-full bg-gray-800 border border-gray-700 py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple rounded-lg" />
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Descrição (opcional)" rows={3}
                className="w-full bg-gray-800 border border-gray-700 py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple rounded-lg" />
              <button type="submit" disabled={creating}
                className="w-full bg-purple hover:bg-purple-light text-white font-bold py-2.5 transition-colors disabled:opacity-50">
                {creating ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Criar Turma"}
              </button>
            </form>
          </div>
        </div>
      )}

      {classes.length === 0 ? (
        <div className="bg-gray-900/40 border border-gray-800 p-12 text-center">
          <GraduationCap className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhuma turma criada ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(c => (
            <div key={c.id} className="bg-gray-900/40 border border-gray-800 p-6 hover:border-gray-700 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">{c.name}</h3>
                  {c.description && <p className="text-sm text-gray-400">{c.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Users className="h-4 w-4" />
                {c.memberCount || 0} membro{(c.memberCount || 0) !== 1 ? "s" : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}