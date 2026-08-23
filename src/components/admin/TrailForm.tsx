"use client";

import { useState, useEffect } from "react";
import { Save, ArrowLeft, Loader2, AlertCircle, X } from "lucide-react";
import type { TrailLiveSession, CourseType, CourseLevel, CourseCategory } from "@/types/course";
import { logger } from "@/lib/logger";
import { uploadToR2 } from "./trail-form/_upload";
import { TrailSettingsPanel } from "./trail-form/TrailSettingsPanel";
import { TrailContentPanel } from "./trail-form/TrailContentPanel";
import type { TrailFormProps } from "./trail-form/_types";

export type { TrailFormProps };

export function TrailForm({
  mode, initialData, allCourses, allLives,
  saving, error, onSave, onError, onBack,
}: TrailFormProps) {

  const [title,       setTitle]       = useState(initialData?.title       ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [thumbnail,   setThumbnail]   = useState(initialData?.thumbnail   ?? "");
  const [thumbPreview,setThumbPreview]= useState(initialData?.thumbnail   ?? "");
  const [thumbUploading,setThumbUploading] = useState(false);
  const [trailType,   setTrailType]   = useState<"standalone">("standalone");
  const [level,       setLevel]       = useState<CourseLevel>(initialData?.level   ?? "beginner");
  const [category,    setCategory]    = useState<CourseCategory>(initialData?.category ?? "tech");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(initialData?.courseIds   ?? []);
  const [selectedLiveIds,   setSelectedLiveIds]   = useState<string[]>(initialData?.liveIds     ?? []);
  const [liveSessions,      setLiveSessions]      = useState<TrailLiveSession[]>(initialData?.liveSessions ?? []);

  useEffect(() => {
    if (!initialData) return;
    setTitle(initialData.title ?? "");
    setDescription(initialData.description ?? "");
    setThumbnail(initialData.thumbnail ?? "");
    setThumbPreview(initialData.thumbnail ?? "");
    setTrailType("standalone");
    setLevel(initialData.level ?? "beginner");
    setCategory(initialData.category ?? "tech");
    setSelectedCourseIds(initialData.courseIds ?? []);
    setSelectedLiveIds(initialData.liveIds ?? []);
    setLiveSessions(initialData.liveSessions ?? []);
  }, [initialData?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleThumbChange = async (file: File) => {
    setThumbPreview(URL.createObjectURL(file));
    setThumbUploading(true);
    try {
      const url = await uploadToR2(file, "thumbnails");
      setThumbnail(url);
    } catch (err) {
      logger.error("TrailForm: thumbnail upload failed", err);
      onError("Erro ao fazer upload da capa.");
      setThumbPreview("");
    } finally {
      setThumbUploading(false);
    }
  };

  const handleSessionThumb = async (idx: number, file: File) => {
    updateLiveSession(idx, "thumbnail", "");
    try {
      const url = await uploadToR2(file, "thumbnails");
      updateLiveSession(idx, "thumbnail", url);
    } catch (err) {
      logger.error("TrailForm: session thumbnail upload failed", err, { idx });
      onError("Erro ao fazer upload da capa da aula.");
    }
  };

  const toggleCourse = (id: string) =>
    setSelectedCourseIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const moveCourse = (i: number, dir: -1 | 1) => {
    const arr = [...selectedCourseIds];
    const ni = i + dir;
    if (ni < 0 || ni >= arr.length) return;
    [arr[i], arr[ni]] = [arr[ni], arr[i]];
    setSelectedCourseIds(arr);
  };

  const toggleLive = (id: string) =>
    setSelectedLiveIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const moveLive = (i: number, dir: -1 | 1) => {
    const arr = [...selectedLiveIds];
    const ni = i + dir;
    if (ni < 0 || ni >= arr.length) return;
    [arr[i], arr[ni]] = [arr[ni], arr[i]];
    setSelectedLiveIds(arr);
  };

  const addLiveSession = () =>
    setLiveSessions(prev => [...prev, { title: "", description: "", thumbnail: "", scheduledAt: "", target: "free", price: 0 }]);

  const removeLiveSession = (idx: number) =>
    setLiveSessions(prev => prev.filter((_, i) => i !== idx));

  const moveLiveSession = (idx: number, dir: -1 | 1) => {
    const arr = [...liveSessions];
    const ni = idx + dir;
    if (ni < 0 || ni >= arr.length) return;
    [arr[idx], arr[ni]] = [arr[ni], arr[idx]];
    setLiveSessions(arr);
  };

  const updateLiveSession = (idx: number, field: keyof TrailLiveSession, value: string | number) =>
    setLiveSessions(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));

  const handleSave = (status: "draft" | "published") => {
    if (!title.trim()) { onError("O nome da trilha e obrigatorio."); return; }
    onSave({ title: title.trim(), description: description.trim(), thumbnail, type: trailType, level, category, courseIds: selectedCourseIds, liveIds: selectedLiveIds, liveSessions }, status);
  };

  const totalLives = selectedLiveIds.length + liveSessions.length;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">

      <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-gray-800 bg-gray-950 px-6 py-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button" onClick={onBack} aria-label="Voltar"
            className="flex h-8 w-8 items-center justify-center border border-gray-800 bg-gray-900 text-gray-600 hover:border-gray-700 hover:text-gray-300 transition-all shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-700">
              {mode === "create" ? "// criar trilha" : "// editar trilha"}
            </p>
            <p className="text-sm font-semibold text-gray-200 truncate">
              {title || (mode === "create" ? "Nova trilha" : "Editar")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button" onClick={() => handleSave("draft")}
            disabled={saving || thumbUploading}
            className="flex items-center gap-1.5 border border-gray-800 bg-gray-900 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-gray-500 hover:border-gray-700 hover:text-gray-300 disabled:opacity-40 transition-all"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Rascunho
          </button>
          <button
            type="button" onClick={() => handleSave("published")}
            disabled={saving || thumbUploading}
            className="flex items-center gap-1.5 bg-purple px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-white hover:bg-purple-600 disabled:opacity-40 transition-all"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            {mode === "edit" ? "Actualizar" : "Publicar"}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mx-6 mt-4 flex items-center gap-2 border border-red-500 bg-red-500/8 px-4 py-3 text-sm text-red-400 shrink-0">
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          {error}
          <button type="button" onClick={() => onError("")} aria-label="Fechar" className="ml-auto">
            <X className="h-4 w-4 text-red-400 hover:text-red-400 transition-colors" />
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <TrailSettingsPanel
          thumbPreview={thumbPreview}
          thumbUploaded={!!thumbnail}
          thumbUploading={thumbUploading}
          onThumbChange={handleThumbChange}
          title={title} setTitle={setTitle}
          description={description} setDescription={setDescription}
          trailType={trailType} setTrailType={setTrailType}
          level={level} setLevel={setLevel}
          category={category} setCategory={setCategory}
          coursesCount={selectedCourseIds.length}
          livesCount={totalLives}
        />
        <TrailContentPanel
          allCourses={allCourses}
          selectedCourseIds={selectedCourseIds}
          toggleCourse={toggleCourse}
          moveCourse={moveCourse}
          allLives={allLives}
          selectedLiveIds={selectedLiveIds}
          toggleLive={toggleLive}
          moveLive={moveLive}
          liveSessions={liveSessions}
          addLiveSession={addLiveSession}
          removeLiveSession={removeLiveSession}
          moveLiveSession={moveLiveSession}
          updateLiveSession={updateLiveSession}
          onSessionThumb={handleSessionThumb}
        />
      </div>
    </div>
  );
}
