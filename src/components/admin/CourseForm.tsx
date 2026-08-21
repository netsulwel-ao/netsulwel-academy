"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Save, ArrowLeft, Loader2, AlertCircle, X } from "lucide-react";
import Link from "next/link";
import type { Course, CourseModule, VideoItem, CourseType, CourseLevel, CourseCategory, CourseFormat, Trail } from "@/types/course";
import { logger } from "@/lib/logger";
import { uploadThumbnail, uploadVideo } from "./course-form/_upload";
import { SettingsPanel } from "./course-form/SettingsPanel";
import { ModulesPanel } from "./course-form/ModulesPanel";
import type { CourseFormProps } from "./course-form/_types";

export type { CourseFormProps };

export default function CourseForm({
  initialData,
  onSave,
  saving,
  backHref = "/admin/courses",
  mode,
}: CourseFormProps) {

  // ── Settings state ────────────────────────────────────────
  const [title,           setTitle]           = useState(initialData?.title       ?? "");
  const [description,     setDescription]     = useState(initialData?.description ?? "");
  const [thumbnail,       setThumbnail]       = useState(initialData?.thumbnail   ?? "");
  const [thumbPreview,    setThumbPreview]    = useState(initialData?.thumbnail   ?? "");
  const [thumbUploading,  setThumbUploading]  = useState(false);
  const [price,           setPrice]           = useState(initialData?.price ? String(initialData.price) : "");
  const [courseType,      setCourseType]      = useState<CourseType>(initialData?.type     ?? "standalone");
  const [format,          setFormat]          = useState<CourseFormat>(initialData?.format ?? "recorded");
  const [level,           setLevel]           = useState<CourseLevel>(initialData?.level   ?? "beginner");
  const [category,        setCategory]        = useState<CourseCategory>(initialData?.category ?? "tech");
  const [hasCertificate,  setHasCertificate]  = useState(initialData?.hasCertificate ?? false);
  const [featured,        setFeatured]        = useState(initialData?.featured       ?? false);
  const [trailId,         setTrailId]         = useState(initialData?.trailId        ?? "");
  const [trailOrder,      setTrailOrder]      = useState(initialData?.trailOrder ? String(initialData.trailOrder) : "");
  const [tagInput,        setTagInput]        = useState("");
  const [tags,            setTags]            = useState<string[]>(initialData?.tags ?? []);
  const [accessCode,      setAccessCode]      = useState(initialData?.accessCode    ?? "");
  const [generatingDesc,  setGeneratingDesc]  = useState(false);
  const [trails,          setTrails]          = useState<Trail[]>([]);

  // ── Modules state ─────────────────────────────────────────
  const [modules, setModules] = useState<CourseModule[]>(
    initialData?.modules?.length
      ? initialData.modules
      : [{ title: "", videos: [{ title: "", url: "", duration: "" }] }]
  );
  const [urlMode, setUrlMode] = useState<Record<string, "upload" | "link">>({});

  // ── Error ─────────────────────────────────────────────────
  const [error, setError] = useState("");

  // ── Load trails ───────────────────────────────────────────
  useEffect(() => {
    getDocs(query(collection(db, "trails"), orderBy("title")))
      .then((snap) => setTrails(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trail))))
      .catch((err) => logger.error("CourseForm: failed to load trails", err));
  }, []);

  // ── Thumbnail ─────────────────────────────────────────────
  const handleThumbnailChange = async (file: File) => {
    setThumbPreview(URL.createObjectURL(file));
    setThumbUploading(true);
    setError("");
    try {
      const url = await uploadThumbnail(file);
      setThumbnail(url);
    } catch (err) {
      logger.error("CourseForm: thumbnail upload failed", err);
      setError("Erro ao fazer upload da capa.");
      setThumbPreview("");
    } finally {
      setThumbUploading(false);
    }
  };

  // ── Video upload ──────────────────────────────────────────
  const handleVideoFileChange = async (mi: number, vi: number, file: File) => {
    updateVideo(mi, vi, "uploading", true);
    updateVideo(mi, vi, "uploadProgress", 0);
    updateVideo(mi, vi, "uploadError", "");
    try {
      const url = await uploadVideo(file, (pct) => updateVideo(mi, vi, "uploadProgress", pct));
      updateVideo(mi, vi, "url", url);
      updateVideo(mi, vi, "uploadProgress", 100);
    } catch (err) {
      logger.error("CourseForm: video upload failed", err, { mi, vi });
      updateVideo(mi, vi, "uploadError", err instanceof Error ? err.message : "Erro");
    } finally {
      updateVideo(mi, vi, "uploading", false);
    }
  };

  // ── Tags ──────────────────────────────────────────────────
  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };
  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  // ── Modules ───────────────────────────────────────────────
  const addModule = () =>
    setModules([...modules, { title: "", videos: [{ title: "", url: "", duration: "" }] }]);
  const removeModule = (mi: number) =>
    setModules(modules.filter((_, i) => i !== mi));
  const updateModuleTitle = (mi: number, v: string) => {
    const u = [...modules]; u[mi].title = v; setModules(u);
  };

  // ── Videos ────────────────────────────────────────────────
  const addVideo = (mi: number) => {
    const u = [...modules];
    u[mi].videos.push({ title: "", url: "", duration: "" });
    setModules(u);
  };
  const removeVideo = (mi: number, vi: number) => {
    const u = [...modules];
    u[mi].videos = u[mi].videos.filter((_, i) => i !== vi);
    setModules(u);
  };
  const updateVideo = (mi: number, vi: number, field: keyof VideoItem, v: unknown) => {
    const u = [...modules];
    (u[mi].videos[vi] as unknown as Record<string, unknown>)[field] = v;
    setModules(u);
  };
  const toggleMode = (mi: number, vi: number) => {
    const k = `${mi}-${vi}`;
    setUrlMode((prev) => ({ ...prev, [k]: prev[k] === "link" ? "upload" : "link" }));
    updateVideo(mi, vi, "url", "");
    updateVideo(mi, vi, "uploadProgress", 0);
    updateVideo(mi, vi, "uploadError", "");
  };

  // ── AI description ─────────────────────────────────────────
  const handleGenerateDesc = async () => {
    if (!title.trim()) { setError("Preenche o nome do curso antes de gerar a descrição."); return; }
    setGeneratingDesc(true);
    setError("");
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
    } catch (err) {
      logger.error("CourseForm: AI description failed", err);
      setError(err instanceof Error ? err.message : "Erro ao gerar descrição.");
    } finally {
      setGeneratingDesc(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────
  const anyUploading = modules.some((m) => m.videos.some((v) => v.uploading));

  const handleSave = async (status: "draft" | "published") => {
    if (!title.trim()) { setError("O nome do curso é obrigatório."); return; }
    if (anyUploading)  { setError("Aguarda o fim dos uploads."); return; }
    setError("");

    const cleanModules = modules.map((m) => ({
      title: m.title,
      videos: m.videos.map((v) => {
        if (format === "live") {
          const roomName =
            v.roomName ||
            title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") +
              "-" + Math.random().toString(36).substring(2, 8);
          return {
            title: v.title, url: "", duration: v.duration,
            scheduledAt: v.scheduledAt, roomName,
            materials: v.materials ?? [], exercises: v.exercises ?? [],
          };
        }
        return {
          title: v.title, url: v.url, duration: v.duration,
          materials: v.materials ?? [], exercises: v.exercises ?? [],
        };
      }),
    }));

    const lessonsCount = cleanModules.reduce((a, m) => a + m.videos.length, 0);

    const courseData: Omit<Course, "id" | "createdAt" | "updatedAt"> = {
      title: title.trim(), description: description.trim(), thumbnail,
      price: price ? parseFloat(price) : 0,
      type: courseType, format, level, category,
      hasCertificate, featured, tags,
      modules: cleanModules, modulesCount: cleanModules.length, lessonsCount,
      status,
    };

    if (courseType === "standalone" && (!price || parseFloat(price) <= 0) && accessCode.trim()) {
      courseData.accessCode = accessCode.trim();
    } else {
      courseData.accessCode = "";
    }
    if (trailId)    courseData.trailId    = trailId;
    if (trailOrder) courseData.trailOrder = parseInt(trailOrder);

    await onSave(courseData, status);
  };

  // ── Computed ──────────────────────────────────────────────
  const lessonsCount = modules.reduce((a, m) => a + m.videos.length, 0);

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-gray-800 bg-gray-950 px-6 py-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={backHref}
            aria-label="Voltar"
            className="flex h-8 w-8 items-center justify-center border border-gray-800 bg-gray-900 text-gray-600 hover:border-gray-700 hover:text-gray-300 transition-all shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-700">
              {mode === "create" ? "// criar curso" : "// editar curso"}
            </p>
            <p className="text-sm font-semibold text-gray-200 truncate">
              {title || (mode === "create" ? "Novo curso" : "Editar")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleSave("draft")}
            disabled={saving || thumbUploading || anyUploading}
            className="flex items-center gap-1.5 border border-gray-800 bg-gray-900 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-gray-500 hover:border-gray-700 hover:text-gray-300 disabled:opacity-40 transition-all"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Rascunho
          </button>
          <button
            type="button"
            onClick={() => handleSave("published")}
            disabled={saving || thumbUploading || anyUploading}
            className="flex items-center gap-1.5 border border-purple/30 bg-purple/10 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-purple/80 hover:bg-purple/20 disabled:opacity-40 transition-all"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            {mode === "edit" ? "Actualizar" : "Publicar"}
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div
          role="alert"
          className="mx-6 mt-4 flex items-center gap-2 border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400/80 shrink-0"
        >
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          {error}
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Fechar erro"
            className="ml-auto"
          >
            <X className="h-4 w-4 text-red-400/50 hover:text-red-400 transition-colors" />
          </button>
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <SettingsPanel
          thumbnailPreview={thumbPreview}
          thumbnailUploaded={!!thumbnail}
          thumbnailUploading={thumbUploading}
          onThumbnailChange={handleThumbnailChange}
          title={title} setTitle={setTitle}
          description={description} setDescription={setDescription}
          generatingDesc={generatingDesc} onGenerateDesc={handleGenerateDesc}
          format={format} setFormat={setFormat}
          price={price} setPrice={setPrice}
          accessCode={accessCode} setAccessCode={setAccessCode}
          level={level} setLevel={setLevel}
          category={category} setCategory={setCategory}
          hasCertificate={hasCertificate} setHasCertificate={setHasCertificate}
          featured={featured} setFeatured={setFeatured}
          trails={trails}
          trailId={trailId} setTrailId={setTrailId}
          trailOrder={trailOrder} setTrailOrder={setTrailOrder}
          tagInput={tagInput} setTagInput={setTagInput}
          tags={tags} addTag={addTag} removeTag={removeTag}
          modulesCount={modules.length} lessonsCount={lessonsCount}
        />
        <ModulesPanel
          modules={modules}
          format={format}
          urlMode={urlMode}
          addModule={addModule}
          removeModule={removeModule}
          updateModuleTitle={updateModuleTitle}
          addVideo={addVideo}
          removeVideo={removeVideo}
          updateVideo={updateVideo}
          toggleMode={toggleMode}
          onVideoFileChange={handleVideoFileChange}
        />
      </div>
    </div>
  );
}
