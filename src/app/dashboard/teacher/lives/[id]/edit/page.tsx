"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, Radio, Calendar, Type, AlignLeft,
  Image as ImageIcon, Loader2, Save, AlertCircle, DollarSign,
} from "lucide-react";
import Link from "next/link";
import MaterialEditor from "@/components/shared/MaterialEditor";
import type { LiveTarget, LiveSession } from "@/types/live";
import type { CourseMaterial } from "@/types/course";

export default function TeacherEditLivePage() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [target, setTarget] = useState<LiveTarget>("smart");
  const [price, setPrice] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [original, setOriginal] = useState<LiveSession | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "lives", id));
        if (!snap.exists()) { router.replace("/dashboard/teacher/lives"); return; }
        const data = snap.data() as LiveSession;
        if (data.createdBy !== user.uid) { router.replace("/dashboard/teacher/lives"); return; }
        setOriginal(data);
        setTitle(data.title);
        setDescription(data.description || "");
        const sa = data.scheduledAt;
        if (sa) {
          const d = typeof sa === "object" && "toDate" in sa ? (sa as { toDate: () => Date }).toDate() : new Date(sa as string);
          setScheduledAt(d.toISOString().slice(0, 16));
        }
        setTarget(data.target || "smart");
        setPrice(data.price ? String(data.price) : "");
        setThumbnail(data.thumbnail || "");
        setMaterials(data.materials || []);
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar live.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, id, router]);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumb(true);
    try {
      const { auth } = await import("@/lib/firebase");
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
      console.error(err);
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
      await updateDoc(doc(db, "lives", id), {
        title,
        description,
        thumbnail,
        scheduledAt,
        target,
        price: target === "standalone" && price ? Number(price) : null,
        materials,
        updatedAt: serverTimestamp(),
      });
      router.push("/dashboard/teacher/lives");
    } catch (err) {
      console.error(err);
      setError("Erro ao guardar alterações.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-green-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/teacher/lives"
          className="flex items-center justify-center h-10 w-10 bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Radio className="h-6 w-6 text-blue-400" />
            Editar Aula ao Vivo
          </h1>
          <p className="text-sm text-gray-400 mt-1">Atualiza os detalhes da tua sessão.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300"><Type className="h-4 w-4 text-gray-500" /> Título</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Ex: Introdução ao React — Aula ao Vivo"
            className="w-full bg-gray-900/60 border border-gray-800 px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" required />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300"><AlignLeft className="h-4 w-4 text-gray-500" /> Descrição</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Descreva o que será abordado..." rows={4}
            className="w-full bg-gray-900/60 border border-gray-800 px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none" />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300"><Calendar className="h-4 w-4 text-gray-500" /> Data e Hora</label>
          <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
            className="w-full bg-gray-900/60 border border-gray-800 px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]" required />
        </div>

        {target === "standalone" && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300"><DollarSign className="h-4 w-4 text-gray-500" /> Preço (Kz)</label>
            <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)}
              placeholder="Ex: 5000"
              className="w-full bg-gray-900/60 border border-gray-800 px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
        )}

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300"><ImageIcon className="h-4 w-4 text-gray-500" /> Thumbnail</label>
          {thumbnail ? (
            <div className="relative group">
               <img src={thumbnail} alt="Thumbnail da aula ao vivo" className="w-full h-48 object-cover" />
              <button type="button" onClick={() => setThumbnail("")}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">Remover</button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-700 hover:border-gray-600 bg-gray-900/30 cursor-pointer transition-colors">
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
            {saving ? "A guardar..." : "Guardar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
