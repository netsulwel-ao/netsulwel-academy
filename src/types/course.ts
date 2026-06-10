export type CourseType = "standalone" | "smart" | "golden";
export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseCategory = "tech" | "finance" | "investments" | "other";
export type CourseStatus = "draft" | "published";
export type CourseFormat = "recorded" | "live";

export interface VideoItem {
  title: string;
  url: string;
  duration: string;
  uploading?: boolean;
  uploadProgress?: number;
  uploadError?: string;
  /** Apenas para cursos ao vivo (format === "live") */
  scheduledAt?: string;   // ISO datetime
  roomName?: string;      // LiveKit room slug
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
  format: CourseFormat;
  level: CourseLevel;
  category: CourseCategory;
  hasCertificate: boolean;
  featured: boolean;         // aparece na landing page
  trailId?: string;          // referência à trilha (opcional)
  trailOrder?: number;       // posição dentro da trilha
  tags: string[];
  modules: CourseModule[];
  modulesCount: number;
  lessonsCount: number;
  totalDuration?: string;    // calculado
  createdBy?: string;          // UID do admin que criou
  sellerId?: string;          // UID do professor/instituição que vende (para taxas)
  feePercentage?: number;     // Taxa da plataforma para este curso (ex: 10 para 10%)
  views?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface TrailLiveSession {
  title: string;
  description: string;
  thumbnail: string;
  scheduledAt: string;       // ISO datetime
  price: number;
  target?: "free" | "smart" | "golden" | "standalone";
  sellerId?: string;         // UID do professor/instituição que vende
  feePercentage?: number;    // Taxa da plataforma
}

export interface Trail {
  id?: string;
  title: string;
  description: string;
  thumbnail: string;
  type?: "smart" | "golden" | "standalone";
  category: CourseCategory;
  level: CourseLevel;
  status: CourseStatus;
  courseIds: string[];       // ordem dos cursos na trilha
  coursesCount: number;
  liveIds: string[];         // referência a lives existentes
  liveSessions: TrailLiveSession[];  // aulas próprias da trilha
  livesCount: number;        // liveIds.length + liveSessions.length
  createdBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}
