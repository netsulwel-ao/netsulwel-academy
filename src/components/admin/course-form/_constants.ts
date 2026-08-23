import type { CourseLevel, CourseCategory } from "@/types/course";

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
  "w-full border border-gray-800 bg-gray-900 py-2.5 px-3 text-sm text-gray-200 focus:border-purple/30 focus:outline-none transition-colors";

export const selectCls =
  "w-full border border-gray-800 bg-gray-900 py-2.5 px-3 text-sm text-gray-200 focus:border-purple/30 focus:outline-none appearance-none cursor-pointer transition-colors";
