"use client";

import { useState, useRef, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import {
  Plus, Video, Trash2, Save, ArrowLeft, Loader2, CheckCircle2,
  AlertCircle, ImagePlus, X, GripVertical, UploadCloud,
  Link as LinkIcon, Sparkles, Award, Tag, Radio,
} from "lucide-react";
import Link from "next/link";
import type { Course, CourseModule, VideoItem, CourseType, CourseLevel, CourseCategory, CourseFormat, Trail } from "@/types/course";

// -- Upload helpers ----------------------------------------
async function uploadToR2WithProgress(file: File, folder: string, onProgress: (p: number) => void): Promise<string> {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
  const res = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ filename: file.name, contentType: file.type, folder }),
  });
  if (!res.ok) throw new Error("Falha ao obter URL de upload.");
  const { presignedUrl, publicUrl } = await res.json();
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("Erro de rede."));
    xhr.send(file);
  });
  return publicUrl;
}

async function uploadToR2(file: File, folder: string): Promise<string> {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
  const res = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ filename: file.name, contentType: file.type, folder }),
  });
  if (!res.ok) throw new Error("Falha ao obter URL.");
  const { presignedUrl, publicUrl } = await res.json();
  const up = await fetch(presignedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!up.ok) throw new Error("Falha ao enviar.");
  return publicUrl;
}

// -- Props -------------------------------------------------
interface CourseFormProps {
  initialData?: Partial<Course>;
  onSave: (data: Omit<Course, "id" | "createdAt" | "updatedAt">, status: "draft" | "published") => Promise<void>;
  saving: boolean;
  backHref?: string;
  mode: "create" | "edit";
}

const COURSE_TYPES: { value: CourseType; label: string; color: string; desc: string }[] = [
  { value: "standalone", label: "Standalone", color: "blue", desc: "Compra individual em Kz" },
  { value: "smart", label: "Plano Smart", color: "green", desc: "Incluído no Plano Smart e Golden" },
  { value: "golden", label: "Plano Golden", color: "yellow", desc: "Exclusivo Plano Golden" },
];

const LEVELS: { value: CourseLevel; label: string }[] = [
  { value: "beginner", label: "Iniciante" },
  { value: "intermediate", label: "Intermédio" },
  { value: "advanced", label: "Avançado" },
];

const CATEGORIES: { value: CourseCategory; label: string }[] = [
  { value: "tech", label: "Tecnologia" },
  { value: "finance", label: "Finanças" },
  { value: "investments", label: "Investimentos" },
  { value: "other", label: "Outro" },
];

function toDatetimeLocal(iso: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ""; }
}

