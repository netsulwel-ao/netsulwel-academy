"use client";

import { ImagePlus, Loader2, CheckCircle2, Sparkles, Award, Tag, Plus, X, Video, Radio } from "lucide-react";
import type { CourseType, CourseLevel, CourseCategory, CourseFormat, Trail } from "@/types/course";
import { COURSE_TYPES, LEVELS, CATEGORIES, inputCls, selectCls } from "../_types/courseForm";

// ── Shared UI atoms ───────────────────────────────────────────
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-600 mb-2">
      {children}{required && <span className="text-red-400/80 ml-1">*</span>}
    </p>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center border transition-colors ${
        checked ? "bg-purple border-purple/60" : "bg-gray-800 border-gray-700"
      }`}
    >
      <span className={`inline-block h-3 w-3 bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-1"}`} />
    </button>
  );
}

// ── Props ─────────────────────────────────────────────────────
interface FormLeftPanelProps {
  // thumbnail
  thumbnailPreview: string;
  thumbnailUploading: boolean;
  thumbnail: string;
  thumbInputRef: React.RefObject<HTMLInputElement | null>;
  onThumbnailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // basic
  title: string; setTitle: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  generatingDesc: boolean;
  onGenerateDesc: () => void;
  // type / format
  courseType: CourseType; setCourseType: (v: CourseType) => void;
  format: CourseFormat;   setFormat: (v: CourseFormat) => void;
  // price / access code
  price: string;         setPrice: (v: string) => void;
  accessCode: string;    setAccessCode: (v: string) => void;
  onGenerateCode: () => void;
  // meta
  level: CourseLevel;       setLevel: (v: CourseLevel) => void;
  category: CourseCategory; setCategory: (v: CourseCategory) => void;
  hasCertificate: boolean;  setHasCertificate: (v: boolean) => void;
  featured: boolean;        setFeatured: (v: boolean) => void;
  // trail
  trailId: string;    setTrailId: (v: string) => void;
  trailOrder: string; setTrailOrder: (v: string) => void;
  trails: Trail[];
  // tags
  tagInput: string; setTagInput: (v: string) => void;
  tags: string[];
  onAddTag: () => void;
  onRemoveTag: (t: string) => void;
  // summary
  modulesCount: number;
  lessonsCount: number;
}

