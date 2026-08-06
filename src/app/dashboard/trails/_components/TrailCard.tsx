"use client";

import Link from "next/link";
import { Layers, BookOpen, Radio, ChevronRight } from "lucide-react";
import type { Trail } from "@/types/course";
import { TYPE_BADGE, LEVEL_LABEL, CAT_LABEL } from "../_types/trails";

interface TrailCardProps {
  trail: Trail;
  /** Índice para criar variação visual entre cards */
  index: number;
}

export function TrailCard({ trail, index }: TrailCardProps) {
  const badge = TYPE_BADGE[trail.type ?? "standalone"] ?? TYPE_BADGE.standalone;
  const isFirst = index === 0;

  return (
    <Link
      href={`/dashboard/trails/${trail.id}`}
      className={`group flex flex-col overflow-hidden border border-gray-800/60 bg-gray-900/20 hover:border-gray-700 hover:bg-gray-900/40 transition-all ${
        isFirst ? "md:col-span-2" : ""
      }`}
    >
      {/* Thumbnail */}
      <div className={`relative overflow-hidden bg-gray-900 shrink-0 ${isFirst ? "aspect-[21/9]" : "aspect-video"}`}>
        {trail.thumbnail ? (
          <img
            src={trail.thumbnail}
            alt={trail.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950">
            <Layers className="h-10 w-10 text-gray-800" strokeWidth={1} />
          </div>
        )}

        {/* Gradiente de baixo */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent" />

        {/* Badge tipo + nível — sobrepostos na imagem */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className={`font-mono text-[9px] uppercase tracking-widest border px-2 py-0.5 ${badge.color}`}>
            {badge.label}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-widest border border-gray-700/60 bg-gray-950/80 px-2 py-0.5 text-gray-500">
            {LEVEL_LABEL[trail.level] ?? trail.level}
          </span>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Categoria */}
        <p className="font-mono text-[9px] uppercase tracking-widest text-gray-700 mb-1.5">
          {CAT_LABEL[trail.category] ?? trail.category}
        </p>

        {/* Título */}
        <h3 className={`font-bold text-gray-200 leading-snug group-hover:text-white transition-colors ${
          isFirst ? "text-base sm:text-lg" : "text-sm"
        }`}>
          {trail.title}
        </h3>

        {/* Descrição — só no card grande */}
        {isFirst && trail.description && (
          <p className="mt-1.5 text-xs text-gray-600 line-clamp-2 leading-relaxed">
            {trail.description}
          </p>
        )}

        {/* Meta */}
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-800/40 mt-3">
          <div className="flex items-center gap-3 font-mono text-[10px] text-gray-700">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" strokeWidth={1.5} />
              {trail.coursesCount ?? 0}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Radio className="h-3 w-3" strokeWidth={1.5} />
              {trail.livesCount ?? 0}
            </span>
          </div>
          <span className="flex items-center gap-1 font-mono text-[10px] text-purple/60 group-hover:text-purple/80 transition-colors">
            Ver <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
