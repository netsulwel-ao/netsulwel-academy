"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Building2, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import type { Institution } from "@/types/institution";

export default function InstitutionSettingsPage() {
  const { user, institutionId } = useAuth();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });

  useEffect(() => {
    if (!institutionId) return;
    loadInstitution();
  }, [institutionId]);

  const loadInstitution = async () => {
    try {
      const snap = await getDoc(doc(db, "institutions", institutionId!));
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Institution;
        setInstitution(data);
        setForm({ name: data.name, email: data.email, phone: data.phone || "", address: data.address || "" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!institutionId) return;
    setSaving(true);
    try {
      const res = await fetchWithAuth(`/api/institutions/${institutionId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Instituição actualizada com sucesso.");
      loadInstitution();
    } catch {
      toast.error("Erro ao actualizar instituição.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white">Definições</h1>
        <p className="mt-2 text-gray-400">Actualiza os dados da tua instituição.</p>
      </div>

      <div className="bg-gray-900/40 border border-gray-800 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Nome da Instituição</label>
          <input type="text" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-purple" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
          <input type="email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-purple" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Telefone</label>
          <input type="text" value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-purple" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Morada</label>
          <input type="text" value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-purple" />
        </div>
        <button onClick={handleSave} disabled={saving}
          className="bg-purple hover:bg-purple-light text-white font-bold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Salvar Alterações
        </button>
      </div>
    </div>
  );
}