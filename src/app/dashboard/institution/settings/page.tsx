"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Building2, Loader2, Save, Mail, Phone, MapPin, Globe, Image as ImageIcon, AlignLeft } from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { ImageCropModal } from "@/components/ImageCropModal";
import type { Institution } from "@/types/institution";

export default function InstitutionSettingsPage() {
  const { user, institutionId } = useAuth();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", description: "", website: "" });
  const [logo, setLogo] = useState("");
  const [banner, setBanner] = useState("");
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropMode, setCropMode] = useState<"logo" | "banner" | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

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
        setForm({ name: data.name, email: data.email, phone: data.phone || "", address: data.address || "", description: data.description || "", website: data.website || "" });
        setLogo(data.logo || "");
        setBanner(data.banner || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCropConfirm = async (blob: Blob) => {
    if (!cropMode || !user) return;
    const { auth } = await import("@/lib/firebase");
    const token = await auth.currentUser?.getIdToken();
    const contentType = blob.type || "image/png";
    const ext = contentType === "image/png" ? "png" : "webp";
    const folder = cropMode === "logo" ? "institutions/logos" : "institutions/banners";
    const res = await fetch("/api/upload/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ filename: `${cropMode}.${ext}`, contentType, folder }),
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    const { presignedUrl, publicUrl } = await res.json();
    await fetch(presignedUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: blob });
    if (cropMode === "logo") setLogo(publicUrl);
    else setBanner(publicUrl);
    setCropImage(null);
    setCropMode(null);
  };

  const handleSave = async () => {
    if (!institutionId) return;
    setSaving(true);
    try {
      const res = await fetchWithAuth(`/api/institutions/${institutionId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, logo, banner }),
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
      {cropImage && cropMode && (
        <ImageCropModal
          imageUrl={cropImage}
          title={cropMode === "logo" ? "Ajustar logótipo" : "Ajustar banner"}
          aspectRatio={cropMode === "logo" ? 1 : 1200 / 340}
          outputWidth={cropMode === "logo" ? 400 : 1200}
          outputHeight={cropMode === "logo" ? 400 : 340}
          onConfirm={handleCropConfirm}
          onCancel={() => { setCropImage(null); setCropMode(null); }}
        />
      )}

      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-gray-800/60 p-6 sm:p-8">
        <div className="relative flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
            <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Definições</h1>
            <p className="text-sm sm:text-base text-gray-400">Personaliza a página pública da tua instituição</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/70">
        <div className="p-4 sm:p-8 space-y-5 sm:space-y-6">
          <div className="flex items-center gap-3 pb-5 sm:pb-6 border-b border-gray-800/70">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-purple-500/10 flex items-center justify-center">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Informação da Instituição</h2>
              <p className="text-xs sm:text-sm text-gray-400">Gerir os dados principais da instituição</p>
            </div>
          </div>

          {/* Logo + Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Logótipo</label>
              {logo ? (
                <div className="relative group w-32 h-32">
                   <img src={logo} alt="Logótipo da instituição" className="w-32 h-32 object-cover" />
                  <button type="button" onClick={() => { setLogo(""); }}
                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">Remover</button>
                </div>
              ) : (
                <button type="button" onClick={() => logoInputRef.current?.click()}
                  className="w-32 h-32 border-2 border-dashed border-gray-700 hover:border-gray-600 bg-gray-900/30 flex flex-col items-center justify-center cursor-pointer transition-colors">
                  <ImageIcon className="h-8 w-8 text-gray-600 mb-1" />
                  <span className="text-xs text-gray-500">Logo</span>
                </button>
              )}
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files?.[0]; if (f) { setCropImage(URL.createObjectURL(f)); setCropMode("logo"); }
              }} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Banner</label>
              {banner ? (
                <div className="relative group">
                   <img src={banner} alt="Banner da instituição" className="w-full h-24 object-cover" />
                  <button type="button" onClick={() => { setBanner(""); }}
                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">Remover</button>
                </div>
              ) : (
                <button type="button" onClick={() => bannerInputRef.current?.click()}
                  className="w-full h-24 border-2 border-dashed border-gray-700 hover:border-gray-600 bg-gray-900/30 flex flex-col items-center justify-center cursor-pointer transition-colors">
                  <ImageIcon className="h-6 w-6 text-gray-600 mb-1" />
                  <span className="text-xs text-gray-500">Banner 1200×340</span>
                </button>
              )}
              <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files?.[0]; if (f) { setCropImage(URL.createObjectURL(f)); setCropMode("banner"); }
              }} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nome da Instituição</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input type="text" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-gray-800/80 border border-gray-700/50 py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 focus:bg-gray-800 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-gray-800/80 border border-gray-700/50 py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 focus:bg-gray-800 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input type="text" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+244 XXX XXX XXX"
                  className="w-full bg-gray-800/80 border border-gray-700/50 py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 focus:bg-gray-800 transition-all" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Morada</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input type="text" value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="Morada da instituição"
                  className="w-full bg-gray-800/80 border border-gray-700/50 py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 focus:bg-gray-800 transition-all" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Descrição</label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <textarea value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Sobre a instituição..."
                  rows={4}
                  className="w-full bg-gray-800/80 border border-gray-700/50 py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 focus:bg-gray-800 transition-all resize-none" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input type="url" value={form.website}
                  onChange={e => setForm({ ...form, website: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-gray-800/80 border border-gray-700/50 py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple/50 focus:bg-gray-800 transition-all" />
              </div>
            </div>
          </div>

          <div className="pt-5 sm:pt-6 border-t border-gray-800/70 flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold py-2.5 px-8 transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-purple-500/25">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>

      {institution && (
        <div className="bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/70 p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className={`h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full ${institution.status === "approved" ? "bg-green-500" : institution.status === "pending" ? "bg-yellow-500" : "bg-red-500"}`} />
            <div>
              <p className="text-xs sm:text-sm text-gray-400">Estado da Instituição</p>
              <p className="text-sm sm:text-base font-medium text-white capitalize">{institution.status === "approved" ? "Aprovada" : institution.status === "pending" ? "Pendente" : "Suspensa"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}