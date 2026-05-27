import { useAuth, type UserPlan } from "@/contexts/AuthContext";
import type { CourseType } from "@/types/course";

/**
 * Regras de acesso:
 *  free    → só standalone comprado (verificado via enrolledCourses)
 *  smart   → smart + standalone comprado
 *  golden  → tudo (golden + smart + standalone comprado)
 *  admin   → tudo sempre
 */
export function useAccess() {
  const { plan, isAdmin } = useAuth();

  const canAccessCourseType = (type: CourseType): boolean => {
    if (isAdmin) return true;
    if (type === "smart") return plan === "smart" || plan === "golden";
    if (type === "golden") return plan === "golden";
    // standalone — verificado separadamente via enrolledCourses
    return false;
  };

  const canAccessCourse = (
    type: CourseType,
    courseId: string,
    enrolledCourses: string[] = [],
    standalonePrice?: number
  ): boolean => {
    if (isAdmin) return true;
    if (type === "standalone") {
      // Curso avulso gratuito fica disponível mesmo sem compra.
      if ((standalonePrice ?? 0) <= 0) return true;
      return enrolledCourses.includes(courseId);
    }
    return canAccessCourseType(type);
  };

  const planLabel: Record<UserPlan, string> = {
    free: "Gratuito",
    smart: "Plano Smart",
    golden: "Plano Golden",
  };

  const requiredPlanLabel = (type: CourseType): string => {
    if (type === "golden") return "Plano Golden";
    if (type === "smart") return "Plano Smart ou Golden";
    return "Compra Individual";
  };

  return { canAccessCourse, canAccessCourseType, plan, planLabel, requiredPlanLabel };
}
