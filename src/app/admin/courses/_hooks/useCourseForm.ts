"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { uploadLargeFile } from "@/lib/tus-upload";
import { logger } from "@/lib/logger";
import type { Course, CourseModule, VideoItem, CourseType, CourseLevel, CourseCategory, CourseFormat, Trail } from "@/types/course";

// ── R2 upload helpers ─────────────────────────────────────────
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

async function uploadToR2WithProgress(
  file: File, folder: string, onProgress: (p: number) => void
): Promise<string> {
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
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`));
    xhr.onerror = () => reject(new Error("Erro de rede."));
    xhr.send(file);
  });
  return publicUrl;
}

// ── Hook ──────────────────────────────────────────────────────
export function useCourseForm(
  initialData: Partial<Course> | undefined,
  onSave: (data: Omit<Course, "id" | "createdAt" | "updatedAt">, status: "draft" | "published") => Promise<void>
) {
  const [title,              setTitle]              = useState(initialData?.title ?? "");
  const [description,        setDescription]        = useState(initialData?.description ?? "");
  const [thumbnail,          setThumbnail]          = useState(initialData?.thumbnail ?? "");
  const [thumbnailPreview,   setThumbnailPreview]   = useState(initialData?.thumbnail ?? "");
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [price,              setPrice]              = useState(initialData?.price ? String(initialData.price) : "");
  const [courseType,         setCourseType]         = useState<CourseType>(initialData?.type ?? "standalone");
  const [format,             setFormat]             = useState<CourseFormat>(initialData?.format ?? "recorded");
  const [level,              setLevel]              = useState<CourseLevel>(initialData?.level ?? "beginner");
  const [category,           setCategory]           = useState<CourseCategory>(initialData?.category ?? "tech");
  const [hasCertificate,     setHasCertificate]     = useState(initialData?.hasCertificate ?? false);
  const [featured,           setFeatured]           = useState(initialData?.featured ?? false);
  const [trailId,            setTrailId]            = useState(initialData?.trailId ?? "");
  const [trailOrder,         setTrailOrder]         = useState(initialData?.trailOrder ? String(initialData.trailOrder) : "");
  const [tagInput,           setTagInput]           = useState("");
  const [tags,               setTags]               = useState<string[]>(initialData?.tags ?? []);
  const [modules,            setModules]            = useState<CourseModule[]>(
    initialData?.modules?.length
      ? initialData.modules
      : [{ title: "", videos: [{ title: "", url: "", duration: "" }] }]
  );
  const [urlMode,            setUrlMode]            = useState<Record<string, "upload" | "link">>({});
  const [trails,             setTrails]             = useState<Trail[]>([]);
  const [generatingDesc,     setGeneratingDesc]     = useState(false);
  const [error,              setError]              = useState("");
  const [accessCode,         setAccessCode]         = useState(initialData?.accessCode ?? "");

  const thumbInputRef    = useRef<HTMLInputElement>(null);
  const videoInputRefs   = useRef<Record<string, HTMLInputElement | null>>({});

  const videoKey  = (mi: number, vi: number) => `${mi}-${vi}`;
  const getMode   = (mi: number, vi: number) => urlMode[videoKey(mi, vi)] ?? "upload";
  const anyUploading = modules.some(m => m.videos.some(v => v.uploading));

  // Load trails
  useEffect(() => {
    getDocs(query(collection(db, "trails"), orderBy("title")))
      .then(snap => setTrails(snap.docs.map(d => ({ id: d.id, ...d.data() } as Trail))))
      .catch(err => logger.error("useCourseForm: failed to load trails", err));
  }, []);

  // Thumbnail upload
  const handleThumbnailChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setThumbnailPreview(URL.createObjectURL(file));
    setThumbnailUploading(true); setError("");
    try {
      const url = await uploadToR2(file, "thumbnails");
      setThumbnail(url);
    } catch {
      setError("Erro ao fazer upload da capa.");
      setThumbnailPreview("");
    } finally {
      setThumbnailUploading(false);
    }
  }, []);

  // Video upload
  const handleVideoUpload = useCallback(async (mi: number, vi: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const update = (field: keyof VideoItem, v: unknown) => {
      setModules(prev => {
        const u = prev.map(m => ({ ...m, videos: [...m.videos] }));
        (u[mi].videos[vi] as unknown as Record<string, unknown>)[field] = v;
        return u;
      });
    };
    update("uploading", true);
    update("uploadProgress", 0);
    update("uploadError", "");
    try {
      const LARGE = 50 * 1024 * 1024;
      const url = file.size > LARGE
        ? await uploadLargeFile({ file, folder: "videos", onProgress: p => update("uploadProgress", p) })
        : await uploadToR2WithProgress(file, "videos", p => update("uploadProgress", p));
      update("url", url);
      update("uploading", false);
      update("uploadProgress", 100);
    } catch (err) {
      update("uploading", false);
      update("uploadError", err instanceof Error ? err.message : "Erro");
    }
  }, []);

  // Tags
  const addTag    = useCallback(() => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput("");
  }, [tagInput, tags]);
  const removeTag = useCallback((t: string) => setTags(prev => prev.filter(x => x !== t)), []);

  // Modules
  const addModule         = useCallback(() => setModules(prev => [...prev, { title: "", videos: [{ title: "", url: "", duration: "" }] }]), []);
  const removeModule      = useCallback((mi: number) => setModules(prev => prev.filter((_, i) => i !== mi)), []);
  const updateModuleTitle = useCallback((mi: number, v: string) => {
    setModules(prev => { const u = [...prev]; u[mi] = { ...u[mi], title: v }; return u; });
  }, []);

  // Videos
  const addVideo    = useCallback((mi: number) => {
    setModules(prev => { const u = prev.map(m => ({ ...m, videos: [...m.videos] })); u[mi].videos.push({ title: "", url: "", duration: "" }); return u; });
  }, []);
  const removeVideo = useCallback((mi: number, vi: number) => {
    setModules(prev => { const u = prev.map(m => ({ ...m, videos: [...m.videos] })); u[mi].videos = u[mi].videos.filter((_, i) => i !== vi); return u; });
  }, []);
  const updateVideo = useCallback((mi: number, vi: number, field: keyof VideoItem, v: unknown) => {
    setModules(prev => {
      const u = prev.map(m => ({ ...m, videos: [...m.videos] }));
      (u[mi].videos[vi] as unknown as Record<string, unknown>)[field] = v;
      return u;
    });
  }, []);
  const toggleMode  = useCallback((mi: number, vi: number) => {
    const key = videoKey(mi, vi);
    setUrlMode(prev => ({ ...prev, [key]: prev[key] === "link" ? "upload" : "link" }));
    updateVideo(mi, vi, "url", "");
    updateVideo(mi, vi, "uploadProgress", 0);
    updateVideo(mi, vi, "uploadError", "");
  }, [updateVideo]);

  // AI description
  const handleGenerateDescription = useCallback(async () => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar descrição.");
    } finally {
      setGeneratingDesc(false);
    }
  }, [title, modules]);

  // Save
  const handleSave = useCallback(async (status: "draft" | "published") => {
    if (!title.trim()) { setError("O nome do curso é obrigatório."); return; }
    if (anyUploading)  { setError("Aguarda o fim dos uploads."); return; }
    setError("");

    const cleanModules = modules.map(m => ({
      title: m.title,
      videos: m.videos.map(v => {
        if (format === "live") {
          const roomName = v.roomName || (
            title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") +
            "-" + Math.random().toString(36).substring(2, 8)
          );
          return { title: v.title, url: "", duration: v.duration, scheduledAt: v.scheduledAt, roomName, materials: v.materials ?? [], exercises: v.exercises ?? [] };
        }
        return { title: v.title, url: v.url, duration: v.duration, materials: v.materials ?? [], exercises: v.exercises ?? [] };
      }),
    }));

    const lessonsCount = cleanModules.reduce((a, m) => a + m.videos.length, 0);
    const courseData: Omit<Course, "id" | "createdAt" | "updatedAt"> = {
      title: title.trim(), description: description.trim(), thumbnail,
      price: price ? parseFloat(price) : 0,
      type: courseType, format, level, category,
      hasCertificate, featured, tags,
      modules: cleanModules, modulesCount: cleanModules.length, lessonsCount, status,
    };

    if (courseType === "standalone" && (!price || parseFloat(price) <= 0) && accessCode.trim()) {
      courseData.accessCode = accessCode.trim();
    } else {
      courseData.accessCode = "";
    }
    if (trailId)    courseData.trailId    = trailId;
    if (trailOrder) courseData.trailOrder = parseInt(trailOrder);

    await onSave(courseData, status);
  }, [title, description, thumbnail, price, courseType, format, level, category, hasCertificate, featured, tags, modules, accessCode, trailId, trailOrder, anyUploading, onSave]);

  // Access code generator
  const generateAccessCode = useCallback(() => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setAccessCode(`${seg()}-${seg()}`);
  }, []);

  return {
    // state
    title, setTitle,
    description, setDescription,
    thumbnail, thumbnailPreview, thumbnailUploading, setThumbnailPreview,
    price, setPrice,
    courseType, setCourseType,
    format, setFormat,
    level, setLevel,
    category, setCategory,
    hasCertificate, setHasCertificate,
    featured, setFeatured,
    trailId, setTrailId,
    trailOrder, setTrailOrder,
    tagInput, setTagInput,
    tags,
    modules,
    urlMode,
    trails,
    generatingDesc,
    error, setError,
    accessCode, setAccessCode,
    // derived
    anyUploading,
    videoKey, getMode,
    // refs
    thumbInputRef, videoInputRefs,
    // handlers
    handleThumbnailChange, handleVideoUpload,
    addTag, removeTag,
    addModule, removeModule, updateModuleTitle,
    addVideo, removeVideo, updateVideo, toggleMode,
    handleGenerateDescription,
    handleSave,
    generateAccessCode,
  };
}
