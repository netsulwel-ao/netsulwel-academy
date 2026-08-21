"use client";

import { useRef } from "react";
import { ImagePlus, Loader2, CheckCircle2, Plus, X, Tag } from "lucide-react";
import type { CourseType, CourseLevel, CourseCategory } from "@/types/course";

const inputCls =
  "w-full border border-gray-800 bg-gray-900 py-2.5 px-3 text-sm text-gray-200 placeholder-gray-700 focus:border-purple/30 focus:outline-none transition-colors";
const selectCls =
  "w-full border border-gray-800 bg-gray-900 py-2.5 px-3 text-sm text-gray-200 focus:border-purple/30 focus:outline-none appearance-none cursor-pointer transition-colors";

const TYPE_OPTIONS: { value: CourseType; label: string; desc: string }[] = [
  { value: "standalone", label: "Standalone",   desc: "Compra individual em Kz" },
];

interface Props {
  thumbPreview: string;
  thumbUploaded: boolean;
  thumbUploading: boolean;
  onThumbChange: (file: File) => void;
  title: string; setTitle: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  trailType: CourseType; setTrailType: (v: CourseType) => void;
  level: CourseLevel; setLevel: (v: CourseLevel) => void;
  category: CourseCategory; setCategory: (v: CourseCategory) => void;
  coursesCount: number;
  livesCount: number;
}

export function TrailSettingsPanel({
  thumbPreview, thumbUploaded, thumbUploading, onThumbChange,
  title, setTitle, description, setDescription,
  trailType, setTrailType, level, setLevel, category, setCategory,
  coursesCount, livesCount,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-full lg:w-[340px] shrink-0 border-b lg:border-b-0 lg:border-r border-gray-800 overflow-y-auto p-6 space-y-6">

      {/* Thumbnail */}
      <div>
        <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-600 mb-2">// capa da trilha</p>
        <div
          role="button" tabIndex={0} aria-label="Carregar capa"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
          className="relative w-full aspect-video border border-gray-800 bg-gray-900 cursor-pointer overflow-hidden group hover:border-purple/30 transition-colors"
        >
          {thumbPreview ? (
            <>
              <img src={thumbPreview} alt="preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gray-950 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ImagePlus className="h-7 w-7 text-white" strokeWidth={1.5} />
              </div>
              {thumbUploading && (
                <div className="absolute inset-0 bg-gray-950 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-purple" />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-700 group-hover:text-gray-500 transition-colors">
              <ImagePlus className="h-8 w-8" strokeWidth={1} />
              <span className="font-mono text-[13px] uppercase tracking-widest">Clique para carregar</span>
            </div>
          )}
        </div>
        <input
          ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onThumbChange(f); }}
        />
        {thumbUploading && (
          <p className="mt-1.5 font-mono text-[13px] text-purple/60 flex items-center gap-1">
            <Loader2 className="h-2.5 w-2.5 animate-spin" /> A enviar...
          </p>
        )}
        {thumbUploaded && !thumbUploading && (
          <p className="mt-1.5 font-mono text-[13px] text-green/60 flex items-center gap-1">
            <CheckCircle2 className="h-2.5 w-2.5" /> Upload concluído
          </p>
        )}
      </div>

      {/* Título */}
      <div>
        <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-600 mb-2">
          // nome da trilha <span className="text-red-400/80">*</span>
        </p>
        <input
          type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Trilha de Desenvolvimento Web"
          className={inputCls}
        />
      </div>

      {/* Descrição */}
      <div>
        <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-600 mb-2">// descrição</p>
        <textarea
          rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreve o percurso de aprendizagem..."
          className={`${inputCls} resize-none`}
        />
      </div>

      {/* Tipo de acesso */}
      <div>
        <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-600 mb-2">// tipo de acesso</p>
        <div className="space-y-1.5">
          {TYPE_OPTIONS.map((t) => (
            <button
              key={t.value} type="button" onClick={() => setTrailType(t.value)}
              className={`w-full flex items-center gap-3 px-4 py-3 border text-left transition-all ${
                trailType === t.value
                  ? "border-purple/40 bg-purple/8"
                  : "border-gray-800 bg-gray-900 hover:border-gray-700"
              }`}
            >
              <span className={`h-2 w-2 shrink-0 ${trailType === t.value ? "bg-purple" : "bg-gray-700"}`} />
              <div>
                <p className={`text-sm font-semibold ${trailType === t.value ? "text-purple/80" : "text-gray-400"}`}>
                  {t.label}
                </p>
                <p className="font-mono text-[13px] text-gray-700">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Nível + Categoria */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-600 mb-2">// nível</p>
          <select value={level} onChange={(e) => setLevel(e.target.value as CourseLevel)} className={selectCls}>
            <option value="beginner">Iniciante</option>
            <option value="intermediate">Intermédio</option>
            <option value="advanced">Avançado</option>
          </select>
        </div>
        <div>
          <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-600 mb-2">// categoria</p>
          <select value={category} onChange={(e) => setCategory(e.target.value as CourseCategory)} className={selectCls}>
            <option value="tech">Tecnologia</option>
            <option value="finance">Finanças</option>
            <option value="investments">Investimentos</option>
            <option value="other">Outro</option>
          </select>
        </div>
      </div>

      {/* Resumo */}
      <div className="border border-gray-800 bg-gray-900 p-4 space-y-2">
        <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">// resumo</p>
        {[
          ["Cursos",        String(coursesCount)],
          ["Lives",         String(livesCount)],
          ["Tipo",          trailType],
          ["Nível",         level],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between">
            <span className="font-mono text-[13px] text-gray-600">{k}</span>
            <span className="font-mono text-[13px] text-gray-300 capitalize">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
