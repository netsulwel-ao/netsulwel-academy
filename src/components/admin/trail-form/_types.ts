import type {
  Trail, TrailLiveSession,
  CourseType, CourseLevel, CourseCategory, Course,
} from "@/types/course";
import type { LiveSession } from "@/types/live";

export interface TrailFormData {
  title: string;
  description: string;
  thumbnail: string;
  type: CourseType;
  level: CourseLevel;
  category: CourseCategory;
  courseIds: string[];
  liveIds: string[];
  liveSessions: TrailLiveSession[];
}

export interface TrailFormProps {
  mode: "create" | "edit";
  initialData?: Partial<Trail>;
  allCourses: Course[];
  allLives: LiveSession[];
  saving: boolean;
  error: string;
  onSave: (data: TrailFormData, status: "draft" | "published") => void;
  onError: (msg: string) => void;
  onBack: () => void;
}
