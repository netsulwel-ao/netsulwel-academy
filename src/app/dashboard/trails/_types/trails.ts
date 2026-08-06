import type { CourseType, CourseCategory, CourseLevel } from "@/types/course";

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

export const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  standalone: { label: "Avulso",  color: "border-blue-500/25   bg-blue-500/10   text-blue-400/80"   },
  smart:      { label: "Smart",   color: "border-green-500/25  bg-green-500/10  text-green-400/80"  },
  golden:     { label: "Golden",  color: "border-yellow-500/25 bg-yellow-500/10 text-yellow-400/80" },
};

// ── Helpers ───────────────────────────────────────────────────

export function normalizeCourseType(type: unknown): CourseType {
  if (type === "standalone" || type === "smart" || type === "golden") return type;
  return "standalone";
}

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

/** Acesso à trilha inteira por plano */
export function trailAccessByPlan(
  trailType: string | undefined,
  plan: string,
  isAdmin: boolean
): boolean {
  if (isAdmin) return true;
  if (trailType === "smart")  return plan === "smart"  || plan === "golden";
  if (trailType === "golden") return plan === "golden";
  // standalone/undefined — acesso livre ao catálogo, cursos têm acesso individual
  return true;
}

/** Etiqueta do plano necessário para uma trilha */
export function trailRequiredPlanLabel(trailType: string | undefined): string {
  if (trailType === "golden") return "Plano Golden";
  if (trailType === "smart")  return "Plano Smart ou Golden";
  return "";
}
