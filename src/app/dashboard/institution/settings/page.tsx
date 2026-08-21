"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  Building2, Loader2, Save, Mail, Phone,
  MapPin, Globe, Image as ImageIcon, AlignLeft,
} from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { ImageCropModal } from "@/components/ImageCropModal";
import { logger } from "@/lib/logger";
import type { Institution } from "@/types/institution";

const inputCls =
  "w-full border border-gray-800 bg-gray-900 py-2.5 px-3 text-sm text-gray-200 placeholder-gray-700 focus:border-purple/30 focus:outline-none transition-colors";

export default function InstitutionSettingsPage() {
  const { user, institutionId } = useAuth();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", address: "", description: "", website: "",
  });
  const [logo,      setLogo]      = useState("");
  const [banner,    setBanner]    = useState("");
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropMode,  setCropMode]  = useState<"logo" | "banner" | null>(null);
  const logoInputRef   = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const loadInstitution = useCallback(async () => {
    if (!institutionId) return;
    try {
      const snap = await getDoc(doc(db, "institutions", institutionId));
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Institution;
        setInstitution(data);
        setForm({
          name: data.name, email: data.email,
          phone: data.phone || "", address: data.address || "",
          description: data.description || "", website: data.website || "",
        });
        setLogo(data.logo || "");
        setBanner(data.banner || "");
      }
    } catch (err) {
      logger.error("InstitutionSettings: failed to load", err, { institutionId });
      toast.error("Erro ao carregar os dados da instituição.");
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => { loadInstitution(); }, [loadInstitution]);

  const handleCropConfirm = async (blob: Blob) => {
    if (!cropMode || !user) return;
    try {
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
    } catch (err) {
      logger.error("InstitutionSettings: image upload failed", err, { cropMode });
      toast.error("Erro ao fazer upload da imagem.");
    } finally {
      setCropImage(null); setCropMode(null);
    }
  };

  const handleSave = async () => {
    if (!institutionId) return;
    setSaving(true);
    try {
      const res = await fetchWithAuth(`/api/institutions/${institutionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, logo, banner }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Instituição actualizada com sucesso.");
      loadInstitution();
    } catch (err) {
      logger.error("InstitutionSettings: save failed", err, { institutionId });
      toast.error("Erro ao actualizar a instituição.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="h-8 w-48 bg-gray-800 animate-pulse" />
        <div className="h-96 bg-gray-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
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

      {/* ── Cabeçalho ── */}
      <div>
        <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-purple/60 mb-2">// definições</p>
        <h1 className="text-2xl font-bold text-gray-100">Definições</h1>
        <p className="mt-1 text-sm text-gray-600">Personaliza a página pública da tua instituição.</p>
      </div>

      {/* ── Estado da instituição ── */}
      {institution && (
        <div className="flex items-center gap-3 border border-gray-800 bg-gray-900 px-4 py-3">
          <span className={`h-2 w-2 shrink-0 ${
            institution.status === "approved" ? "bg-green-400"
            : institution.status === "pending"  ? "bg-amber-400 animate-pulse"
            : "bg-red-400"
          }`} />
          <div>
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-600">Estado</p>
            <p className="text-sm text-gray-300">
              {institution.status === "approved" ? "Aprovada e activa"
               : institution.status === "pending"  ? "A aguardar aprovação"
               : "Suspensa — contacta a administração"}
            </p>
          </div>
        </div>
      )}

      {/* ── Formulário ── */}
      <div className="border border-gray-800 bg-gray-900 p-6 space-y-6">
        <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 pb-4 border-b border-gray-800">
          // informação da instituição
        </p>

        {/* Logo + Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-600 mb-2">// logótipo</p>
            {logo ? (
              <div className="relative group w-24 h-24">
                <img src={logo} alt="Logótipo" className="w-24 h-24 object-cover border border-gray-800" />
                <button
                  type="button" onClick={() => setLogo("")}
                  className="absolute top-1 right-1 border border-red-500/30 bg-gray-950 px-2 py-0.5 font-mono text-[8px] text-red-400/80 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Remover
                </button>
              </div>
            ) : (
              <button
                type="button" onClick={() => logoInputRef.current?.click()}
                className="flex h-24 w-24 flex-col items-center justify-center border border-dashed border-gray-700 bg-gray-900 hover:border-purple/30 transition-colors cursor-pointer"
              >
                <ImageIcon className="h-6 w-6 text-gray-700 mb-1" strokeWidth={1} />
                <span className="font-mono text-[8px] text-gray-700">Logo</span>
              </button>
            )}
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
              const f = e.target.files?.[0]; if (f) { setCropImage(URL.createObjectURL(f)); setCropMode("logo"); }
            }} />
          </div>

          <div>
            <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-600 mb-2">// banner</p>
            {banner ? (
              <div className="relative group">
                <img src={banner} alt="Banner" className="w-full h-20 object-cover border border-gray-800" />
                <button
                  type="button" onClick={() => setBanner("")}
                  className="absolute top-1 right-1 border border-red-500/30 bg-gray-950 px-2 py-0.5 font-mono text-[8px] text-red-400/80 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Remover
                </button>
              </div>
            ) : (
              <button
                type="button" onClick={() => bannerInputRef.current?.click()}
                className="flex h-20 w-full flex-col items-center justify-center border border-dashed border-gray-700 bg-gray-900 hover:border-purple/30 transition-colors cursor-pointer"
              >
                <ImageIcon className="h-5 w-5 text-gray-700 mb-1" strokeWidth={1} />
                <span className="font-mono text-[8px] text-gray-700">Banner 1200×340</span>
              </button>
            )}
            <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
              const f = e.target.files?.[0]; if (f) { setCropImage(URL.createObjectURL(f)); setCropMode("banner"); }
            }} />
          </div>
        </div>

        {/* Campos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-600 mb-2 flex items-center gap-1.5">
              <Building2 className="h-3 w-3" strokeWidth={1.5} /> Nome da Instituição
            </p>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </div>

          <div>
            <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-600 mb-2 flex items-center gap-1.5">
              <Mail className="h-3 w-3" strokeWidth={1.5} /> Email
            </p>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
          </div>

          <div>
            <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-600 mb-2 flex items-center gap-1.5">
              <Phone className="h-3 w-3" strokeWidth={1.5} /> Telefone
            </p>
            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+244 XXX XXX XXX" className={inputCls} />
          </div>

          <div className="sm:col-span-2">
            <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-600 mb-2 flex items-center gap-1.5">
              <MapPin className="h-3 w-3" strokeWidth={1.5} /> Morada
            </p>
            <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Morada da instituição" className={inputCls} />
          </div>

          <div className="sm:col-span-2">
            <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-600 mb-2 flex items-center gap-1.5">
              <AlignLeft className="h-3 w-3" strokeWidth={1.5} /> Descrição
            </p>
            <textarea
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Sobre a instituição..." rows={4}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="sm:col-span-2">
            <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-600 mb-2 flex items-center gap-1.5">
              <Globe className="h-3 w-3" strokeWidth={1.5} /> Website
            </p>
            <input type="url" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://..." className={inputCls} />
          </div>
        </div>

        {/* Guardar */}
        <div className="pt-4 border-t border-gray-800 flex justify-end">
          <button
            onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 border border-purple/25 bg-purple/8 px-6 py-2.5 font-mono text-[13px] uppercase tracking-widest text-purple/80 hover:bg-purple/15 disabled:opacity-40 transition-all"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            {saving ? "A guardar..." : "Guardar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}
