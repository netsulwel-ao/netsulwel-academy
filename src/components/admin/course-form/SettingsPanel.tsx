"use client";

import { Loader2, Sparkles, Award, Plus, X, Tag, Radio, Video } from "lucide-react";
import type { CourseType, CourseLevel, CourseCategory, CourseFormat, Trail } from "@/types/course";
import { COURSE_TYPES, LEVELS, CATEGORIES, inputCls, selectCls } from "./_constants";
import { FieldLabel, Toggle } from "./_ui";
import { ThumbnailUpload } from "./ThumbnailUpload";

interface Props {
  // thumbnail
  thumbnailPreview: string;
  thumbnailUploaded: boolean;
  thumbnailUploading: boolean;
  onThumbnailChange: (file: File) => void;
  // basic
  title: string; setTitle: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  generatingDesc: boolean; onGenerateDesc: () => void;
  // type / format
  courseType: CourseType; setCourseType: (v: CourseType) => void;
  format: CourseFormat; setFormat: (v: CourseFormat) => void;
  // price / access
  price: string; setPrice: (v: string) => void;
  accessCode: string; setAccessCode: (v: string) => void;
  // attributes
  level: CourseLevel; setLevel: (v: CourseLevel) => void;
  category: CourseCategory; setCategory: (v: CourseCategory) => void;
  hasCertificate: boolean; setHasCertificate: (v: boolean) => void;
  featured: boolean; setFeatured: (v: boolean) => void;
  // trail
  trails: Trail[];
  trailId: string; setTrailId: (v: string) => void;
  trailOrder: string; setTrailOrder: (v: string) => void;
  // tags
  tagInput: string; setTagInput: (v: string) => void;
  tags: string[]; addTag: () => void; removeTag: (t: string) => void;
  // summary
  modulesCount: number; lessonsCount: number;
}

