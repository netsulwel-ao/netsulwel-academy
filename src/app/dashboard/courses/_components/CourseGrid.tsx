"use client";

import { Search } from "lucide-react";
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
        </section>
      )}

      {/* ── Secção: Bloqueados — oculta ── */}
      {locked.length > 0 && (
        <section className="hidden">
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
