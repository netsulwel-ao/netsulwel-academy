import type { Course } from "@/types/course";

export interface CourseFormProps {
  initialData?: Partial<Course>;
  onSave: (
    data: Omit<Course, "id" | "createdAt" | "updatedAt">,
    status: "draft" | "published"
  ) => Promise<void>;
  saving: boolean;
  backHref?: string;
  mode: "create" | "edit";
}