export function SettingsPanel(p: Props) {
  const isFreeStandalone =
    p.courseType === "standalone" && (!p.price || parseInt(p.price) <= 0);

  return (
    <div className="w-full lg:w-[360px] shrink-0 border-b lg:border-b-0 lg:border-r border-gray-800/60 overflow-y-auto p-6 space-y-6">

      {/* Thumbnail */}
      <ThumbnailUpload
        preview={p.thumbnailPreview}
        uploaded={!!p.thumbnailPreview && !p.thumbnailUploading}
        uploading={p.thumbnailUploading}
        onChange={p.onThumbnailChange}
      />

      {/* Título */}
      <div>
        <FieldLabel required>// nome do curso</FieldLabel>
        <input
          type="text"
          value={p.title}
          onChange={(e) => p.setTitle(e.target.value)}
          placeholder="Ex: Formação Completa em JavaScript"
          className={inputCls}
        />
      </div>

      {/* Descrição + IA */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <FieldLabel>// descrição</FieldLabel>
          <button
            type="button"
            onClick={p.onGenerateDesc}
            disabled={p.generatingDesc || !p.title.trim()}
            className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-purple/60 hover:text-purple/80 disabled:opacity-30 transition-colors"
          >
            {p.generatingDesc
              ? <><Loader2 className="h-2.5 w-2.5 animate-spin" /> A gerar...</>
              : <><Sparkles className="h-2.5 w-2.5" /> Gerar com IA</>
            }
          </button>
        </div>
        <div className="relative">
          <textarea
            rows={4}
            value={p.description}
            onChange={(e) => p.setDescription(e.target.value)}
            placeholder="Descreve o que os alunos vão aprender..."
            className={`${inputCls} resize-none`}
          />
          {p.generatingDesc && (
            <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-purple/60 animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* Tipo de acesso */}
      <div>
        <FieldLabel>// tipo de acesso</FieldLabel>
        <div className="space-y-1.5">
          {COURSE_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => p.setCourseType(t.value)}
              className={`w-full flex items-center gap-3 px-4 py-3 border text-left transition-all ${
                p.courseType === t.value
                  ? "border-purple/40 bg-purple/8"
                  : "border-gray-800/60 bg-gray-900/10 hover:border-gray-700"
              }`}
            >
              <span className={`h-2 w-2 shrink-0 ${p.courseType === t.value ? "bg-purple" : "bg-gray-700"}`} />
              <div>
                <p className={`text-sm font-semibold ${p.courseType === t.value ? "text-purple/80" : "text-gray-400"}`}>
                  {t.label}
                </p>
                <p className="font-mono text-[9px] text-gray-700">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Formato */}
      <div>
        <FieldLabel>// formato</FieldLabel>
        <div className="grid grid-cols-2 gap-1.5">
          {([["recorded", "Gravado", Video], ["live", "Ao Vivo", Radio]] as const).map(
            ([val, lbl, Icon]) => (
              <button
                key={val}
                type="button"
                onClick={() => p.setFormat(val as CourseFormat)}
                className={`flex items-center justify-center gap-2 py-2.5 border text-sm transition-all ${
                  p.format === val
                    ? "border-purple/40 bg-purple/8 text-purple/80"
                    : "border-gray-800/60 bg-gray-900/10 text-gray-600 hover:border-gray-700"
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                {lbl}
              </button>
            )
          )}
        </div>
      </div>

      {/* Preço */}
      {p.courseType === "standalone" && (
        <div>
          <FieldLabel>// preço (Kz)</FieldLabel>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-gray-600">Kz</span>
            <input
              type="number"
              min="0"
              value={p.price}
              onChange={(e) => p.setPrice(e.target.value)}
              placeholder="0 = Gratuito"
              className={`${inputCls} pl-10`}
            />
          </div>
        </div>
      )}

      {/* Código de acesso */}
      {isFreeStandalone && (
        <div>
          <FieldLabel>// código de acesso</FieldLabel>
          <p className="font-mono text-[8px] text-gray-700 mb-2">
            Opcional — alunos precisam deste código para entrar.
          </p>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={p.accessCode}
              onChange={(e) => p.setAccessCode(e.target.value.toUpperCase())}
              placeholder="Ex: MAT-7X9K"
              className={`${inputCls} flex-1 font-mono tracking-wider`}
            />
            <button
              type="button"
              onClick={() => {
                const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
                const rand = (n: number) =>
                  Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
                p.setAccessCode(`${rand(4)}-${rand(4)}`);
              }}
              className="border border-gray-800/60 bg-gray-900/10 px-3 font-mono text-[9px] uppercase tracking-widest text-gray-600 hover:border-gray-700 hover:text-gray-400 transition-all whitespace-nowrap"
            >
              Gerar
            </button>
          </div>
        </div>
      )}

      {/* Nível + Categoria */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>// nível</FieldLabel>
          <select value={p.level} onChange={(e) => p.setLevel(e.target.value as CourseLevel)} className={selectCls}>
            {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel>// categoria</FieldLabel>
          <select value={p.category} onChange={(e) => p.setCategory(e.target.value as CourseCategory)} className={selectCls}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {/* Certificado + Destaque */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border border-gray-800/60 bg-gray-900/10 px-4 py-3">
          <div>
            <p className="text-sm text-gray-300 flex items-center gap-2">
              <Award className="h-3.5 w-3.5 text-amber-400/70" strokeWidth={1.5} /> Certificado
            </p>
            <p className="font-mono text-[8px] text-gray-700 mt-0.5">Gerado ao completar 100%</p>
          </div>
          <Toggle checked={p.hasCertificate} onChange={() => p.setHasCertificate(!p.hasCertificate)} label="Ativar certificado" />
        </div>
        <div className="flex items-center justify-between border border-gray-800/60 bg-gray-900/10 px-4 py-3">
          <div>
            <p className="text-sm text-gray-300 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-blue-400/70" strokeWidth={1.5} /> Em destaque
            </p>
            <p className="font-mono text-[8px] text-gray-700 mt-0.5">Aparece na landing page</p>
          </div>
          <Toggle checked={p.featured} onChange={() => p.setFeatured(!p.featured)} label="Destacar na landing page" />
        </div>
      </div>

      {/* Trilha */}
      <div>
        <FieldLabel>// trilha (opcional)</FieldLabel>
        <select value={p.trailId} onChange={(e) => p.setTrailId(e.target.value)} className={`${selectCls} mb-2`}>
          <option value="">— Nenhuma trilha —</option>
          {p.trails.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
        {p.trailId && (
          <input
            type="number"
            min="1"
            value={p.trailOrder}
            onChange={(e) => p.setTrailOrder(e.target.value)}
            placeholder="Posição na trilha (ex: 1)"
            className={inputCls}
          />
        )}
      </div>

      {/* Tags */}
      <div>
        <FieldLabel>// tags</FieldLabel>
        <div className="flex gap-1.5 mb-2">
          <div className="relative flex-1">
            <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-700" />
            <input
              type="text"
              value={p.tagInput}
              onChange={(e) => p.setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); p.addTag(); } }}
              placeholder="javascript, react..."
              className={`${inputCls} pl-8`}
            />
          </div>
          <button
            type="button"
            onClick={p.addTag}
            className="border border-gray-800/60 bg-gray-900/10 px-3 text-gray-600 hover:border-gray-700 hover:text-gray-300 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        {p.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {p.tags.map((t) => (
              <span key={t} className="flex items-center gap-1 border border-purple/20 bg-purple/8 text-purple/70 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest">
                {t}
                <button onClick={() => p.removeTag(t)} aria-label={`Remover tag ${t}`}>
                  <X className="h-2.5 w-2.5 hover:text-white transition-colors" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Resumo */}
      <div className="border border-gray-800/60 bg-gray-900/20 p-4 space-y-2">
        <p className="font-mono text-[9px] uppercase tracking-widest text-gray-700">// resumo</p>
        {[
          ["Módulos",    String(p.modulesCount)],
          ["Aulas",      String(p.lessonsCount)],
          ["Tipo",       p.courseType],
          ...(p.courseType === "standalone"
            ? [["Preço", p.price ? `${parseInt(p.price).toLocaleString("pt-AO")} Kz` : "Gratuito"]]
            : []),
          ["Certificado", p.hasCertificate ? "Sim" : "Não"],
          ["Destaque",    p.featured       ? "Sim" : "Não"],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-gray-600">{k}</span>
            <span className="font-mono text-[9px] text-gray-300 capitalize">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
