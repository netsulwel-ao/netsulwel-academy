"use client";

import { Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCoursesCatalog } from "./_hooks/useCourses";
import { CourseFilters } from "./_components/CourseFilters";
import { CourseGrid } from "./_components/CourseGrid";

export default function CourseCatalogPage() {
  const { institutionId } = useAuth();

  const {
    courses,
    enrolledCourses,
    creatorNames,
    ownCourseIds,
    institutionName,
    loading,
    loadError,
    search,
    setSearch,
    filters,
    setFilter,
    sort,
    setSort,
    clearAll,
    hasActiveFilters,
    accessible,
    locked,
    totalFiltered,
  } = useCoursesCatalog();

  return (
    <div className="max-w-[80rem] mx-auto space-y-6 animate-in fade-in duration-300">

      {/* ── Cabeçalho ── */}
      <div>
        <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-purple/60 mb-2">
          // catálogo de cursos
        </p>
        <h1 className="text-2xl font-bold text-gray-100">
          {institutionId
            ? `Cursos — ${institutionName || "Instituição"}`
            : "Meus Cursos"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {loading
            ? "A carregar catálogo..."
            : `${courses.length} curso${courses.length !== 1 ? "s" : ""} disponíve${courses.length !== 1 ? "is" : "l"}`}
        </p>
      </div>

      {/* ── Erro de carregamento ── */}
      {loadError && (
        <div className="flex items-start gap-3 border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" strokeWidth={1.5} />
          <p className="text-sm text-amber-400/80">{loadError}</p>
        </div>
      )}

      {/* ── Filtros ── */}
      <CourseFilters
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFilterChange={setFilter}
        sort={sort}
        onSortChange={setSort}
        onClearAll={clearAll}
        hasActiveFilters={hasActiveFilters}
        totalFiltered={totalFiltered}
        totalCourses={courses.length}
      />

      {/* ── Conteúdo ── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
        </div>
      ) : (
        <CourseGrid
          accessible={accessible}
          locked={locked}
          enrolledCourses={enrolledCourses}
          creatorNames={creatorNames}
          ownCourseIds={ownCourseIds}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearAll}
        />
      )}
    </div>
  );
}