export default function CourseForm({ initialData, onSave, saving, backHref = "/admin/courses", mode }: CourseFormProps) {
  // -- State -------------------------------------------------
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [thumbnail, setThumbnail] = useState(initialData?.thumbnail ?? "");
  const [thumbnailPreview, setThumbnailPreview] = useState(initialData?.thumbnail ?? "");
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [price, setPrice] = useState(initialData?.price ? String(initialData.price) : "");
  const [courseType, setCourseType] = useState<CourseType>(initialData?.type ?? "standalone");
  const [format, setFormat] = useState<CourseFormat>(initialData?.format ?? "recorded");
  const [level, setLevel] = useState<CourseLevel>(initialData?.level ?? "beginner");
  const [category, setCategory] = useState<CourseCategory>(initialData?.category ?? "tech");
  const [hasCertificate, setHasCertificate] = useState(initialData?.hasCertificate ?? false);
  const [featured, setFeatured] = useState(initialData?.featured ?? false);
  const [trailId, setTrailId] = useState(initialData?.trailId ?? "");
  const [trailOrder, setTrailOrder] = useState(initialData?.trailOrder ? String(initialData.trailOrder) : "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [modules, setModules] = useState<CourseModule[]>(
    initialData?.modules?.length
      ? initialData.modules
      : [{ title: "", videos: [{ title: "", url: "", duration: "" }] }]
  );
  const [urlMode, setUrlMode] = useState<Record<string, "upload" | "link">>({});
  const [trails, setTrails] = useState<Trail[]>([]);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [error, setError] = useState("");

  const thumbInputRef = useRef<HTMLInputElement>(null);
  const videoInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const videoKey = (mi: number, vi: number) => `${mi}-${vi}`;
  const getMode = (mi: number, vi: number) => urlMode[videoKey(mi, vi)] ?? "upload";

  // -- Load trails -------------------------------------------
  useEffect(() => {
    getDocs(query(collection(db, "trails"), orderBy("title"))).then((snap) => {
      setTrails(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trail)));
    }).catch(console.error);
  }, []);

  // -- Thumbnail ---------------------------------------------
  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setThumbnailPreview(URL.createObjectURL(file));
    setThumbnailUploading(true); setError("");
    try { const url = await uploadToR2(file, "thumbnails"); setThumbnail(url); }
    catch { setError("Erro ao fazer upload da capa."); setThumbnailPreview(""); }
    finally { setThumbnailUploading(false); }
  };

  // -- Video upload ------------------------------------------
  const handleVideoUpload = async (mi: number, vi: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    updateVideo(mi, vi, "uploading", true);
    updateVideo(mi, vi, "uploadProgress", 0);
    updateVideo(mi, vi, "uploadError", "");
    try {
      const url = await uploadToR2WithProgress(file, "videos", (pct) => updateVideo(mi, vi, "uploadProgress", pct));
      updateVideo(mi, vi, "url", url);
      updateVideo(mi, vi, "uploading", false);
      updateVideo(mi, vi, "uploadProgress", 100);
    } catch (err: unknown) {
      updateVideo(mi, vi, "uploading", false);
      updateVideo(mi, vi, "uploadError", err instanceof Error ? err.message : "Erro");
    }
  };

  // -- Tags --------------------------------------------------
  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };
  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  // -- Modules -----------------------------------------------
  const addModule = () => setModules([...modules, { title: "", videos: [{ title: "", url: "", duration: "" }] }]);
  const removeModule = (mi: number) => setModules(modules.filter((_, i) => i !== mi));
  const updateModuleTitle = (mi: number, v: string) => { const u = [...modules]; u[mi].title = v; setModules(u); };

  // -- Videos ------------------------------------------------
  const addVideo = (mi: number) => { const u = [...modules]; u[mi].videos.push({ title: "", url: "", duration: "" }); setModules(u); };
  const removeVideo = (mi: number, vi: number) => { const u = [...modules]; u[mi].videos = u[mi].videos.filter((_, i) => i !== vi); setModules(u); };
  const updateVideo = (mi: number, vi: number, field: keyof VideoItem, v: unknown) => {
    const u = [...modules];
    (u[mi].videos[vi] as unknown as Record<string, unknown>)[field] = v;
    setModules(u);
  };
  const toggleMode = (mi: number, vi: number) => {
    const key = videoKey(mi, vi);
    setUrlMode((prev) => ({ ...prev, [key]: prev[key] === "link" ? "upload" : "link" }));
    updateVideo(mi, vi, "url", ""); updateVideo(mi, vi, "uploadProgress", 0); updateVideo(mi, vi, "uploadError", "");
  };

  // -- AI description ----------------------------------------
  const handleGenerateDescription = async () => {
    if (!title.trim()) { setError("Preenche o nome do curso antes de gerar a descrição."); return; }
    setGeneratingDesc(true); setError("");
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ title, modules }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setDescription(data.description);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao gerar descrição.");
    } finally { setGeneratingDesc(false); }
  };

  // -- Save --------------------------------------------------
  const anyUploading = modules.some((m) => m.videos.some((v) => v.uploading));

  const handleSave = async (status: "draft" | "published") => {
    if (!title.trim()) { setError("O nome do curso é obrigatório."); return; }
    if (anyUploading) { setError("Aguarda o fim dos uploads."); return; }
    setError("");
    const cleanModules = modules.map((m) => ({
      title: m.title,
      videos: m.videos.map((v) => {
        if (format === "live") {
          const roomName = v.roomName || (
            title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" +
            Math.random().toString(36).substring(2, 8)
          );
          return { title: v.title, url: "", duration: v.duration, scheduledAt: v.scheduledAt, roomName };
        }
        return { title: v.title, url: v.url, duration: v.duration };
      }),
    }));
    const lessonsCount = cleanModules.reduce((a, m) => a + m.videos.length, 0);
    const courseData: Omit<Course, "id" | "createdAt" | "updatedAt"> = {
      title: title.trim(), description: description.trim(), thumbnail,
      price: price ? parseFloat(price) : 0,
      type: courseType, format, level, category, hasCertificate, featured,
      tags, modules: cleanModules,
      modulesCount: cleanModules.length, lessonsCount, status,
    };
    if (trailId) courseData.trailId = trailId;
    if (trailOrder) courseData.trailOrder = parseInt(trailOrder);
    await onSave(courseData, status);
  };

  // -- Render ------------------------------------------------
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">

      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-4 bg-gray-950/90 backdrop-blur-xl border-b border-gray-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href={backHref} className="p-2 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white leading-none">
              {mode === "create" ? "Criar Novo Curso" : "Editar Curso"}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {mode === "create" ? "Preencha os detalhes e adicione as aulas" : "Atualize os detalhes e as aulas"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => handleSave("draft")} disabled={saving || thumbnailUploading || anyUploading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Rascunho
          </button>
          <button onClick={() => handleSave("published")} disabled={saving || thumbnailUploading || anyUploading}
            className="flex items-center gap-2 px-5 py-2 bg-purple hover:bg-purple-light text-white text-sm font-bold transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {mode === "edit" ? "Atualizar Curso" : "Publicar Curso"}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-6 mt-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
          <button onClick={() => setError("")} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

        {/* LEFT PANEL */}
        <div className="w-full lg:w-[380px] shrink-0 border-b lg:border-b-0 lg:border-r border-gray-800 overflow-y-auto p-6 space-y-6">

          {/* Thumbnail */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Capa do Curso</label>
            <div onClick={() => thumbInputRef.current?.click()}
              className="relative w-full aspect-video bg-gray-900 border border-dashed border-gray-700 hover:border-blue-500/50 cursor-pointer overflow-hidden group transition-colors">
              {thumbnailPreview ? (
                <>
                  <img src={thumbnailPreview} alt="preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gray-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ImagePlus className="h-8 w-8 text-white" />
                  </div>
                  {thumbnailUploading && (
                    <div className="absolute inset-0 bg-gray-950/70 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-purple" />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500 group-hover:text-blue-400 transition-colors">
                  <ImagePlus className="h-10 w-10" />
                  <span className="text-sm font-medium">Clique para carregar</span>
                  <span className="text-xs">PNG, JPG, WEBP — máx. 5MB</span>
                </div>
              )}
            </div>
            <input ref={thumbInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleThumbnailChange} />
            {thumbnailUploading && <p className="mt-2 text-xs text-blue-400 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> A enviar...</p>}
            {thumbnail && !thumbnailUploading && <p className="mt-2 text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Upload concluído</p>}
          </div>

          {/* Nome */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nome do Curso <span className="text-red-400">*</span></label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Formação Completa em JavaScript"
              className="w-full bg-gray-900 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all" />
          </div>

          {/* Descrição + IA */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Descrição</label>
              <button type="button" onClick={handleGenerateDescription} disabled={generatingDesc || !title.trim()}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {generatingDesc ? <><Loader2 className="w-3 h-3 animate-spin" /> A gerar...</> : <><Sparkles className="w-3 h-3" /> Gerar com IA</>}
              </button>
            </div>
            <div className="relative">
              <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o que os alunos vão aprender..."
                className="w-full bg-gray-900 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all resize-none" />
              {generatingDesc && (
                <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-purple-400 text-sm"><Sparkles className="w-4 h-4 animate-pulse" /> A gerar...</div>
                </div>
              )}
            </div>
          </div>

          {/* Tipo de curso */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Tipo de Acesso</label>
            <div className="space-y-2">
              {COURSE_TYPES.map((t) => (
                <button key={t.value} type="button" onClick={() => setCourseType(t.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border text-left transition-all ${
                    courseType === t.value
                      ? t.color === "blue" ? "border-blue-500/50 bg-blue-500/10"
                        : t.color === "green" ? "border-green-500/50 bg-green-500/10"
                        : "border-yellow-500/50 bg-yellow-500/10"
                      : "border-gray-800 bg-gray-900 hover:border-gray-700"
                  }`}>
                  <div className={`h-3 w-3 rounded-full shrink-0 ${
                    courseType === t.value
                      ? t.color === "blue" ? "bg-blue-400" : t.color === "green" ? "bg-green-400" : "bg-yellow-400"
                      : "bg-gray-700"
                  }`} />
                  <div>
                    <p className={`text-sm font-bold ${
                      courseType === t.value
                        ? t.color === "blue" ? "text-blue-400" : t.color === "green" ? "text-green-400" : "text-yellow-400"
                        : "text-gray-300"
                    }`}>{t.label}</p>
                    <p className="text-xs text-gray-500">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Formato */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Formato do Curso</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setFormat("recorded")}
                className={`flex items-center justify-center gap-2 px-4 py-3 border text-sm font-bold transition-all ${
                  format === "recorded"
                    ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                    : "border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700"
                }`}>
                <Video className="h-4 w-4" /> Gravado
              </button>
              <button type="button" onClick={() => setFormat("live")}
                className={`flex items-center justify-center gap-2 px-4 py-3 border text-sm font-bold transition-all ${
                  format === "live"
                    ? "border-purple-500/50 bg-purple-500/10 text-purple-400"
                    : "border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700"
                }`}>
                <Radio className="h-4 w-4" /> Ao Vivo
              </button>
            </div>
          </div>

          {/* Preço — só standalone */}
          {courseType === "standalone" && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Preço (Kz)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-gray-500 font-medium">Kz</span>
                <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)}
                  placeholder="0 = Gratuito"
                  className="w-full bg-gray-900 border border-gray-800 focus:border-blue-500/50 py-2.5 pl-10 pr-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all" />
              </div>
            </div>
          )}

          {/* Nível + Categoria */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nível</label>
              <select value={level} onChange={(e) => setLevel(e.target.value as CourseLevel)}
                className="w-full bg-gray-900 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white text-sm focus:outline-none appearance-none cursor-pointer">
                {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Categoria</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as CourseCategory)}
                className="w-full bg-gray-900 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white text-sm focus:outline-none appearance-none cursor-pointer">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* Certificado */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Certificado</label>
            <button type="button" onClick={() => setHasCertificate(!hasCertificate)}
              className={`w-full flex items-center gap-3 px-4 py-3 border transition-all ${
                hasCertificate ? "border-amber-500/50 bg-amber-500/10" : "border-gray-800 bg-gray-900 hover:border-gray-700"
              }`}>
              <Award className={`h-5 w-5 shrink-0 ${hasCertificate ? "text-amber-400" : "text-gray-600"}`} />
              <div className="text-left">
                <p className={`text-sm font-bold ${hasCertificate ? "text-amber-400" : "text-gray-400"}`}>
                  {hasCertificate ? "Certificado Ativado" : "Sem Certificado"}
                </p>
                <p className="text-xs text-gray-500">Gerado automaticamente ao completar 100%</p>
              </div>
              <div className={`ml-auto h-5 w-9 rounded-full transition-colors relative shrink-0 ${hasCertificate ? "bg-amber-500" : "bg-gray-700"}`}>
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${hasCertificate ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
            </button>
          </div>

          {/* Destaque na landing page */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Landing Page</label>
            <button type="button" onClick={() => setFeatured(!featured)}
              className={`w-full flex items-center gap-3 px-4 py-3 border transition-all ${
                featured ? "border-blue-500/50 bg-blue-500/10" : "border-gray-800 bg-gray-900 hover:border-gray-700"
              }`}>
              <Sparkles className={`h-5 w-5 shrink-0 ${featured ? "text-blue-400" : "text-gray-600"}`} />
              <div className="text-left">
                <p className={`text-sm font-bold ${featured ? "text-blue-400" : "text-gray-400"}`}>
                  {featured ? "Em Destaque" : "Não em Destaque"}
                </p>
                <p className="text-xs text-gray-500">Aparece na secção "Cursos em destaque" da landing page</p>
              </div>
              <div className={`ml-auto h-5 w-9 rounded-full transition-colors relative shrink-0 ${featured ? "bg-blue-500" : "bg-gray-700"}`}>
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${featured ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
            </button>
          </div>

          {/* Trilha */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Trilha (opcional)</label>
            <select value={trailId} onChange={(e) => setTrailId(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white text-sm focus:outline-none appearance-none cursor-pointer mb-2">
              <option value="">— Nenhuma trilha —</option>
              {trails.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
            {trailId && (
              <input type="number" min="1" value={trailOrder} onChange={(e) => setTrailOrder(e.target.value)}
                placeholder="Posição na trilha (ex: 1)"
                className="w-full bg-gray-900 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all" />
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tags</label>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Tag className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
                <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="javascript, react..."
                  className="w-full bg-gray-900 border border-gray-800 focus:border-blue-500/50 py-2 pl-8 pr-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all" />
              </div>
              <button type="button" onClick={addTag} className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                    {t}
                    <button onClick={() => removeTag(t)} className="hover:text-white transition-colors"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Resumo */}
          <div className="bg-gray-900/60 border border-gray-800 p-4 space-y-2.5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resumo</p>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Módulos</span><span className="text-white font-medium">{modules.length}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Aulas</span><span className="text-white font-medium">{modules.reduce((a, m) => a + m.videos.length, 0)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Tipo</span><span className="text-white font-medium capitalize">{courseType}</span></div>
            {courseType === "standalone" && (
              <div className="flex justify-between text-sm"><span className="text-gray-400">Preço</span><span className="text-white font-medium">{price ? `${parseInt(price).toLocaleString("pt-AO")} Kz` : "Gratuito"}</span></div>
            )}
            <div className="flex justify-between text-sm"><span className="text-gray-400">Certificado</span><span className={`font-medium ${hasCertificate ? "text-amber-400" : "text-gray-500"}`}>{hasCertificate ? "Sim" : "Não"}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Destaque</span><span className={`font-medium ${featured ? "text-blue-400" : "text-gray-500"}`}>{featured ? "Sim" : "Não"}</span></div>
          </div>
        </div>

        {/* RIGHT PANEL — Módulos e Aulas */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Módulos e Aulas</h2>
              <p className="text-xs text-gray-500 mt-0.5">Organize o conteúdo em módulos e faça upload dos vídeos</p>
            </div>
            <button onClick={addModule}
              className="flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2 transition-colors">
              <Plus className="w-4 h-4" /> Novo Módulo
            </button>
          </div>

          <div className="space-y-4">
            {modules.map((module, mi) => (
              <div key={mi} className="bg-gray-900/50 border border-gray-800 overflow-hidden">

                {/* Module header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-800">
                  <GripVertical className="h-4 w-4 text-gray-600 shrink-0" />
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider shrink-0">Módulo {mi + 1}</span>
                  <input type="text" value={module.title} onChange={(e) => updateModuleTitle(mi, e.target.value)}
                    placeholder="Nome do módulo (ex: Introdução)"
                    className="flex-1 bg-transparent text-white placeholder-gray-600 text-sm focus:outline-none" />
                  {modules.length > 1 && (
                    <button onClick={() => removeModule(mi)} className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Videos */}
                <div className="p-4 space-y-3">
                  {module.videos.map((video, vi) => {
                    const mode = getMode(mi, vi);
                    const key = videoKey(mi, vi);
                    return (
                      <div key={vi} className="bg-gray-950/60 border border-gray-800/60 p-3 space-y-2">
                        {format === "live" ? (
                          /* -- Live lesson row -- */
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-5 shrink-0 text-right">{vi + 1}.</span>
                            <input type="text" value={video.title} onChange={(e) => updateVideo(mi, vi, "title", e.target.value)}
                              placeholder="Título da aula"
                              className="flex-1 bg-gray-900 border border-gray-800 focus:border-purple-500/40 py-1.5 px-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-all" />
                            <input type="datetime-local" value={toDatetimeLocal(video.scheduledAt ?? "")}
                              onChange={(e) => updateVideo(mi, vi, "scheduledAt", new Date(e.target.value).toISOString())}
                              className="w-44 shrink-0 bg-gray-900 border border-gray-800 focus:border-purple-500/40 py-1.5 px-3 text-sm text-white focus:outline-none transition-all" />
                            <input type="number" min="1" value={video.duration}
                              onChange={(e) => updateVideo(mi, vi, "duration", e.target.value)}
                              placeholder="Minutos"
                              className="w-20 shrink-0 bg-gray-900 border border-gray-800 focus:border-purple-500/40 py-1.5 px-3 text-sm text-white placeholder-gray-600 focus:outline-none text-center transition-all" />
                            {module.videos.length > 1 && (
                              <button onClick={() => removeVideo(mi, vi)} className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <>
                          <div className="flex items-center gap-2">
                           <span className="text-xs text-gray-600 w-5 shrink-0 text-right">{vi + 1}.</span>
                           <input type="text" value={video.title} onChange={(e) => updateVideo(mi, vi, "title", e.target.value)}
                             placeholder="Título da aula"
                             className="flex-1 bg-gray-900 border border-gray-800 focus:border-blue-500/40 py-1.5 px-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-all" />
                           <input type="text" value={video.duration} onChange={(e) => updateVideo(mi, vi, "duration", e.target.value)}
                             placeholder="00:00"
                             className="w-20 shrink-0 bg-gray-900 border border-gray-800 focus:border-blue-500/40 py-1.5 px-3 text-sm text-white placeholder-gray-600 focus:outline-none text-center transition-all" />
                           {module.videos.length > 1 && (
                             <button onClick={() => removeVideo(mi, vi)} className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
                               <Trash2 className="w-3.5 h-3.5" />
                             </button>
                           )}
                          </div>

                          <div className="flex items-start gap-2 pl-7">
                           <div className="flex shrink-0 border border-gray-800 overflow-hidden">
                             <button onClick={() => { if (mode !== "upload") toggleMode(mi, vi); }}
                               className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${mode === "upload" ? "bg-purple text-white" : "bg-gray-900 text-gray-500 hover:text-gray-300"}`}>
                               <UploadCloud className="w-3.5 h-3.5" /> Upload
                             </button>
                             <button onClick={() => { if (mode !== "link") toggleMode(mi, vi); }}
                               className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${mode === "link" ? "bg-purple text-white" : "bg-gray-900 text-gray-500 hover:text-gray-300"}`}>
                               <LinkIcon className="w-3.5 h-3.5" /> URL
                             </button>
                           </div>

                           {mode === "upload" && (
                             <div className="flex-1">
                               {!video.url && !video.uploading && (
                                 <button onClick={() => videoInputRefs.current[key]?.click()}
                                   className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-700 hover:border-blue-500/50 bg-gray-900 py-2 text-xs text-gray-400 hover:text-blue-400 transition-colors">
                                   <UploadCloud className="w-4 h-4" /> Clique para selecionar vídeo (MP4, MOV, WEBM)
                                 </button>
                               )}
                               {video.uploading && (
                                 <div className="space-y-1">
                                   <div className="flex justify-between text-xs text-gray-400">
                                     <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> A enviar...</span>
                                     <span>{video.uploadProgress ?? 0}%</span>
                                   </div>
                                   <div className="w-full bg-gray-800 h-1.5">
                                     <div className="bg-blue-500 h-1.5 transition-all duration-200" style={{ width: `${video.uploadProgress ?? 0}%` }} />
                                   </div>
                                 </div>
                               )}
                               {video.url && !video.uploading && (
                                 <div className="flex items-center gap-2">
                                   <div className="flex-1 flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 text-xs text-green-400">
                                     <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                     <span className="truncate">{video.url.split("/").pop()}</span>
                                   </div>
                                   <button onClick={() => { updateVideo(mi, vi, "url", ""); updateVideo(mi, vi, "uploadProgress", 0); }}
                                     className="p-1.5 text-gray-500 hover:text-red-400 transition-colors shrink-0">
                                     <X className="w-3.5 h-3.5" />
                                   </button>
                                 </div>
                               )}
                               {video.uploadError && (
                                 <p className="text-xs text-red-400 flex items-center gap-1">
                                   <AlertCircle className="w-3.5 h-3.5" />{video.uploadError}
                                 </p>
                               )}
                               <input ref={(el) => { videoInputRefs.current[key] = el; }} type="file"
                                 accept="video/mp4,video/quicktime,video/webm" className="hidden"
                                 onChange={(e) => handleVideoUpload(mi, vi, e)} />
                             </div>
                           )}

                           {mode === "link" && (
                             <div className="relative flex-1">
                               <Video className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-500" />
                               <input type="text" value={video.url} onChange={(e) => updateVideo(mi, vi, "url", e.target.value)}
                                 placeholder="https://... (YouTube, Vimeo, etc.)"
                                 className="w-full bg-gray-900 border border-gray-800 focus:border-blue-500/40 py-1.5 pl-8 pr-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-all" />
                             </div>
                           )}
                           </div>
                           </>
                         )}
                       </div>
                     );
                  })}

                  <button onClick={() => addVideo(mi)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-400 mt-1 transition-colors ml-4">
                    <Plus className="w-3.5 h-3.5" /> Adicionar Aula
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
