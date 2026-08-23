"use client";

import { Search, X, SlidersHorizontal } from "lucide-react";
import type { CourseCategory, CourseLevel } from "@/types/course";
import {
  type CatalogFilters, type SortKey,
  SORT_OPTIONS, CAT_LABEL, LEVEL_LABEL, LEVELS,
} from "../_types/catalog";

// ── Chip ──────────────────────────────────────────────────────
function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-2.5 py-1 font-mono text-[13px] tracking-wide transition-colors ${
        selected
          ? "border-purple/40 bg-purple/15 text-purple/90"
          : "border-gray-800 bg-gray-900 text-gray-600 hover:border-gray-700 hover:text-gray-400"
      }`}
    >
      {children}
    </button>
  );
}

// ── ActiveTag ─────────────────────────────────────────────────
function ActiveTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-gray-800 bg-gray-900 px-2.5 py-1 font-mono text-[13px] tracking-wide text-gray-500">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="text-gray-700 hover:text-gray-400 transition-colors"
        aria-label={`Remover filtro ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

// ── Props ─────────────────────────────────────────────────────
interface CourseFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  filters: CatalogFilters;
  onFilterChange: <K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) => void;
  sort: SortKey;
  onSortChange: (v: SortKey) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  totalFiltered: number;
  totalCourses: number;
}

// ── Componente principal ──────────────────────────────────────
export function CourseFilters({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  sort,
  onSortChange,
  onClearAll,
  hasActiveFilters,
  totalFiltered,
  totalCourses,
}: CourseFiltersProps) {
  const showPanel = true; // painel sempre visível como accordion

  return (
    <div className="space-y-3">
      {/* ── Barra de pesquisa + ordenação ── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Título, descrição ou tag..."
            className="w-full border border-gray-800 bg-gray-900 py-2.5 pl-9 pr-8 text-sm text-gray-200 focus:border-purple/40 focus:outline-none transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-gray-400 transition-colors"
              aria-label="Limpar pesquisa"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <select
          value={sort}
          onChange={e => onSortChange(e.target.value as SortKey)}
          className="w-full sm:w-auto appearance-none border border-gray-800 bg-gray-900 px-3 py-2.5 font-mono text-[13px] tracking-wide text-gray-500 focus:outline-none cursor-pointer sm:min-w-[130px]"
          aria-label="Ordenação"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value} className="bg-gray-900">
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Painel de filtros — scroll horizontal em mobile ── */}
      <div className="border border-gray-800 bg-gray-900 p-3 sm:p-4">
        {/* Mobile: scroll horizontal por grupo */}
        <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-5">

          {/* Categoria */}
          <div className="min-w-0">
            <p className="font-mono text-[13px] tracking-[0.15em] text-gray-700 mb-2">Categoria</p>
            <div className="flex flex-wrap gap-1.5">
              <Chip selected={filters.cat === "all"} onClick={() => onFilterChange("cat", "all")}>Todas</Chip>
              {(Object.entries(CAT_LABEL) as [CourseCategory, string][]).map(([v, l]) => (
                <Chip key={v} selected={filters.cat === v} onClick={() => onFilterChange("cat", v)}>{l}</Chip>
              ))}
            </div>
          </div>

          {/* Nível */}
          <div className="min-w-0">
            <p className="font-mono text-[13px] tracking-[0.15em] text-gray-700 mb-2">Nível</p>
            <div className="flex flex-wrap gap-1.5">
              <Chip selected={filters.level === "all"} onClick={() => onFilterChange("level", "all")}>Todos</Chip>
              {LEVELS.map(l => (
                <Chip key={l.value} selected={filters.level === l.value} onClick={() => onFilterChange("level", l.value)}>
                  {l.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* Preço */}
          <div className="min-w-0">
            <p className="font-mono text-[13px] tracking-[0.15em] text-gray-700 mb-2">Preço</p>
            <div className="flex flex-wrap gap-1.5">
              <Chip selected={filters.price === "all"}  onClick={() => onFilterChange("price", "all")}>Todos</Chip>
              <Chip selected={filters.price === "free"} onClick={() => onFilterChange("price", "free")}>Grátis</Chip>
              <Chip selected={filters.price === "paid"} onClick={() => onFilterChange("price", "paid")}>Pagos</Chip>
            </div>
          </div>

          {/* Certificado */}
          <div className="min-w-0">
            <p className="font-mono text-[13px] tracking-[0.15em] text-gray-700 mb-2">Certificado</p>
            <div className="flex flex-wrap gap-1.5">
              <Chip selected={filters.certificate === null}  onClick={() => onFilterChange("certificate", null)}>Todos</Chip>
              <Chip selected={filters.certificate === true}  onClick={() => onFilterChange("certificate", true)}>Com cert.</Chip>
              <Chip selected={filters.certificate === false} onClick={() => onFilterChange("certificate", false)}>Sem cert.</Chip>
            </div>
          </div>
        </div>

        {/* Rodapé do painel — contador + limpar */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-800 pt-3">
          <p className="font-mono text-[13px] text-gray-700">
            {hasActiveFilters
              ? `${totalFiltered} de ${totalCourses}`
              : `${totalCourses} cursos`}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearAll}
              className="font-mono text-[13px] tracking-wide text-gray-600 hover:text-purple/70 transition-colors"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* ── Tags activas ── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {search && <ActiveTag label={`"${search}"`} onRemove={() => onSearchChange("")} />}
          {filters.cat   !== "all"  && <ActiveTag label={CAT_LABEL[filters.cat]}            onRemove={() => onFilterChange("cat", "all")} />}
          {filters.level !== "all"  && <ActiveTag label={LEVEL_LABEL[filters.level]}        onRemove={() => onFilterChange("level", "all")} />}
          {filters.price !== "all"  && <ActiveTag label={filters.price === "free" ? "Grátis" : "Pagos"} onRemove={() => onFilterChange("price", "all")} />}
          {filters.certificate !== null && (
            <ActiveTag
              label={filters.certificate ? "Com certificado" : "Sem certificado"}
              onRemove={() => onFilterChange("certificate", null)}
            />
          )}
          {sort !== "recent" && (
            <ActiveTag
              label={SORT_OPTIONS.find(o => o.value === sort)?.label ?? sort}
              onRemove={() => onSortChange("recent")}
            />
          )}
        </div>
      )}
    </div>
  );
}
