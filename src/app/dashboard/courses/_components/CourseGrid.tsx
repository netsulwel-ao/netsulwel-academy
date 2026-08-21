"use client";

import Link from "next/link";
import { Play, Lock, Search, BookOpen, ArrowRight } from "lucide-react";
import type { Course } from "@/types/course";
import { CourseCard } from "./CourseCard";
import { useAccess } from "@/hooks/useAccess";

interface CourseGridProps {
  accessible: Course[];
  locked: Course[];
  enrolledCourses: string[];
  creatorNames: Record<string, string>;
  ownCourseIds?: Set<string>;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function CourseGrid({
  accessible,
  locked,
  enrolledCourses,
  creatorNames,
  ownCourseIds = new Set(),
  hasActiveFilters,
  onClearFilters,
}: CourseGridProps) {
  const { } = useAccess();

  // ── Empty state ──────────────────────────────────────────────
  if (accessible.length === 0 && locked.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-gray-800 bg-gray-900 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
          <Search className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
        </div>
        <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">
          // sem resultados
        </p>
        <p className="text-sm text-gray-500">Nenhum curso corresponde à pesquisa.</p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-4 border border-gray-800 bg-gray-900 px-4 py-2 font-mono text-[13px] uppercase tracking-widest text-gray-600 hover:border-gray-700 hover:text-gray-400 transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10">

      {/* ── Secção: Disponíveis ── */}
      {accessible.length > 0 && (
        <section>
          {/* Cabeçalho editorial */}
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-green/60 mb-1">
                // disponíveis
              </p>
              <h2 className="text-base font-bold text-gray-200">
                Cursos acessíveis
                <span className="ml-2 font-mono text-sm text-gray-700">({accessible.length})</span>
              </h2>
            </div>
            <Link
              href="/dashboard/courses"
              className="font-mono text-[13px] uppercase tracking-widest text-gray-700 hover:text-gray-500 transition-colors"
            >
              ver todos →
            </Link>
          </div>

          {/* Grid editorial assimétrico: destaque grande + lista */}
          {accessible.length === 1 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <CourseCard
                course={accessible[0]}
                locked={false}
                enrolledCourses={enrolledCourses}
                creatorNames={creatorNames}
                isOwn={ownCourseIds.has(accessible[0].id!)}
              />
            </div>
          ) : accessible.length <= 3 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {accessible.map(c => (
                <CourseCard
                  key={c.id}
                  course={c}
                  locked={false}
                  enrolledCourses={enrolledCourses}
                  creatorNames={creatorNames}
                  isOwn={ownCourseIds.has(c.id!)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Destaque horizontal */}
              <Link
                href={
                  ownCourseIds.has(accessible[0].id!)
                    ? `/dashboard/teacher/courses/${accessible[0].id}/edit`
                    : `/dashboard/courses/${accessible[0].id}`
                }
                className="group relative flex flex-col md:flex-row overflow-hidden border border-gray-800 bg-gray-900 hover:border-gray-700 hover:bg-gray-900 transition-all"
              >
                <div className="relative h-44 md:h-auto md:w-72 lg:w-80 shrink-0 bg-gray-900">
                  {accessible[0].thumbnail ? (
                    <img src={accessible[0].thumbnail} alt={accessible[0].title}
                      className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <BookOpen className="h-8 w-8 text-gray-800" strokeWidth={1} />
                    </div>
                  )}
                  {/* Badge "Teu curso" no destaque */}
                  {ownCourseIds.has(accessible[0].id!) && (
                    <div className="absolute left-2.5 top-2.5">
                      <span className="font-mono text-[13px] uppercase tracking-widest border border-purple/30 bg-purple/15 px-2 py-0.5 text-purple/80">
                        Teu curso
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                  <div>
                    <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">// destaque</p>
                    <h3 className="text-sm sm:text-base font-bold text-gray-200 group-hover:text-white transition-colors leading-snug">
                      {accessible[0].title}
                    </h3>
                    {accessible[0].description && (
                      <p className="mt-1.5 text-sm text-gray-600 line-clamp-2">{accessible[0].description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800">
                    <span className="font-mono text-[13px] text-gray-700">{accessible[0].lessonsCount ?? 0} aulas</span>
                    <span className="flex items-center gap-1 font-mono text-[13px] text-purple/60 group-hover:text-purple/80 transition-colors">
                      {ownCourseIds.has(accessible[0].id!) ? "Gerir" : "Iniciar"} <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {accessible.slice(1).map(c => (
                  <CourseCard
                    key={c.id}
                    course={c}
                    locked={false}
                    enrolledCourses={enrolledCourses}
                    creatorNames={creatorNames}
                    isOwn={ownCourseIds.has(c.id!)}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Secção: Bloqueados ── */}
      {locked.length > 0 && (
        <section>
          <div className="mb-4">
            <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-gray-700 mb-1">
              // requer upgrade
            </p>
            <h2 className="text-base font-bold text-gray-500">
              Cursos bloqueados
              <span className="ml-2 font-mono text-sm text-gray-700">({locked.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {locked.map(c => (
              <CourseCard
                key={c.id}
                course={c}
                locked={true}
                enrolledCourses={enrolledCourses}
                requiredPlan={c.price ? `${c.price.toLocaleString("pt-AO")} Kz` : "Grátis"}
                creatorNames={creatorNames}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