export function FormLeftPanel({
  thumbnailPreview, thumbnailUploading, thumbnail, thumbInputRef, onThumbnailChange,
  title, setTitle, description, setDescription, generatingDesc, onGenerateDesc,
  courseType, setCourseType, format, setFormat,
  price, setPrice, accessCode, setAccessCode, onGenerateCode,
  level, setLevel, category, setCategory,
  hasCertificate, setHasCertificate, featured, setFeatured,
  trailId, setTrailId, trailOrder, setTrailOrder, trails,
  tagInput, setTagInput, tags, onAddTag, onRemoveTag,
  modulesCount, lessonsCount,
}: FormLeftPanelProps) {
  const isFree = courseType === "standalone" && (!price || parseFloat(price) <= 0);

  return (
    <div className="w-full lg:w-[360px] shrink-0 border-b lg:border-b-0 lg:border-r border-gray-800 overflow-y-auto p-6 space-y-6">

      {/* Thumbnail */}
      <div>
        <FieldLabel>Capa do Curso</FieldLabel>
        <div
          onClick={() => thumbInputRef.current?.click()}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); thumbInputRef.current?.click(); } }}
          role="button" tabIndex={0} aria-label="Carregar capa do curso"
          className="relative w-full aspect-video border border-dashed border-gray-800 bg-gray-900 hover:border-purple/30 cursor-pointer overflow-hidden group transition-colors"
        >
          {thumbnailPreview ? (
            <>
              <img src={thumbnailPreview} alt="preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gray-950 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ImagePlus className="h-6 w-6 text-white" />
              </div>
              {thumbnailUploading && (
                <div className="absolute inset-0 bg-gray-950 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-purple/70" />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-700 group-hover:text-gray-500 transition-colors">
              <ImagePlus className="h-8 w-8" strokeWidth={1} />
              <p className="font-mono text-[13px] uppercase tracking-widest">PNG · JPG · WEBP</p>
            </div>
          )}
        </div>
        <input ref={thumbInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onThumbnailChange} />
        {thumbnailUploading && (
          <p className="mt-1.5 font-mono text-[13px] text-gray-600 flex items-center gap-1">
            <Loader2 className="h-2.5 w-2.5 animate-spin" /> A enviar...
          </p>
        )}
        {thumbnail && !thumbnailUploading && (
          <p className="mt-1.5 font-mono text-[13px] text-green/60 flex items-center gap-1">
            <CheckCircle2 className="h-2.5 w-2.5" /> Upload concluído
          </p>
        )}
      </div>

      {/* Nome */}
      <div>
        <FieldLabel required>Nome do Curso</FieldLabel>
        <input
          type="text" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Ex: Formação Completa em JavaScript"
          className={inputCls}
        />
      </div>

      {/* Descrição + IA */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <FieldLabel>Descrição</FieldLabel>
          <button
            type="button" onClick={onGenerateDesc}
            disabled={generatingDesc || !title.trim()}
            className="flex items-center gap-1 font-mono text-[13px] uppercase tracking-widest text-purple/60 hover:text-purple/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {generatingDesc ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />}
            {generatingDesc ? "A gerar..." : "IA"}
          </button>
        </div>
        <div className="relative">
          <textarea
            rows={4} value={description} onChange={e => setDescription(e.target.value)}
            placeholder="O que os alunos vão aprender..."
            className={`${inputCls} resize-none`}
          />
          {generatingDesc && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <div className="flex items-center gap-1.5 text-purple/70 font-mono text-[13px]">
                <Sparkles className="h-3 w-3 animate-pulse" /> A gerar...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tipo de acesso */}
      <div>
        <FieldLabel>Tipo de Acesso</FieldLabel>
        <div className="space-y-1.5">
          {COURSE_TYPES.map(t => (
            <button
              key={t.value} type="button"
              onClick={() => setCourseType(t.value)}
              className={`w-full flex items-center gap-3 border px-3 py-2.5 text-left transition-all ${
                courseType === t.value
                  ? "border-purple/30 bg-purple/8"
                  : "border-gray-800 bg-gray-900 hover:border-gray-700"
              }`}
            >
              <span className={`h-2 w-2 shrink-0 border ${courseType === t.value ? "bg-purple/70 border-purple/50" : "border-gray-700"}`} />
              <div>
                <p className={`text-sm font-semibold ${courseType === t.value ? "text-purple/90" : "text-gray-400"}`}>{t.label}</p>
                <p className="font-mono text-[13px] text-gray-700">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Formato */}
      <div>
        <FieldLabel>Formato</FieldLabel>
        <div className="grid grid-cols-2 gap-1.5">
          {([["recorded", "Gravado", Video], ["live", "Ao Vivo", Radio]] as const).map(([val, lbl, Icon]) => (
            <button
              key={val} type="button" onClick={() => setFormat(val as CourseFormat)}
              className={`flex items-center justify-center gap-2 border py-2.5 text-sm font-semibold transition-all ${
                format === val
                  ? val === "live"
                    ? "border-red-500/30 bg-red-500/8 text-red-400/80"
                    : "border-purple/30 bg-purple/8 text-purple/80"
                  : "border-gray-800 bg-gray-900 text-gray-600 hover:border-gray-700"
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.5} /> {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Preço */}
      {courseType === "standalone" && (
        <div>
          <FieldLabel>Preço (Kz)</FieldLabel>
          <div className="relative">
            <span className="absolute left-3 top-2.5 font-mono text-[13px] text-gray-600">Kz</span>
            <input
              type="number" min="0" value={price} onChange={e => setPrice(e.target.value)}
              placeholder="0 = Gratuito"
              className={`${inputCls} pl-8`}
            />
          </div>
        </div>
      )}

      {/* Código de acesso */}
      {isFree && (
        <div>
          <FieldLabel>Código de Acesso</FieldLabel>
          <p className="font-mono text-[13px] text-gray-700 mb-2">Opcional — os alunos precisam deste código para entrar.</p>
          <div className="flex items-center gap-1.5">
            <input
              type="text" value={accessCode}
              onChange={e => setAccessCode(e.target.value.toUpperCase())}
              placeholder="Ex: MAT-7X9K"
              className={`${inputCls} flex-1 font-mono tracking-wider`}
            />
            <button
              type="button" onClick={onGenerateCode}
              className="border border-gray-800 bg-gray-900 px-3 py-2.5 font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:text-gray-300 hover:border-gray-600 transition-all whitespace-nowrap"
            >
              Gerar
            </button>
          </div>
        </div>
      )}

      {/* Nível + Categoria */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Nível</FieldLabel>
          <select value={level} onChange={e => setLevel(e.target.value as CourseLevel)} className={selectCls}>
            {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel>Categoria</FieldLabel>
          <select value={category} onChange={e => setCategory(e.target.value as CourseCategory)} className={selectCls}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {/* Certificado + Destaque */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border border-gray-800 bg-gray-900 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Award className={`h-4 w-4 shrink-0 ${hasCertificate ? "text-amber-400/70" : "text-gray-700"}`} strokeWidth={1.5} />
            <div>
              <p className="text-sm text-gray-300">Certificado</p>
              <p className="font-mono text-[13px] text-gray-700">Gerado ao completar 100%</p>
            </div>
          </div>
          <Toggle checked={hasCertificate} onChange={() => setHasCertificate(!hasCertificate)} label="Activar certificado" />
        </div>
        <div className="flex items-center justify-between border border-gray-800 bg-gray-900 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className={`h-4 w-4 shrink-0 ${featured ? "text-purple/70" : "text-gray-700"}`} strokeWidth={1.5} />
            <div>
              <p className="text-sm text-gray-300">Destaque</p>
              <p className="font-mono text-[13px] text-gray-700">Aparece na landing page</p>
            </div>
          </div>
          <Toggle checked={featured} onChange={() => setFeatured(!featured)} label="Destacar na landing page" />
        </div>
      </div>

      {/* Trilha */}
      <div>
        <FieldLabel>Trilha (opcional)</FieldLabel>
        <select value={trailId} onChange={e => setTrailId(e.target.value)} className={`${selectCls} mb-2`}>
          <option value="">— Nenhuma —</option>
          {trails.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
        {trailId && (
          <input
            type="number" min="1" value={trailOrder}
            onChange={e => setTrailOrder(e.target.value)}
            placeholder="Posição na trilha (ex: 1)"
            className={inputCls}
          />
        )}
      </div>

      {/* Tags */}
      <div>
        <FieldLabel>Tags</FieldLabel>
        <div className="flex gap-1.5 mb-2">
          <div className="relative flex-1">
            <Tag className="absolute left-2.5 top-2.5 h-3 w-3 text-gray-700" strokeWidth={1.5} />
            <input
              type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onAddTag(); } }}
              placeholder="javascript, react..."
              className={`${inputCls} pl-7`}
            />
          </div>
          <button
            type="button" onClick={onAddTag}
            className="border border-gray-800 bg-gray-900 px-3 text-gray-600 hover:text-gray-300 hover:border-gray-600 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map(t => (
              <span key={t} className="flex items-center gap-1 border border-purple/20 bg-purple/8 px-2 py-0.5 font-mono text-[13px] text-purple/70">
                {t}
                <button type="button" onClick={() => onRemoveTag(t)} aria-label={`Remover tag ${t}`}>
                  <X className="h-2.5 w-2.5 hover:text-white transition-colors" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Resumo */}
      <div className="border border-gray-800 bg-gray-900 p-4 space-y-2">
        <p className="font-mono text-[13px] uppercase tracking-[0.2em] text-gray-700 mb-3">// resumo</p>
        {[
          ["Módulos",     String(modulesCount)],
          ["Aulas",       String(lessonsCount)],
          ["Tipo",        courseType],
          ["Formato",     format],
          ...(courseType === "standalone" ? [["Preço", price ? `${parseInt(price).toLocaleString("pt-AO")} Kz` : "Gratuito"]] : []),
          ["Certificado", hasCertificate ? "Sim" : "Não"],
          ["Destaque",    featured ? "Sim" : "Não"],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{k}</span>
            <span className="font-mono text-sm text-gray-300">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
