"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from "firebase/firestore";
import { ArrowLeft, Save, Loader2, CheckCircle2, AlertCircle, ImagePlus, X, Plus, Trash2, GripVertical } from "lucide-react";
import Link from "next/link";
import type { Trail, CourseType, CourseLevel, CourseCategory, Course } from "@/types/course";

async function uploadToR2(file: File, folder: string): Promise<string> {
  const res = await fetch("/api/upload/presign", {
    method: "POST", headers: { "Content-Type": "application/json" },
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

export default function NewTrailPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [trailType, setTrailType] = useState<CourseType>("smart");
  const [level, setLevel] = useState<CourseLevel>("beginner");
  const [category, setCategory] = useState<CourseCategory>("tech");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const thumbInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getDocs(query(collection(db, "courses"), orderBy("title"))).then((snap) => {
      setAllCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course)));
    }).catch(console.error);
  }, []);

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setThumbnailPreview(URL.createObjectURL(file));
    setThumbnailUploading(true);
    try { const url = await uploadToR2(file, "thumbnails"); setThumbnail(url); }
    catch { setError("Erro ao fazer upload da capa."); setThumbnailPreview(""); }
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

  const handleSave = async (status: "draft" | "published") => {
    if (!title.trim()) { setError("O nome da trilha é obrigatório."); return; }
    setSaving(true); setError("");
    try {
      await addDoc(collection(db, "trails"), {
        title: title.trim(), description: description.trim(), thumbnail,
        type: trailType, level, category, status,
        courseIds: selectedCourseIds,
        coursesCount: selectedCourseIds.length,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      } as Omit<Trail, "id">);
      setSuccess(true);
      setTimeout(() => router.push("/admin/trails"), 1500);
    } catch { setError("Erro ao guardar. Tenta novamente."); }
    finally { setSaving(false); }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="flex h-16 w-16 items-center justify-center bg-green-500/10">
          <CheckCircle2 className="h-8 w-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Trilha criada!</h2>
        <p className="text-gray-400">A redirecionar...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-4 bg-gray-950/90 backdrop-blur-xl border-b border-gray-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/trails" className="p-2 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white leading-none">Criar Nova Trilha</h1>
            <p className="text-xs text-gray-500 mt-0.5">Agrupe cursos numa sequência de aprendizagem</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => handleSave("draft")} disabled={saving || thumbnailUploading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Rascunho
          </button>
          <button onClick={() => handleSave("published")} disabled={saving || thumbnailUploading}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Publicar Trilha
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
          <button onClick={() => setError("")} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT */}
        <div className="w-[380px] shrink-0 border-r border-gray-800 overflow-y-auto p-6 space-y-6">
          {/* Thumbnail */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Capa da Trilha</label>
            <div onClick={() => thumbInputRef.current?.click()}
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

          {/* Nome */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nome da Trilha *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Trilha de Desenvolvimento Web"
              className="w-full bg-gray-900 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all" />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Descrição</label>
            <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o percurso de aprendizagem..."
              className="w-full bg-gray-900 border border-gray-800 focus:border-blue-500/50 py-2.5 px-3 text-white placeholder-gray-600 text-sm focus:outline-none transition-all resize-none" />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Tipo de Acesso</label>
            <div className="space-y-2">
              {TYPE_OPTIONS.map((t) => (
                <button key={t.value} type="button" onClick={() => setTrailType(t.value)}
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

          {/* Nível + Categoria */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nível</label>
              <select value={level} onChange={(e) => setLevel(e.target.value as CourseLevel)}
                className="w-full bg-gray-900 border border-gray-800 py-2.5 px-3 text-white text-sm focus:outline-none appearance-none cursor-pointer">
                <option value="beginner">Iniciante</option>
                <option value="intermediate">Intermédio</option>
                <option value="advanced">Avançado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Categoria</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as CourseCategory)}
                className="w-full bg-gray-900 border border-gray-800 py-2.5 px-3 text-white text-sm focus:outline-none appearance-none cursor-pointer">
                <option value="tech">Tecnologia</option>
                <option value="finance">Finanças</option>
                <option value="investments">Investimentos</option>
                <option value="other">Outro</option>
              </select>
            </div>
          </div>

          {/* Resumo */}
          <div className="bg-gray-900/60 border border-gray-800 p-4 space-y-2.5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resumo</p>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Cursos</span><span className="text-white font-medium">{selectedCourseIds.length}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">Tipo</span><span className="text-white font-medium capitalize">{trailType}</span></div>
          </div>
        </div>

        {/* RIGHT — Cursos da trilha */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Cursos da Trilha</h2>
            <p className="text-xs text-gray-500 mt-0.5">Seleciona e ordena os cursos que fazem parte desta trilha</p>
          </div>

          {/* Ordem actual */}
          {selectedCourseIds.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Ordem da Trilha</p>
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
                          className="p-1 text-gray-500 hover:text-white disabled:opacity-30 transition-colors">▲</button>
                        <button onClick={() => moveCourse(idx, 1)} disabled={idx === selectedCourseIds.length - 1}
                          className="p-1 text-gray-500 hover:text-white disabled:opacity-30 transition-colors">▼</button>
                      </div>
                      <button onClick={() => toggleCourse(cid)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Todos os cursos disponíveis */}
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Todos os Cursos</p>
          {allCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-gray-500 text-sm">Nenhum curso disponível. Cria cursos primeiro.</p>
              <Link href="/admin/courses/new" className="mt-4 flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors">
                <Plus className="h-4 w-4" /> Criar Curso
              </Link>
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
      </div>
    </div>
  );
}
