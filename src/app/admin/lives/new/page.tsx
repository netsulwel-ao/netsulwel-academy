"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, Loader2, Save, ImagePlus, CheckCircle2, Radio,
  Calendar, Coins,
} from "lucide-react";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import type { LiveTarget } from "@/types/live";

const inputCls =
  "w-full border border-gray-800 bg-gray-900 py-2.5 px-3 text-sm text-gray-200 placeholder-gray-700 focus:border-purple/30 focus:outline-none transition-colors";

const TARGETS: { value: LiveTarget; label: string; desc: string; icon: React.ElementType }[] = [
  { value: "free",       label: "Gratuito",   desc: "Todos os alunos",   icon: Radio  },
  { value: "standalone", label: "Pago",       desc: "Venda avulsa",      icon: Coins  },
];

function generateRoomName(title: string) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
  return `${slug}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function NewLivePage() {
  const router = useRouter();
  const { user, institutionId } = useAuth();

  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [target,      setTarget]      = useState<LiveTarget>("free");
  const [price,       setPrice]       = useState("");
  const [thumbnail,   setThumbnail]   = useState("");
  const [thumbPreview,setThumbPreview]= useState("");
  const [thumbUpload, setThumbUpload] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [error,       setError]       = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleThumb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setThumbPreview(URL.createObjectURL(file));
    setThumbUpload(true);
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
      const res = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ filename: file.name, contentType: file.type, folder: "lives/thumbnails" }),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const { presignedUrl, publicUrl } = await res.json();
      await fetch(presignedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      setThumbnail(publicUrl);
    } catch (err) {
      logger.error("NewLivePage: thumbnail upload failed", err);
      toast.error("Erro ao fazer upload da capa.");
      setThumbPreview("");
    } finally {
      setThumbUpload(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !scheduledAt || !user) {
      setError("Preenche o título e a data/hora.");
      return;
    }
    setSaving(true); setError("");
    try {
      await addDoc(collection(db, "lives"), {
        title: title.trim(),
        description: description.trim(),
        thumbnail,
        scheduledAt,
        target,
        price: target === "standalone" && price ? Number(price) : null,
        status: "scheduled",
        createdBy: user.uid,
        institutionId: institutionId || null,
        hostName: user.displayName || user.email || "Professor",
        roomName: generateRoomName(title),
        participantCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Aula ao vivo criada!");
      setSuccess(true);
      setTimeout(() => router.push("/admin/lives"), 1200);
    } catch (err) {
      logger.error("NewLivePage: create failed", err);
      setError("Erro ao criar a live. Tenta novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="flex h-16 w-16 items-center justify-center border border-green/25 bg-green/8">
          <CheckCircle2 className="h-7 w-7 text-green/70" strokeWidth={1.5} />
        </div>
        <p className="font-mono text-[13px] uppercase tracking-widest text-gray-600">// live criada</p>
        <p className="text-sm text-gray-600">A redirecionar...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-300">

      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin/lives"
          className="flex h-8 w-8 items-center justify-center border border-gray-800 bg-gray-900 text-gray-600 hover:border-gray-700 hover:text-gray-300 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-700">// nova live</p>
          <p className="text-sm font-semibold text-gray-200">{title || "Nova Aula ao Vivo"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Título ── */}
        <div>
          <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-600 mb-2">
            // título <span className="text-red-400/80">*</span>
          </p>
          <input
            type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Ex: Introdução ao React — Aula ao Vivo"
            required className={inputCls}
          />
        </div>

        {/* ── Descrição ── */}
        <div>
          <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-600 mb-2">// descrição</p>
          <textarea
            rows={3} value={description} onChange={e => setDescription(e.target.value)}
            placeholder="O que será abordado nesta aula..."
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* ── Data/hora ── */}
        <div>
          <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-600 mb-2">
            // data e hora <span className="text-red-400/80">*</span>
          </p>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-700 pointer-events-none" strokeWidth={1.5} />
            <input
              type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
              required className={`${inputCls} pl-9 [color-scheme:dark]`}
            />
          </div>
        </div>

        {/* ── Plano de acesso ── */}
        <div>
          <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-600 mb-2">// plano de acesso</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TARGETS.map(({ value, label, desc, icon: Icon }) => (
              <button
                key={value} type="button" onClick={() => setTarget(value)}
                className={`flex flex-col gap-2 p-4 border text-left transition-all ${
                  target === value
                    ? "border-purple/40 bg-purple/8"
                    : "border-gray-800 bg-gray-900 hover:border-gray-700"
                }`}
              >
                <Icon className={`h-4 w-4 ${target === value ? "text-purple/70" : "text-gray-600"}`} strokeWidth={1.5} />
                <div>
                  <p className={`text-sm font-semibold ${target === value ? "text-purple/80" : "text-gray-400"}`}>{label}</p>
                  <p className="font-mono text-[13px] text-gray-700 mt-0.5">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Preço (standalone) ── */}
        {target === "standalone" && (
          <div>
            <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-600 mb-2">
              // preço (Kz) <span className="text-red-400/80">*</span>
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-gray-600">Kz</span>
              <input
                type="number" min="0" value={price} onChange={e => setPrice(e.target.value)}
                placeholder="Ex: 5000" required
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>
        )}

        {/* ── Thumbnail ── */}
        <div>
          <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-600 mb-2">// capa (opcional)</p>
          <div
            role="button" tabIndex={0} aria-label="Carregar capa"
            onClick={() => inputRef.current?.click()}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
            className="relative w-full aspect-video border border-gray-800 bg-gray-900 cursor-pointer overflow-hidden group hover:border-purple/30 transition-colors"
          >
            {thumbPreview ? (
              <>
                <img src={thumbPreview} alt="preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gray-950 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ImagePlus className="h-7 w-7 text-white" strokeWidth={1.5} />
                </div>
                {thumbUpload && (
                  <div className="absolute inset-0 bg-gray-950 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-purple" />
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-700 group-hover:text-gray-500 transition-colors">
                <ImagePlus className="h-8 w-8" strokeWidth={1} />
                <span className="font-mono text-[13px] uppercase tracking-widest">Clique para carregar</span>
                <span className="font-mono text-[8px] text-gray-700">PNG, JPG, WEBP</span>
              </div>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleThumb} disabled={thumbUpload} />
        </div>

        {/* ── Erro ── */}
        {error && (
          <div className="border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400/80">
            {error}
          </div>
        )}

        {/* ── Acções ── */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <Link href="/admin/lives" className="font-mono text-[13px] uppercase tracking-widest text-gray-700 hover:text-gray-400 transition-colors">
            ← Cancelar
          </Link>
          <button
            type="submit" disabled={saving || thumbUpload}
            className="flex items-center gap-1.5 border border-red-500/30 bg-red-500/8 px-5 py-2.5 font-mono text-[13px] uppercase tracking-widest text-red-400/80 hover:bg-red-500/15 disabled:opacity-40 transition-all"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            {saving ? "A criar..." : "Criar Live"}
          </button>
        </div>
      </form>
    </div>
  );
}
