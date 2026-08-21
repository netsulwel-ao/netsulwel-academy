import { useAuth } from "@/contexts/AuthContext";

/**
 * Regras de acesso (sem planos — pagamento individual por curso):
 *  admin   → acesso total sempre
 *  teacher → acesso total sempre
 *  aluno   → acessa se:
 *     - preço <= 0 (curso gratuito)
 *     - está em enrolledCourses (comprou ou foi inscrito)
 *     - tem accessCode e o introduziu (verificado em enrolledCourses)
 *
 *  Lives funcionam igual: preço <= 0 ou em enrolledLives.
 */
export function useAccess() {
  const { isAdmin, isTeacher } = useAuth();

  const hasAccess = (isAdmin || isTeacher);

  const canAccessCourse = (
    courseId: string,
    enrolledCourses: string[] = [],
    price?: number,
    accessCode?: string
  ): boolean => {
    if (hasAccess) return true;
    // Se tem accessCode, só acessa se estiver em enrolledCourses
    if (accessCode) {
      return enrolledCourses.includes(courseId);
    }
    // Curso gratuito fica disponível
    if ((price ?? 0) <= 0) return true;
    return enrolledCourses.includes(courseId);
  };

  const canAccessLive = (
    liveId: string,
    enrolledLives: string[] = [],
    price?: number
  ): boolean => {
    if (hasAccess) return true;
    if ((price ?? 0) <= 0) return true;
    return enrolledLives.includes(liveId);
  };

  const needsAccessCode = (
    courseId: string,
    enrolledCourses: string[] = [],
    price?: number,
    accessCode?: string
  ): boolean => {
    if (hasAccess) return false;
    if (accessCode && (price ?? 0) <= 0) {
      return !enrolledCourses.includes(courseId);
    }
    return false;
  };

  return { canAccessCourse, canAccessLive, needsAccessCode };
}
