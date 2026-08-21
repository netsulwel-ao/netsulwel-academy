"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Layers, Lock, Loader2,
  BookOpen, Radio, Zap, Crown, Sparkles,
} from "lucide-react";
import { useTrailDetail } from "../_hooks/useTrailDetail";
import { TrailCourseList } from "../_components/TrailCourseList";
import { TrailLiveList, TrailScheduleList } from "../_components/TrailLiveList";
import { TYPE_BADGE, LEVEL_LABEL, CAT_LABEL } from "../_types/trails";

export default function TrailDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { trail, courses, lives, enrolledCourses, loading, hasTrailAccess } = useTrailDetail(id);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
      </div>
    );
  }

  if (!trail) return null;

  const badge = TYPE_BADGE[trail.type ?? "standalone"] ?? TYPE_BADGE.standalone;
  const isEmpty =
    courses.length === 0 &&
    lives.length === 0 &&
    (!trail.liveSessions || trail.liveSessions.length === 0);

  return (
    <div className="max-w-[80rem] mx-auto space-y-10 animate-in fade-in duration-300">

      {/* ── Breadcrumb ── */}
      <Link
        href="/dashboard/trails"
        className="inline-flex items-center gap-1.5 font-mono text-[13px] uppercase tracking-widest text-gray-700 hover:text-gray-500 transition-colors"
      >
        <ChevronLeft className="h-3 w-3" /> Trilhas
      </Link>

      {/* ── HERO — layout assimétrico ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 lg:gap-8 items-start">

        {/* Esquerda — info */}
        <div className="space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`font-mono text-[13px] uppercase tracking-widest border px-2.5 py-1 ${badge.color}`}>
              {badge.label}
            </span>
            <span className="font-mono text-[13px] uppercase tracking-widest border border-gray-800 bg-gray-900 px-2.5 py-1 text-gray-600">
              {LEVEL_LABEL[trail.level] ?? trail.level}
            </span>
            <span className="font-mono text-[13px] uppercase tracking-widest border border-gray-800 bg-gray-900 px-2.5 py-1 text-gray-600">
              {CAT_LABEL[trail.category] ?? trail.category}
            </span>
          </div>

          {/* Título */}
          <div>
            <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-purple/60 mb-2">
              // trilha
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 leading-tight">
              {trail.title}
            </h1>
            {trail.description && (
              <p className="mt-3 text-sm text-gray-500 leading-relaxed max-w-xl">
                {trail.description}
              </p>
            )}
          </div>

          {/* Meta stats */}
          <div className="flex flex-wrap items-center gap-4 font-mono text-[13px] text-gray-700 pt-1">
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
              {trail.coursesCount ?? 0} cursos
            </span>
            <span className="h-3 w-px bg-gray-800" />
            <span className="flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5" strokeWidth={1.5} />
              {trail.livesCount ?? 0} aulas ao vivo
            </span>
          </div>
        </div>

        {/* Direita — thumbnail */}
        <div className="order-first lg:order-last">
          <div className="relative aspect-video overflow-hidden border border-gray-800 bg-gray-900">
            {trail.thumbnail ? (
              <img
                src={trail.thumbnail}
                alt={trail.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Layers className="h-10 w-10 text-gray-800" strokeWidth={1} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ACESSO BLOQUEADO ── */}
      {!hasTrailAccess && (
        <div className="flex flex-col items-center justify-center border border-gray-800 bg-gray-900 py-14 text-center px-4">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
            <Lock className="h-5 w-5 text-gray-600" strokeWidth={1.5} />
          </div>
          <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-3">
            // acesso restrito
          </p>
          <h2 className="text-lg font-bold text-gray-300 mb-2">Trilha bloqueada</h2>
          <p className="text-sm text-gray-600 max-w-sm mb-6">
            Esta trilha requer{" "}
            <span className="font-semibold text-gray-400">
              compra individual
            </span>{" "}
            para aceder ao conteúdo completo.
          </p>
          <Link
            href="/dashboard/finances"
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold transition-colors bg-green hover:bg-green-light text-gray-950"
          >
            <Zap className="h-4 w-4" /> Comprar acesso
          </Link>
        </div>
      )}

      {/* ── CONTEÚDO DA TRILHA ── */}
      {hasTrailAccess && (
        <div className="space-y-10">
          {/* Cursos */}
          <TrailCourseList courses={courses} enrolledCourses={enrolledCourses} />

          {/* Lives referenciadas */}
          <TrailLiveList lives={lives} enrolledLives={[]} />

          {/* Sessões próprias da trilha */}
          <TrailScheduleList sessions={trail.liveSessions ?? []} />

          {/* Trilha vazia */}
          {isEmpty && (
            <div className="flex flex-col items-center justify-center border border-gray-800 bg-gray-900 py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
                <Sparkles className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
              </div>
              <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">
                // em construção
              </p>
              <p className="text-sm text-gray-600">
                Esta trilha ainda não tem conteúdo publicado.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
