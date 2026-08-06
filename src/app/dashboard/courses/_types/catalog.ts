import type { CourseType, CourseCategory, CourseLevel } from "@/types/course";

export type SortKey = "recent" | "oldest" | "az" | "za" | "price-asc" | "price-desc";

export interface CatalogFilters {
  cat: CourseCategory | "all";
  type: CourseType | "all";
  level: CourseLevel | "all";
  price: "all" | "free" | "paid";
  certificate: boolean | null;
}

export const DEFAULT_FILTERS: CatalogFilters = {
  cat: "all",
  type: "all",
  level: "all",
  price: "all",
  certificate: null,
};

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent",     label: "Mais recentes" },
  { value: "oldest",     label: "Mais antigos" },
  { value: "az",         label: "A–Z" },
  { value: "za",         label: "Z–A" },
  { value: "price-asc",  label: "Preço ↑" },
  { value: "price-desc", label: "Preço ↓" },
];

// ── Labels reutilizados em vários componentes ──────────────────

export const LEVEL_LABEL: Record<string, string> = {
  beginner:     "Iniciante",
  intermediate: "Intermédio",
  advanced:     "Avançado",
};

export const CAT_LABEL: Record<CourseCategory, string> = {
  tech:        "Tecnologia",
  finance:     "Finanças",
  investments: "Investimentos",
  other:       "Outro",
};

export const TYPE_BADGE: Record<CourseType, { label: string; color: string }> = {
  standalone: { label: "Avulso", color: "border-blue-500/25 bg-blue-500/10 text-blue-400/80" },
  smart:      { label: "Smart",  color: "border-green-500/25 bg-green-500/10 text-green-400/80" },
  golden:     { label: "Golden", color: "border-yellow-500/25 bg-yellow-500/10 text-yellow-400/80" },
};

export const LEVELS: { value: CourseLevel; label: string }[] = [
  { value: "beginner",     label: "Iniciante" },
  { value: "intermediate", label: "Intermédio" },
  { value: "advanced",     label: "Avançado" },
];

// ── Helpers ────────────────────────────────────────────────────

export function normalizeCourseType(type: unknown): CourseType {
  if (type === "standalone" || type === "smart" || type === "golden") return type;
  return "standalone";
}

/**
 * Converte Firestore Timestamp, number ou string para ms desde epoch.
 * Usado para ordenação cronológica fiável.
 */
export function toMs(value: unknown): number {
  if (!value) return 0;
  // Firestore Timestamp
  if (typeof value === "object" && "toMillis" in (value as object)) {
    return (value as { toMillis: () => number }).toMillis();
  }
  // number (já ms)
  if (typeof value === "number") return value;
  // string ISO
  if (typeof value === "string") return new Date(value).getTime();
  return 0;
}
