/**
 * Unit tests — AuthContext role parsing
 * Testa a função parseProfile para garantir que roles são lidos corretamente.
 */
import { describe, it, expect } from "vitest";

// Extraída de AuthContext para testar em isolamento
type UserRole = "aluno" | "teacher" | "admin";
type UserPlan = "free" | "smart" | "golden";

function parseProfile(data: Record<string, unknown>): { role: UserRole; plan: UserPlan } {
  const role: UserRole =
    data.role === "admin" ? "admin"
    : data.role === "teacher" ? "teacher"
    : "aluno";

  const plan: UserPlan =
    data.plan === "smart" ? "smart"
    : data.plan === "golden" ? "golden"
    : "free";

  return { role, plan };
}

describe("parseProfile", () => {
  describe("role", () => {
    it("role admin", () => {
      expect(parseProfile({ role: "admin" }).role).toBe("admin");
    });

    it("role teacher", () => {
      expect(parseProfile({ role: "teacher" }).role).toBe("teacher");
    });

    it("role aluno", () => {
      expect(parseProfile({ role: "aluno" }).role).toBe("aluno");
    });

    it("role desconhecido → aluno (default seguro)", () => {
      expect(parseProfile({ role: "superadmin" }).role).toBe("aluno");
      expect(parseProfile({ role: null }).role).toBe("aluno");
      expect(parseProfile({}).role).toBe("aluno");
    });
  });

  describe("plan", () => {
    it("plano smart", () => {
      expect(parseProfile({ role: "aluno", plan: "smart" }).plan).toBe("smart");
    });

    it("plano golden", () => {
      expect(parseProfile({ role: "aluno", plan: "golden" }).plan).toBe("golden");
    });

    it("plano desconhecido → free (default seguro)", () => {
      expect(parseProfile({ role: "aluno", plan: "premium" }).plan).toBe("free");
      expect(parseProfile({ role: "aluno" }).plan).toBe("free");
    });
  });

  describe("isAdminOrTeacher derivado", () => {
    it("admin é adminOrTeacher", () => {
      const { role } = parseProfile({ role: "admin" });
      expect(role === "admin" || role === "teacher").toBe(true);
    });

    it("teacher é adminOrTeacher", () => {
      const { role } = parseProfile({ role: "teacher" });
      expect(role === "admin" || role === "teacher").toBe(true);
    });

    it("aluno NÃO é adminOrTeacher", () => {
      const { role } = parseProfile({ role: "aluno" });
      expect(role === "admin" || role === "teacher").toBe(false);
    });
  });
});
