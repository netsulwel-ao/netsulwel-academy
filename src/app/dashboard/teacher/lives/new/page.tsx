"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, Radio, Calendar, Type, AlignLeft,
  Image as ImageIcon, Target, Loader2, Save, Sparkles, AlertCircle, MailQuestion, CheckCircle2, DollarSign,
} from "lucide-react";
import Link from "next/link";
import { logger } from "@/lib/logger";
import MaterialEditor from "@/components/shared/MaterialEditor";
import type { LiveTarget } from "@/types/live";
import type { CourseMaterial } from "@/types/course";

export default function TeacherNewLivePage() {
  const router = useRouter();
  const { user, institutionId } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [target, setTarget] = useState<LiveTarget>("free");
  const [price, setPrice] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);

  const generateRoomName = (title: string) => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
    const id = Math.random().toString(36).substring(2, 8);
    return `${slug}-${id}`;
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumb(true);
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
      const res = await fetch("/api/upload/presign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ filename: file.name, contentType: file.type, folder: "lives/thumbnails" }),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const { presignedUrl, publicUrl } = await res.json();
      await fetch(presignedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      setThumbnail(publicUrl);
    } catch (err) {
      logger.error("NewLive: thumbnail upload failed", err);
      setError("Erro ao fazer upload da thumbnail.");
    } finally {
      setUploadingThumb(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title || !scheduledAt || !user) { setError("Preencha o título e a data/hora."); return; }
    setSaving(true);
    try {
      const roomName = generateRoomName(title);
      await addDoc(collection(db, "lives"), {
        title, description, thumbnail, scheduledAt, target,
        price: target === "standalone" && price ? Number(price) : null,
        status: "scheduled", createdBy: user.uid,
        institutionId: institutionId || null,
        hostName: user.displayName || user.email || "Professor",
        roomName, participantCount: 0, materials,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      router.push("/dashboard/teacher/lives");
    } catch (err) {
      logger.error("NewLive: failed to create", err);
      setError("Erro ao criar a live.");
    } finally {
      setSaving(false);
    }
  };

  const TARGET_OPTIONS: { value: LiveTarget; label: string; desc: string; color: string }[] = [
    { value: "standalone", label: "Pago", desc: "Venda avulsa", color: "border-green-500/30 bg-green-500/5 hover:bg-green-500/10 data-[active=true]:border-green-500 data-[active=true]:bg-green-500/15" },
  ];

  const handleRequestFreeLive = async () => {
    if (!title || !scheduledAt || !user) { setError("Preencha o título e a data primeiro."); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, "freeLiveRequests"), {
        teacherId: user.uid,
        teacherName: user.displayName || user.email || "Professor",
        title,
        description,
        scheduledAt,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setRequestSent(true);
    } catch (err) {
      logger.error("NewLive: failed to send free request", err);
      setError("Erro ao enviar pedido.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/teacher/lives"
          className="flex items-center justify-center h-10 w-10 bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-blue-400" />
            Nova Aula ao Vivo
          </h1>
          <p className="text-sm text-gray-400 mt-1">Agende uma nova sessão em direto.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300"><Type className="h-4 w-4 text-gray-500" /> Título *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Ex: Introdução ao React — Aula ao Vivo"
            className="w-full bg-gray-900 border border-gray-800 px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" required />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300"><AlignLeft className="h-4 w-4 text-gray-500" /> Descrição</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Descreva o que será abordado..." rows={4}
            className="w-full bg-gray-900 border border-gray-800 px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none" />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300"><Calendar className="h-4 w-4 text-gray-500" /> Data e Hora *</label>
          <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]" required />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300"><Target className="h-4 w-4 text-gray-500" /> Público-alvo</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TARGET_OPTIONS.map(opt => (
              <button key={opt.value} type="button" data-active={target === opt.value} onClick={() => setTarget(opt.value)}
                className={`p-4 border text-left transition-all ${opt.color}`}>
                <span className="text-sm font-bold text-white">{opt.label}</span>
                <span className="block text-sm text-gray-400 mt-1">{opt.desc}</span>
              </button>
            ))}
          </div>
          {/* Free live info */}
          {!requestSent ? (
            <div className="mt-3 p-4 border border-dashed border-gray-700 bg-gray-900">
              <div className="flex items-start gap-3">
                <MailQuestion className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-400">
                    Queres criar uma <span className="text-white font-bold">Live Gratuita</span>?
                    Os professores precisam de autorização do administrador.
                  </p>
                  <button type="button" onClick={handleRequestFreeLive} disabled={saving}
                    className="mt-2 text-sm text-green-400 hover:text-green-300 font-bold transition-colors">
                    {saving ? "A enviar..." : "Solicitar autorização →"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 p-4 border border-green-500/20 bg-green-500/5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                <p className="text-sm text-green-300">Pedido enviado! O administrador irá analisar e responder brevemente.</p>
              </div>
            </div>
          )}
        </div>

        {target === "standalone" && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300"><DollarSign className="h-4 w-4 text-gray-500" /> Preço (Kz) *</label>
            <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)}
              placeholder="Ex: 5000"
              className="w-full bg-gray-900 border border-gray-800 px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" required />
          </div>
        )}

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300"><ImageIcon className="h-4 w-4 text-gray-500" /> Thumbnail</label>
          {thumbnail ? (
            <div className="relative group">
               <img src={thumbnail} alt="Pré-visualização da thumbnail" className="w-full h-48 object-cover" />
              <button type="button" onClick={() => setThumbnail("")}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">Remover</button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-700 hover:border-gray-600 bg-gray-900 cursor-pointer transition-colors">
              {uploadingThumb ? <Loader2 className="h-8 w-8 animate-spin text-green-400" />
                : <><ImageIcon className="h-8 w-8 text-gray-600 mb-2" /><span className="text-sm text-gray-500">Clique para enviar uma imagem</span></>}
              <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" disabled={uploadingThumb} />
            </label>
          )}
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300"><ImageIcon className="h-4 w-4 text-gray-500" /> Materiais de Apoio</label>
          <MaterialEditor materials={materials} onChange={setMaterials} />
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-gray-800">
          <Link href="/dashboard/teacher/lives" className="px-6 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors">Cancelar</Link>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-green hover:bg-green-light disabled:bg-blue-800 disabled:opacity-50 text-white px-6 py-3 font-bold transition-colors ml-auto">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {saving ? "A criar..." : "Criar Live"}
          </button>
        </div>
      </form>
    </div>
  );
}
