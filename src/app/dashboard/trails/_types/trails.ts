import type { CourseCategory, CourseLevel } from "@/types/course";

// ── Type badge ────────────────────────────────────────────────

export const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  standalone: { label: "Standalone", color: "border-purple/25 bg-purple/8 text-purple/70" },
};

// ── Labels ────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────

export function fmtDate(iso: string | unknown): string {
  if (!iso || typeof iso !== "string") return "";
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}
