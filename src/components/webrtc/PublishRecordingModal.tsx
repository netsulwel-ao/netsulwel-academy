"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection, addDoc, serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { X, Loader2, CheckCircle2 } from "lucide-react";

interface PublishRecordingModalProps {
  liveId: string;
  liveTitle: string;
  liveDescription?: string;
  liveThumbnail?: string;
  recordingUrl: string;
  recordingDuration: number;
  onClose: () => void;
}

const LEVELS = [
  { value: "beginner", label: "Iniciante" },
  { value: "intermediate", label: "Intermédio" },
  { value: "advanced", label: "Avançado" },
];

const CATEGORIES = [
  { value: "tech", label: "Tecnologia" },
  { value: "finance", label: "Finanças" },
  { value: "investments", label: "Investimentos" },
  { value: "other", label: "Outro" },
];

export function PublishRecordingModal({
  liveId,
  liveTitle,
  liveDescription = "",
  liveThumbnail = "",
  recordingUrl,
  recordingDuration,
  onClose,
}: PublishRecordingModalProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState(liveTitle);
  const [description, setDescription] = useState(liveDescription);
  const [level, setLevel] = useState("beginner");
  const [category, setCategory] = useState("other");
  const [price, setPrice] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<"draft" | "published" | null>(null);

  const formatDurationStr = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? String(h).padStart(2, "0") + ":" : ""}${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleSave = async (status: "draft" | "published") => {
    if (!title.trim() || !user) return;
    setSaving(true);

    try {
      const durationStr = formatDurationStr(recordingDuration);

      const courseData = {
        title: title.trim(),
        description: description.trim(),
        thumbnail: liveThumbnail,
        price,
        type: "standalone",
        format: "recorded",
        level,
        category,
        hasCertificate: false,
        featured: false,
        tags: [],
        modules: [
          {
            title: "Aula Gravada",
            videos: [
              {
                title: title.trim(),
                url: recordingUrl,
                duration: durationStr,
                materials: [],
                exercises: [],
              },
            ],
          },
        ],
        modulesCount: 1,
        lessonsCount: 1,
        status,
        createdBy: user.uid,
        institutionId: (user as unknown as Record<string, unknown>).institutionId || null,
        sourceLiveId: liveId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const courseRef = await addDoc(collection(db, "courses"), courseData);

      setSaved(status);

      setTimeout(() => {
        if (status === "published") {
          router.push(`/admin/courses/${courseRef.id}/edit`);
        } else {
          router.push("/admin/courses");
        }
      }, 1500);
    } catch (err) {
      console.error("Error publishing recording:", err);
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
        <div className="bg-gray-900 border border-gray-800 p-8 max-w-sm w-full text-center">
          <CheckCircle2 className="h-12 w-12 text-green mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">
            {saved === "published" ? "Aula Publicada!" : "Rascunho Guardado!"}
          </h3>
          <p className="text-sm text-gray-400">
            {saved === "published"
              ? "A aula foi publicada e está disponível no catálogo."
              : "O rascunho foi guardado. Podes editar e publicar depois."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-gray-900 border border-gray-800 max-w-lg w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h3 className="text-base font-bold text-white">Publicar como Aula</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Duração: {formatDurationStr(recordingDuration)}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white px-3 py-2.5 text-sm focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple"
              placeholder="Nome da aula"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 text-white px-3 py-2.5 text-sm focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple resize-none"
              placeholder="Descreve o conteúdo da aula..."
            />
          </div>

          {/* Level + Category row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Nível</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white px-3 py-2.5 text-sm focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple"
              >
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white px-3 py-2.5 text-sm focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Preço (Kz)</label>
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 text-white px-3 py-2.5 text-sm focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple"
            />
            <p className="text-xs text-gray-600 mt-1">0 = Gratuito</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleSave("draft")}
            disabled={saving || !title.trim()}
            className="px-4 py-2 bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Rascunho
          </button>
          <button
            onClick={() => handleSave("published")}
            disabled={saving || !title.trim()}
            className="px-4 py-2 bg-purple text-white text-sm font-bold hover:bg-purple-light transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Publicar
          </button>
        </div>
      </div>
    </div>
  );
}
