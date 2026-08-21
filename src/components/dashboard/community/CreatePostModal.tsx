"use client";

import { useState } from "react";
import { X, ImagePlus, Loader2, AlertCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import PostTypeBadge from "./PostTypeBadge";
import type { CommunityPostType } from "@/types/community";

const TYPES: CommunityPostType[] = ["duvida", "projeto", "discussao", "dica"];

async function uploadToR2(file: File, token: string): Promise<string> {
  const res = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ filename: file.name, contentType: file.type, folder: "community" }),
  });
  if (!res.ok) throw new Error("Falha ao obter URL.");
  const { presignedUrl, publicUrl } = await res.json();
  const up = await fetch(presignedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!up.ok) throw new Error("Falha ao enviar.");
  return publicUrl;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreatePostModal({ open, onClose, onCreated }: Props) {
  const { user } = useAuth();
  const [type, setType] = useState<CommunityPostType>("duvida");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [tagsInput, setTagsInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files].slice(0, 4));
  };

  const removeImage = (i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !user) return;
    setError("");
    setSubmitting(true);

    try {
      setUploading(true);
      const token = await user.getIdToken();
      const uploaded = await Promise.all(images.map((f) => uploadToR2(f, token)));
      setUploading(false);

      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await addDoc(collection(db, "community"), {
        authorId: user.uid,
        authorName: user.displayName || "Utilizador",
        authorPhoto: user.photoURL || "",
        type,
        title: title.trim(),
        content: content.trim(),
        images: uploaded,
        tags,
        likesCount: 0,
        commentsCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      onCreated();
      onClose();
      setTitle("");
      setContent("");
      setImages([]);
      setTagsInput("");
      setType("duvida");
    } catch (err) {
      console.error(err);
      setError("Erro ao publicar. Tenta novamente.");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black"
      role="dialog" aria-modal="true" aria-labelledby="create-post-title"
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}>
      <div className="w-full max-w-lg bg-gray-900 border border-gray-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 id="create-post-title" className="text-xl font-bold text-white">Nova Publicação</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Type selector */}
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">Tipo</label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`transition-colors ${type === t ? "ring-2 ring-purple" : "opacity-60 hover:opacity-100"}`}
                >
                  <PostTypeBadge type={t} />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Como resolver erro X?"
              className="w-full border border-gray-700 bg-gray-950 py-2.5 px-3 text-white placeholder-gray-600 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple"
            />
          </div>

          {/* Content */}
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">Conteúdo</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreve o teu post..."
              rows={5}
              className="w-full border border-gray-700 bg-gray-950 py-2.5 px-3 text-white placeholder-gray-600 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple resize-y"
            />
          </div>

          {/* Images */}
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">
              Imagens {images.length > 0 && `(${images.length}/4)`}
            </label>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {images.map((file, i) => (
                  <div key={i} className="relative group">
                     <img src={URL.createObjectURL(file)} alt={`Imagem ${i + 1}`} className="h-16 w-16 object-cover rounded" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {images.length < 4 && (
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-400 hover:text-white transition-colors">
                <ImagePlus className="h-5 w-5" />
                Adicionar imagem
                <input type="file" accept="image/*" onChange={handleImageAdd} className="hidden" />
              </label>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">
              Tags <span className="text-gray-600 font-normal">(separadas por vírgula)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Ex: react, javascript, iniciante"
              className="w-full border border-gray-700 bg-gray-950 py-2.5 px-3 text-white placeholder-gray-600 transition-colors focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim() || submitting || uploading}
            className="w-full bg-purple hover:bg-purple-light text-white py-3 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting || uploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {uploading ? "A enviar imagens..." : "A publicar..."}
              </>
            ) : (
              "Publicar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
