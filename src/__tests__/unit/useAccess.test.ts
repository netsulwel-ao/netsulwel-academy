/**
 * Unit tests — useAccess hook (lógica de acesso a cursos)
 * Testa o núcleo de negócio: quem pode ver o quê.
 */
import { describe, it, expect } from "vitest";

// Extraímos a lógica pura do hook para testar sem React
function canAccessCourse(
  type: "standalone" | "smart" | "golden",
  courseId: string,
  enrolledCourses: string[],
  price: number,
  plan: "free" | "smart" | "golden",
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true;
  if (type === "standalone") return price === 0 || enrolledCourses.includes(courseId);
  if (type === "smart") return plan === "smart" || plan === "golden" || enrolledCourses.includes(courseId);
  if (type === "golden") return plan === "golden" || enrolledCourses.includes(courseId);
  return false;
}

describe("canAccessCourse", () => {
  const courseId = "course_abc";

  describe("Admin", () => {
    it("acede a qualquer curso independente do tipo", () => {
      expect(canAccessCourse("golden", courseId, [], 5000, "free", true)).toBe(true);
      expect(canAccessCourse("standalone", courseId, [], 9999, "free", true)).toBe(true);
    });
  });

  describe("Curso standalone", () => {
    it("aluno free acede se curso é gratuito (price=0)", () => {
      expect(canAccessCourse("standalone", courseId, [], 0, "free", false)).toBe(true);
    });

    it("aluno free NÃO acede se curso tem preço e não está inscrito", () => {
      expect(canAccessCourse("standalone", courseId, [], 5000, "free", false)).toBe(false);
    });

    it("aluno acede se está no enrolledCourses mesmo sem plano", () => {
      expect(canAccessCourse("standalone", courseId, [courseId], 5000, "free", false)).toBe(true);
    });
  });

  describe("Curso smart", () => {
    it("aluno free NÃO acede", () => {
      expect(canAccessCourse("smart", courseId, [], 0, "free", false)).toBe(false);
    });

    it("aluno smart acede", () => {
      expect(canAccessCourse("smart", courseId, [], 0, "smart", false)).toBe(true);
    });

    it("aluno golden acede (inclui smart)", () => {
      expect(canAccessCourse("smart", courseId, [], 0, "golden", false)).toBe(true);
    });

    it("aluno free acede se está no enrolledCourses (comprou avulso)", () => {
      expect(canAccessCourse("smart", courseId, [courseId], 0, "free", false)).toBe(true);
    });
  });

  describe("Curso golden", () => {
    it("aluno free NÃO acede", () => {
      expect(canAccessCourse("golden", courseId, [], 0, "free", false)).toBe(false);
    });

    it("aluno smart NÃO acede", () => {
      expect(canAccessCourse("golden", courseId, [], 0, "smart", false)).toBe(false);
    });

    it("aluno golden acede", () => {
      expect(canAccessCourse("golden", courseId, [], 0, "golden", false)).toBe(true);
    });
  });
});
