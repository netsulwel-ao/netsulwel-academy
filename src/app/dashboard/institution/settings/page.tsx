"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Building2, Loader2, Check, Save, Mail, Phone, MapPin } from "lucide-react";
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
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="h-8 w-48 bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-96 bg-gray-800/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-gray-800/60 p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 blur-3xl rounded-full" />
        <div className="relative flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Definições</h1>
            <p className="text-gray-400">Actualiza os dados da tua instituição</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/70">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 blur-3xl rounded-full" />
        <div className="relative p-8 space-y-6">
          <div className="flex items-center gap-3 pb-6 border-b border-gray-800/70">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Informação da Instituição</h2>
              <p className="text-sm text-gray-400">Gerir os dados principais da instituição</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nome da Instituição</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input type="text" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-gray-800/80 border border-gray-700/50 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 focus:bg-gray-800 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-gray-800/80 border border-gray-700/50 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 focus:bg-gray-800 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input type="text" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+244 XXX XXX XXX"
                  className="w-full bg-gray-800/80 border border-gray-700/50 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 focus:bg-gray-800 transition-all" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Morada</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input type="text" value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="Morada da instituição"
                  className="w-full bg-gray-800/80 border border-gray-700/50 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 focus:bg-gray-800 transition-all" />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-800/70 flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold py-2.5 px-8 rounded-lg transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-purple-500/25">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>

      {/* Status Card */}
      {institution && (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/70 p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
          <div className="relative flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${institution.status === "approved" ? "bg-green-500" : institution.status === "pending" ? "bg-yellow-500" : "bg-red-500"}`} />
            <div>
              <p className="text-sm text-gray-400">Estado da Instituição</p>
              <p className="font-medium text-white capitalize">{institution.status === "approved" ? "Aprovada" : institution.status === "pending" ? "Pendente" : "Suspensa"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
