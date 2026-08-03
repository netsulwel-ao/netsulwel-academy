"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Save, Loader2, AlertCircle, ImagePlus, X, Plus, Trash2, GripVertical, Radio, Calendar, Crown, Zap, Coins } from "lucide-react";
import Link from "next/link";
import type { Trail, TrailLiveSession, CourseType, CourseLevel, CourseCategory, Course } from "@/types/course";
import type { LiveSession } from "@/types/live";
import { auth } from "@/lib/firebase";

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

const TYPE_OPTIONS: { value: CourseType; label: string; desc: string; color: string }[] = [
  { value: "standalone", label: "Standalone", desc: "Compra individual", color: "blue" },
  { value: "smart", label: "Plano Smart", desc: "Smart e Golden", color: "green" },
  { value: "golden", label: "Plano Golden", desc: "Exclusivo Golden", color: "yellow" },
];

function toDatetimeLocal(iso: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ""; }
}

interface TrailFormProps {
  mode: "create" | "edit";
  initialData?: Partial<Trail>;
  allCourses: Course[];
  allLives: LiveSession[];
  saving: boolean;
  error: string;
  onSave: (data: {
    title: string;
    description: string;
    thumbnail: string;
    type: CourseType;
    level: CourseLevel;
    category: CourseCategory;
    courseIds: string[];
    liveIds: string[];
    liveSessions: TrailLiveSession[];
  }, status: "draft" | "published") => void;
  onError: (msg: string) => void;
  onBack: () => void;
}

