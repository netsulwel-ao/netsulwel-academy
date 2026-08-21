"use client";

import { useState, useRef } from "react";
import { auth } from "@/lib/firebase";
import { Plus, X, UploadCloud, Link as LinkIcon, Loader2, FileText } from "lucide-react";
import type { CourseMaterial, MaterialType } from "@/types/course";

const MATERIAL_TYPES: { value: MaterialType; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "doc", label: "Documento" },
  { value: "link", label: "Link" },
  { value: "image", label: "Imagem" },
  { value: "video", label: "Vídeo" },
  { value: "other", label: "Outro" },
];

async function uploadMaterial(file: File): Promise<string> {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
  const res = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ filename: file.name, contentType: file.type, folder: "materials" }),
  });
  if (!res.ok) throw new Error("Falha ao obter URL.");
  const { presignedUrl, publicUrl } = await res.json();
  const up = await fetch(presignedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!up.ok) throw new Error("Falha ao enviar.");
  return publicUrl;
}

interface MaterialEditorProps {
  materials: CourseMaterial[];
  onChange: (materials: CourseMaterial[]) => void;
}

export default function MaterialEditor({ materials, onChange }: MaterialEditorProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<MaterialType>("pdf");
  const [url, setUrl] = useState("");
  const [urlMode, setUrlMode] = useState<"upload" | "link">("link");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const publicUrl = await uploadMaterial(file);
      const mat: CourseMaterial = {
        title: title || file.name,
        type,
        url: publicUrl,
        filename: file.name,
        size: file.size,
      };
      onChange([...materials, mat]);
      setTitle("");
      setUrl("");
      setUrlMode("link");
    } catch {
      setError("Erro ao enviar ficheiro.");
    } finally {
      setUploading(false);
    }
  };

  const addLink = () => {
    if (!url.trim()) return;
    const mat: CourseMaterial = { title: title || url.trim(), type, url: url.trim() };
    onChange([...materials, mat]);
    setTitle("");
    setUrl("");
  };

  const remove = (idx: number) => {
    onChange(materials.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-400 transition-colors">
        <FileText className="h-3.5 w-3.5" />
        Materiais ({materials.length})
        <span className="text-gray-600">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="space-y-2 pl-4 border-l border-gray-800">
          {materials.length > 0 && (
            <div className="space-y-1">
              {materials.map((mat, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-3 py-2 text-sm text-gray-300 group">
                  <FileText className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span className="truncate flex-1">{mat.title || mat.filename}</span>
                  <span className="text-gray-600 shrink-0 uppercase text-[13px]">{mat.type}</span>
                  <button type="button" onClick={() => remove(i)}
                    className="p-0.5 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Nome do material"
              className="flex-1 bg-gray-900 border border-gray-800 px-2.5 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
            <select value={type} onChange={e => setType(e.target.value as MaterialType)}
              className="w-24 bg-gray-900 border border-gray-800 px-2 py-1.5 text-sm text-white focus:outline-none">
              {MATERIAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="flex items-start gap-2">
            <div className="flex border border-gray-800 overflow-hidden shrink-0">
              <button type="button" onClick={() => setUrlMode("link")}
                className={`px-2.5 py-1.5 text-[13px] font-medium transition-colors ${urlMode === "link" ? "bg-purple text-white" : "bg-gray-900 text-gray-500 hover:text-gray-300"}`}>
                <LinkIcon className="w-3 h-3" />
              </button>
              <button type="button" onClick={() => setUrlMode("upload")}
                className={`px-2.5 py-1.5 text-[13px] font-medium transition-colors ${urlMode === "upload" ? "bg-purple text-white" : "bg-gray-900 text-gray-500 hover:text-gray-300"}`}>
                <UploadCloud className="w-3 h-3" />
              </button>
            </div>

            {urlMode === "link" ? (
              <div className="flex-1 flex gap-1">
                <input type="text" value={url} onChange={e => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-gray-900 border border-gray-800 px-2.5 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
                <button type="button" onClick={addLink} disabled={!url.trim()}
                  className="px-2.5 py-1.5 bg-purple text-white text-sm font-medium disabled:opacity-40 flex items-center gap-1">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex-1">
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-700 hover:border-blue-500/50 bg-gray-900 py-2 text-[13px] text-gray-400 hover:text-blue-400 transition-colors">
                  {uploading ? <><Loader2 className="w-3 h-3 animate-spin" /> A enviar...</> : <><UploadCloud className="w-3.5 h-3.5" /> Carregar ficheiro</>}
                </button>
                <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
