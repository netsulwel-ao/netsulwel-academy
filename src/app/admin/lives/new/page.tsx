"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  Radio,
  Calendar,
  Type,
  AlignLeft,
  Image as ImageIcon,
  Target,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { LiveTarget } from "@/types/live";

export default function NewLivePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [target, setTarget] = useState<LiveTarget>("free");
  const [thumbnail, setThumbnail] = useState("");
  const [uploadingThumb, setUploadingThumb] = useState(false);

  const generateRoomName = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30);
    const id = Math.random().toString(36).substring(2, 8);
    return `${slug}-${id}`;
  };

  const handleThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingThumb(true);
    try {
      const res = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          folder: "lives/thumbnails",
        }),
      });

      const { presignedUrl, publicUrl } = await res.json();

      await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      setThumbnail(publicUrl);
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      alert("Erro ao fazer upload da thumbnail.");
    } finally {
      setUploadingThumb(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !scheduledAt || !user) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    setSaving(true);
    try {
      const roomName = generateRoomName(title);

      await addDoc(collection(db, "lives"), {
        title,
        description,
        thumbnail,
        scheduledAt,
        target,
        status: "scheduled",
        hostUid: user.uid,
        roomName,
        participantCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      router.push("/admin/lives");
    } catch (err) {
      console.error("Erro ao criar live:", err);
      alert("Erro ao criar a live.");
    } finally {
      setSaving(false);
    }
  };

  const TARGET_OPTIONS: { value: LiveTarget; label: string; desc: string; color: string }[] = [
    {
      value: "free",
      label: "Gratuito",
      desc: "Todos os alunos",
      color: "border-green-500/30 bg-green-500/5 hover:bg-green-500/10 data-[active=true]:border-green-500 data-[active=true]:bg-green-500/15",
    },
    {
      value: "smart",
      label: "Smart",
      desc: "Plano Smart+",
      color: "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 data-[active=true]:border-blue-500 data-[active=true]:bg-blue-500/15",
    },
    {
      value: "golden",
      label: "Golden",
      desc: "Plano Golden",
      color: "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 data-[active=true]:border-amber-500 data-[active=true]:bg-amber-500/15",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/lives"
          className="flex items-center justify-center h-10 w-10 bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-blue-400" />
            Nova Aula ao Vivo
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Agende uma nova sessão em direto para os seus alunos.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
            <Type className="h-4 w-4 text-gray-500" />
            Título *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Introdução ao React — Aula ao Vivo"
            className="w-full bg-gray-900/60 border border-gray-800 px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
            <AlignLeft className="h-4 w-4 text-gray-500" />
            Descrição
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o que será abordado nesta aula..."
            rows={4}
            className="w-full bg-gray-900/60 border border-gray-800 px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
          />
        </div>

        {/* Date & Time */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
            <Calendar className="h-4 w-4 text-gray-500" />
            Data e Hora *
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full bg-gray-900/60 border border-gray-800 px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
            required
          />
        </div>

        {/* Target */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
            <Target className="h-4 w-4 text-gray-500" />
            Público-alvo
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TARGET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                data-active={target === opt.value}
                onClick={() => setTarget(opt.value)}
                className={`p-4 border text-left transition-all ${opt.color}`}
              >
                <span className="text-sm font-bold text-white">
                  {opt.label}
                </span>
                <span className="block text-xs text-gray-400 mt-1">
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Thumbnail */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
            <ImageIcon className="h-4 w-4 text-gray-500" />
            Thumbnail
          </label>
          {thumbnail ? (
            <div className="relative group">
              <img
                src={thumbnail}
                alt="Thumbnail"
                className="w-full h-48 object-cover"
              />
              <button
                type="button"
                onClick={() => setThumbnail("")}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Remover
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-700 hover:border-gray-600 bg-gray-900/30 cursor-pointer transition-colors">
              {uploadingThumb ? (
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-gray-600 mb-2" />
                  <span className="text-sm text-gray-500">
                    Clique para enviar uma imagem
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                className="hidden"
                disabled={uploadingThumb}
              />
            </label>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-800">
          <Link
            href="/admin/lives"
            className="px-6 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white px-6 py-3 font-bold transition-colors ml-auto"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            {saving ? "A criar..." : "Criar Live"}
          </button>
        </div>
      </form>
    </div>
  );
}
