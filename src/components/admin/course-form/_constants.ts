import type { CourseType, CourseLevel, CourseCategory } from "@/types/course";

export const COURSE_TYPES: { value: CourseType; label: string; desc: string }[] = [
  { value: "standalone", label: "Standalone",   desc: "Compra individual em Kz" },
  { value: "smart",      label: "Plano Smart",  desc: "Incluído no Smart e Golden" },
  { value: "golden",     label: "Plano Golden", desc: "Exclusivo Plano Golden" },
];

export const LEVELS: { value: CourseLevel; label: string }[] = [
  { value: "beginner",     label: "Iniciante" },
  { value: "intermediate", label: "Intermédio" },
  { value: "advanced",     label: "Avançado" },
];

export const CATEGORIES: { value: CourseCategory; label: string }[] = [
  { value: "tech",        label: "Tecnologia" },
  { value: "finance",     label: "Finanças" },
  { value: "investments", label: "Investimentos" },
  { value: "other",       label: "Outro" },
];

export const inputCls =
  "w-full border border-gray-800/60 bg-gray-900/40 py-2.5 px-3 text-sm text-gray-200 placeholder-gray-700 focus:border-purple/30 focus:outline-none transition-colors";

export const selectCls =
  "w-full border border-gray-800/60 bg-gray-900/40 py-2.5 px-3 text-sm text-gray-200 focus:border-purple/30 focus:outline-none appearance-none cursor-pointer transition-colors";
