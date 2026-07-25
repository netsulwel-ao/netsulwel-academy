import { useAuth, type UserPlan } from "@/contexts/AuthContext";
import type { CourseType } from "@/types/course";

/**
 * Regras de acesso:
 *  free    → só standalone comprado (verificado via enrolledCourses)
 *  smart   → smart + standalone comprado
 *  golden  → tudo (golden + smart + standalone comprado)
 *  admin   → tudo sempre
 *
 *  Se standalone tem accessCode, NÃO dá acesso automático mesmo com price <= 0.
 *  O utilizador precisa de introduzir o código ou estar em enrolledCourses.
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
    standalonePrice?: number,
    accessCode?: string
  ): boolean => {
    if (isAdmin) return true;
    if (type === "standalone") {
      // Se tem accessCode, não dá acesso automático — precisa de estar enrolled
      if (accessCode) {
        return enrolledCourses.includes(courseId);
      }
      // Curso avulso gratuito fica disponível mesmo sem compra.
      if ((standalonePrice ?? 0) <= 0) return true;
      return enrolledCourses.includes(courseId);
    }
    return canAccessCourseType(type);
  };

  const needsAccessCode = (
    type: CourseType,
    courseId: string,
    enrolledCourses: string[] = [],
    standalonePrice?: number,
    accessCode?: string
  ): boolean => {
    if (isAdmin) return false;
    if (type === "standalone" && accessCode && (standalonePrice ?? 0) <= 0) {
      return !enrolledCourses.includes(courseId);
    }
    return false;
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

  return { canAccessCourse, canAccessCourseType, needsAccessCode, plan, planLabel, requiredPlanLabel };
}
