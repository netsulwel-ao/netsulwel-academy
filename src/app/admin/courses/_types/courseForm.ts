import type { Course, CourseType, CourseLevel, CourseCategory, CourseFormat, CourseModule, Trail } from "@/types/course";

export interface CourseFormProps {
  initialData?: Partial<Course>;
  onSave: (data: Omit<Course, "id" | "createdAt" | "updatedAt">, status: "draft" | "published") => Promise<void>;
  saving: boolean;
  backHref?: string;
  mode: "create" | "edit";
}

export interface CourseFormState {
  title: string;
  description: string;
  thumbnail: string;
  thumbnailPreview: string;
  thumbnailUploading: boolean;
  price: string;
  courseType: CourseType;
  format: CourseFormat;
  level: CourseLevel;
  category: CourseCategory;
  hasCertificate: boolean;
  featured: boolean;
  trailId: string;
  trailOrder: string;
  tags: string[];
  modules: CourseModule[];
  urlMode: Record<string, "upload" | "link">;
  trails: Trail[];
  generatingDesc: boolean;
  error: string;
  accessCode: string;
}

export const COURSE_TYPES: { value: CourseType; label: string; desc: string }[] = [
  { value: "standalone", label: "Standalone", desc: "Compra individual em Kz" },
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

export function toDatetimeLocal(iso: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  } catch { return ""; }
}

// shared input classes
export const inputCls = "w-full border border-gray-800 bg-gray-900 py-2.5 px-3 text-sm text-gray-200 focus:border-purple/30 focus:outline-none transition-colors";
export const selectCls = "w-full border border-gray-800 bg-gray-900 py-2.5 px-3 text-sm text-gray-200 focus:border-purple/30 focus:outline-none appearance-none cursor-pointer transition-colors";