export function TrailForm({ mode, initialData, allCourses, allLives, saving, error, onSave, onError, onBack }: TrailFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [thumbnail, setThumbnail] = useState(initialData?.thumbnail ?? "");
  const [thumbnailPreview, setThumbnailPreview] = useState(initialData?.thumbnail ?? "");
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [trailType, setTrailType] = useState<CourseType>(initialData?.type ?? "smart");
  const [level, setLevel] = useState<CourseLevel>(initialData?.level ?? "beginner");
  const [category, setCategory] = useState<CourseCategory>(initialData?.category ?? "tech");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(initialData?.courseIds ?? []);
  const [selectedLiveIds, setSelectedLiveIds] = useState<string[]>(initialData?.liveIds ?? []);
  const [liveSessions, setLiveSessions] = useState<TrailLiveSession[]>(initialData?.liveSessions ?? []);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const sessionThumbInputs = useRef<Map<number, HTMLInputElement>>(new Map());

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title ?? "");
      setDescription(initialData.description ?? "");
      setThumbnail(initialData.thumbnail ?? "");
      setThumbnailPreview(initialData.thumbnail ?? "");
      setTrailType(initialData.type ?? "smart");
      setLevel(initialData.level ?? "beginner");
      setCategory(initialData.category ?? "tech");
      setSelectedCourseIds(initialData.courseIds ?? []);
      setSelectedLiveIds(initialData.liveIds ?? []);
      setLiveSessions(initialData.liveSessions ?? []);
    }
  }, [initialData]);

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setThumbnailPreview(URL.createObjectURL(file));
    setThumbnailUploading(true);
    try { const url = await uploadToR2(file, "thumbnails"); setThumbnail(url); }
    catch { onError("Erro ao fazer upload da capa."); }
    finally { setThumbnailUploading(false); }
  };

  const toggleCourse = (id: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const moveCourse = (index: number, dir: -1 | 1) => {
    const arr = [...selectedCourseIds];
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[index], arr[newIdx]] = [arr[newIdx], arr[index]];
    setSelectedCourseIds(arr);
  };

  const toggleLive = (id: string) => {
    setSelectedLiveIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const moveLive = (index: number, dir: -1 | 1) => {
    const arr = [...selectedLiveIds];
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[index], arr[newIdx]] = [arr[newIdx], arr[index]];
    setSelectedLiveIds(arr);
  };

  const addLiveSession = () => {
    setLiveSessions((prev) => [
      ...prev,
      { title: "", description: "", thumbnail: "", scheduledAt: "", target: "free", price: 0 },
    ]);
  };

  const updateLiveSession = (idx: number, field: keyof TrailLiveSession, value: string | number) => {
    setLiveSessions((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  };

  const removeLiveSession = (idx: number) => {
    setLiveSessions((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveLiveSession = (idx: number, dir: -1 | 1) => {
    const arr = [...liveSessions];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setLiveSessions(arr);
  };

  const handleSessionThumbnail = async (idx: number, file: File) => {
    updateLiveSession(idx, "thumbnail", "");
    try {
      const url = await uploadToR2(file, "thumbnails");
      updateLiveSession(idx, "thumbnail", url);
    } catch {
      onError("Erro ao fazer upload da capa da aula.");
    }
  };

  const handleSave = (status: "draft" | "published") => {
    if (!title.trim()) {
      onError("O nome da trilha é obrigatório.");
      return;
    }
    onSave({ title: title.trim(), description: description.trim(), thumbnail, type: trailType, level, category, courseIds: selectedCourseIds, liveIds: selectedLiveIds, liveSessions }, status);
  };

  const totalLiveCount = selectedLiveIds.length + liveSessions.length;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-4 bg-gray-950/90 backdrop-blur-xl border-b border-gray-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} aria-label="Voltar" className="p-2 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white leading-none">{mode === "create" ? "Criar Nova Trilha" : "Editar Trilha"}</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {mode === "create" ? "Agrupe cursos e aulas ao vivo numa sequência de aprendizagem" : "Altere os cursos, aulas ao vivo e cronograma da trilha"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => handleSave("draft")} disabled={saving || thumbnailUploading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="w-4 h-4" />} Rascunho
          </button>
          <button onClick={() => handleSave("published")} disabled={saving || thumbnailUploading}
            className="flex items-center gap-2 px-5 py-2 bg-purple hover:bg-purple-light text-white text-sm font-bold transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="w-4 h-4" />} {mode === "create" ? "Publicar Trilha" : "Publicar"}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mx-6 mt-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
          <button onClick={() => onError("")} aria-label="Fechar erro" className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* LEFT */}
        <div className="w-full lg:w-[380px] shrink-0 border-b lg:border-b-0 lg:border-r border-gray-800 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Capa da Trilha</label>
            <div onClick={() => thumbInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); thumbInputRef.current?.click(); } }}
              role="button" tabIndex={0} aria-label="Carregar capa da trilha"
              className="relative w-full aspect-video bg-gray-900 border border-dashed border-gray-700 hover:border-blue-500/50 cursor-pointer overflow-hidden group transition-colors">
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500 group-hover:text-blue-400 transition-colors">
                  <ImagePlus className="h-10 w-10" />
                  <span className="text-sm font-medium">Clique para carregar</span>
                </div>
              )}
              {thumbnailUploading && <div className="absolute inset-0 bg-gray-950/70 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-400" /></div>}
            </div>
            <input ref={thumbInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleThumbnailChange} />
          </div>

          <div>
            <label htmlFor="trail-title" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nome da Trilha *</label>
            <input id="trail-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Trilha de Desenvolvimento Web"
              className="w-full bg-gray-900 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all" />
          </div>

          <div>
            <label htmlFor="trail-desc" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Descrição</label>
            <textarea id="trail-desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o percurso de aprendizagem..."
              className="w-full bg-gray-900 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all resize-none" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Tipo de Acesso</label>
            <div role="radiogroup" aria-label="Tipo de acesso" className="space-y-2">
              {TYPE_OPTIONS.map((t) => (
                <button key={t.value} type="button" onClick={() => setTrailType(t.value)}
                  role="radio" aria-checked={trailType === t.value}
                  className={`w-full flex items-center gap-3 px-4 py-3 border text-left transition-all ${
                    trailType === t.value
                      ? t.color === "blue" ? "border-blue-500/50 bg-blue-500/10"
                        : t.color === "green" ? "border-green-500/50 bg-green-500/10"
                        : "border-yellow-500/50 bg-yellow-500/10"
                      : "border-gray-800 bg-gray-900 hover:border-gray-700"
                  }`}>
                  <div className={`h-3 w-3 rounded-full shrink-0 ${trailType === t.value ? t.color === "blue" ? "bg-blue-400" : t.color === "green" ? "bg-green-400" : "bg-yellow-400" : "bg-gray-700"}`} />
                  <div>
                    <p className={`text-sm font-bold ${trailType === t.value ? t.color === "blue" ? "text-blue-400" : t.color === "green" ? "text-green-400" : "text-yellow-400" : "text-gray-300"}`}>{t.label}</p>
                    <p className="text-xs text-gray-500">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="trail-level" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nível</label>
              <select id="trail-level" value={level} onChange={(e) => setLevel(e.target.value as CourseLevel)}
                className="w-full bg-gray-900 border border-gray-800 py-2.5 px-3 text-white text-sm focus:outline-none appearance-none cursor-pointer">
                <option value="beginner">Iniciante</option>
                <option value="intermediate">Intermédio</option>
                <option value="advanced">Avançado</option>
              </select>
            </div>
            <div>
              <label htmlFor="trail-category" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Categoria</label>
              <select id="trail-category" value={category} onChange={(e) => setCategory(e.target.value as CourseCategory)}
                className="w-full bg-gray-900 border border-gray-800 py-2.5 px-3 text-white text-sm focus:outline-none appearance-none cursor-pointer">
                <option value="tech">Tecnologia</option>
                <option value="finance">Finanças</option>
                <option value="investments">Investimentos</option>
                <option value="other">Outro</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-900/60 border border-gray-800 p-4 space-y-2.5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resumo</p>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Cursos</span><span className="text-white font-medium">{selectedCourseIds.length}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Aulas ao Vivo</span><span className="text-white font-medium">{totalLiveCount} ({selectedLiveIds.length} existentes + {liveSessions.length} próprias)</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Tipo</span><span className="text-white font-medium capitalize">{trailType}</span></div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-10">
          {/* ── CURSOS ── */}
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white">Cursos da Trilha</h2>
              <p className="text-xs text-gray-500 mt-0.5">Seleciona e ordena os cursos que fazem parte desta trilha</p>
            </div>

            {selectedCourseIds.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Ordem dos Cursos</p>
                <div className="space-y-2">
                  {selectedCourseIds.map((cid, idx) => {
                    const course = allCourses.find((c) => c.id === cid);
                    if (!course) return null;
                    return (
                      <div key={cid} className="flex items-center gap-3 bg-gray-900 border border-gray-800 px-4 py-3">
                        <GripVertical className="h-4 w-4 text-gray-600 shrink-0" />
                        <span className="text-xs font-bold text-blue-400 w-6 shrink-0">{idx + 1}</span>
                        <span className="flex-1 text-sm text-white truncate">{course.title}</span>
                        <div className="flex gap-1">
                          <button onClick={() => moveCourse(idx, -1)} disabled={idx === 0}
                            aria-label={`Mover curso ${course.title} para cima`}
                            className="p-1 text-gray-500 hover:text-white disabled:opacity-30 transition-colors">▲</button>
                          <button onClick={() => moveCourse(idx, 1)} disabled={idx === selectedCourseIds.length - 1}
                            aria-label={`Mover curso ${course.title} para baixo`}
                            className="p-1 text-gray-500 hover:text-white disabled:opacity-30 transition-colors">▼</button>
                        </div>
                        <button onClick={() => toggleCourse(cid)} aria-label={`Remover curso ${course.title}`} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Todos os Cursos</p>
            {allCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-gray-500 text-sm">Nenhum curso disponível.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {allCourses.map((course) => {
                  const selected = selectedCourseIds.includes(course.id!);
                  return (
                    <button key={course.id} type="button" onClick={() => toggleCourse(course.id!)}
                      className={`flex items-center gap-3 p-4 border text-left transition-all ${
                        selected ? "border-blue-500/50 bg-blue-500/10" : "border-gray-800 bg-gray-900/50 hover:border-gray-700"
                      }`}>
                      <div className={`h-5 w-5 shrink-0 border-2 flex items-center justify-center transition-colors ${selected ? "border-blue-500 bg-blue-500" : "border-gray-600"}`}>
                        {selected && <span className="text-white text-xs font-bold">✓</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{course.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 capitalize">{course.type} · {course.level}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── LIVES ── */}
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Radio className="h-5 w-5 text-red-400" /> Aulas ao Vivo na Trilha
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Seleciona e ordena as aulas ao vivo que fazem parte desta trilha</p>
            </div>

            {selectedLiveIds.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Ordem das Aulas</p>
                <div className="space-y-2">
                  {selectedLiveIds.map((lid, idx) => {
                    const live = allLives.find((l) => l.id === lid);
                    if (!live) return null;
                    return (
                      <div key={lid} className="flex items-center gap-3 bg-gray-900 border border-gray-800 px-4 py-3">
                        <GripVertical className="h-4 w-4 text-gray-600 shrink-0" />
                        <span className="text-xs font-bold text-red-400 w-6 shrink-0">{idx + 1}</span>
                        <span className="flex-1 text-sm text-white truncate">{live.title}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 border ${
                          live.status === "live" ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : live.status === "scheduled" ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                        }`}>
                          {live.status === "live" ? "AO VIVO" : live.status === "scheduled" ? "Agendada" : "Encerrada"}
                        </span>
                        <div className="flex gap-1">
                          <button onClick={() => moveLive(idx, -1)} disabled={idx === 0}
                            aria-label={`Mover aula ${live.title} para cima`}
                            className="p-1 text-gray-500 hover:text-white disabled:opacity-30 transition-colors">▲</button>
                          <button onClick={() => moveLive(idx, 1)} disabled={idx === selectedLiveIds.length - 1}
                            aria-label={`Mover aula ${live.title} para baixo`}
                            className="p-1 text-gray-500 hover:text-white disabled:opacity-30 transition-colors">▼</button>
                        </div>
                        <button onClick={() => toggleLive(lid)} aria-label={`Remover aula ${live.title}`} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Todas as Aulas ao Vivo</p>
            {allLives.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-gray-500 text-sm">Nenhuma aula ao vivo disponível.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {allLives.map((live) => {
                  const selected = selectedLiveIds.includes(live.id!);
                  return (
                    <button key={live.id} type="button" onClick={() => toggleLive(live.id!)}
                      className={`flex items-center gap-3 p-4 border text-left transition-all ${
                        selected ? "border-red-500/50 bg-red-500/10" : "border-gray-800 bg-gray-900/50 hover:border-gray-700"
                      }`}>
                      <div className={`h-5 w-5 shrink-0 border-2 flex items-center justify-center transition-colors ${selected ? "border-red-500 bg-red-500" : "border-gray-600"}`}>
                        {selected && <span className="text-white text-xs font-bold">✓</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{live.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {live.status === "live" ? "Ao Vivo agora"
                            : live.status === "scheduled"
                              ? `Agendada: ${new Date(live.scheduledAt).toLocaleDateString("pt-PT")}`
                              : "Encerrada"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── AULAS PRÓPRIAS ── */}
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Radio className="h-5 w-5 text-orange-400" /> {mode === "create" ? "Aulas Próprias da Trilha" : "Cronograma da Trilha"}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Adiciona aulas ao vivo com data, capa, descrição e plano de acesso</p>
            </div>

            {liveSessions.length > 0 && (
              <div className="mb-4 space-y-4">
                {liveSessions.map((sess, idx) => (
                  <div key={idx} className="bg-gray-900 border border-gray-800 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-950/50 border-b border-gray-800">
                      <div className="flex items-center gap-2">
                        <button onClick={() => moveLiveSession(idx, -1)} disabled={idx === 0}
                          aria-label={`Mover aula #${idx + 1} para cima`}
                          className="p-0.5 text-gray-600 hover:text-white disabled:opacity-20 transition-colors">▲</button>
                        <span className="text-xs font-bold text-orange-400">Aula #{idx + 1}</span>
                        <button onClick={() => moveLiveSession(idx, 1)} disabled={idx === liveSessions.length - 1}
                          aria-label={`Mover aula #${idx + 1} para baixo`}
                          className="p-0.5 text-gray-600 hover:text-white disabled:opacity-20 transition-colors">▼</button>
                      </div>
                      <button onClick={() => removeLiveSession(idx)}
                        aria-label="Remover aula ao vivo"
                        className="p-1 text-gray-600 hover:text-red-400 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="p-4 space-y-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="w-full sm:w-28 shrink-0">
                          <div onClick={() => sessionThumbInputs.current.get(idx)?.click()}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); sessionThumbInputs.current.get(idx)?.click(); } }}
                            role="button" tabIndex={0} aria-label="Carregar capa da aula"
                            className="relative aspect-video bg-gray-800 border border-dashed border-gray-700 hover:border-orange-500/50 cursor-pointer overflow-hidden group transition-colors">
                            {sess.thumbnail ? (
                               <img src={sess.thumbnail} alt={sess.title || "Aula ao vivo"} className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full gap-1 text-gray-500 group-hover:text-orange-400">
                                <ImagePlus className="h-6 w-6" />
                                <span className="text-[10px] font-medium">Capa</span>
                              </div>
                            )}
                          </div>
                          <input ref={(el) => { if (el) sessionThumbInputs.current.set(idx, el); }}
                            type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSessionThumbnail(idx, f); }} />
                        </div>

                        <div className="flex-1 space-y-2">
                          <input type="text" value={sess.title} placeholder="Título da aula ao vivo"
                            onChange={(e) => updateLiveSession(idx, "title", e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 focus:border-orange-500/50 py-2 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all" />
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                            <input type="datetime-local" value={toDatetimeLocal(sess.scheduledAt)}
                              onChange={(e) => updateLiveSession(idx, "scheduledAt", e.target.value)}
                              className="w-full bg-gray-800 border border-gray-700 focus:border-orange-500/50 py-2 pl-10 pr-3 text-white text-sm focus:outline-none transition-all" />
                          </div>
                        </div>
                      </div>

                      <textarea rows={2} value={sess.description} placeholder="Descrição da aula (opcional)"
                        onChange={(e) => updateLiveSession(idx, "description", e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 focus:border-orange-500/50 py-2 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all resize-none" />

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Plano de Acesso</label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: "free" as const, label: "Grátis", icon: Radio, color: "text-green-400 bg-green-500/10 border-green-500/20" },
                            { value: "smart" as const, label: "Smart", icon: Zap, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
                            { value: "golden" as const, label: "Golden", icon: Crown, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
                            { value: "standalone" as const, label: "Standalone", icon: Coins, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
                          ].map((opt) => {
                            const Icon = opt.icon;
                            const selected = sess.target === opt.value;
                            return (
                              <button key={opt.value} type="button"
                                onClick={() => updateLiveSession(idx, "target", opt.value)}
                                className={`flex items-center gap-1.5 px-3 py-2 border text-xs font-bold transition-all ${
                                  selected ? opt.color : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                                }`}>
                                <Icon className={`h-3.5 w-3.5 ${selected ? "" : "text-gray-500"}`} />
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                        {sess.target === "standalone" && (
                          <div className="mt-2 flex items-center gap-2">
                            <Coins className="h-4 w-4 text-purple-400" />
                            <input type="number" min={0} step={100} value={sess.price || ""}
                              onChange={(e) => updateLiveSession(idx, "price", Number(e.target.value) || 0)}
                              placeholder="Preço (Kz)"
                              className="w-full sm:w-40 bg-gray-800 border border-gray-700 focus:border-purple-500/50 py-1.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all" />
                            <span className="text-xs text-gray-500">Kz</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button type="button" onClick={addLiveSession}
              className="flex items-center gap-2 w-full border-2 border-dashed border-gray-700 hover:border-orange-500/50 py-3 justify-center text-sm font-medium text-gray-400 hover:text-orange-400 transition-colors">
              <Plus className="h-4 w-4" /> Adicionar Aula ao Vivo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
