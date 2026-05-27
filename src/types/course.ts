export type CourseType = "golden" | "smart" | "standalone";
export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseCategory = "tech" | "finance" | "investments" | "other";
export type CourseStatus = "draft" | "published";

export interface VideoItem {
  title: string;
  url: string;
  duration: string;
  uploading?: boolean;
  uploadProgress?: number;
  uploadError?: string;
}

export interface CourseModule {
  title: string;
  videos: VideoItem[];
}

export interface Course {
  id?: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  status: CourseStatus;
  type: CourseType;
  level: CourseLevel;
  category: CourseCategory;
  hasCertificate: boolean;
  trailId?: string;          // referência à trilha (opcional)
  trailOrder?: number;       // posição dentro da trilha
  tags: string[];
  modules: CourseModule[];
  modulesCount: number;
  lessonsCount: number;
  totalDuration?: string;    // calculado
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Trail {
  id?: string;
  title: string;
  description: string;
  thumbnail: string;
  type: CourseType;          // acesso mínimo necessário
  category: CourseCategory;
  level: CourseLevel;
  status: CourseStatus;
  courseIds: string[];       // ordem dos cursos na trilha
  coursesCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}
