import { describe, it, expect } from "vitest";
import {
  parseProfile,
  hasRole,
  isAdminOrTeacher,
  formatRole,
  type UserRole,
} from "@/lib/authService";

describe("authService", () => {
  describe("parseProfile", () => {
    it("should parse admin role", () => {
      const data = { role: "admin" };
      const result = parseProfile(data);
      expect(result.role).toBe("admin");
    });

    it("should parse teacher role", () => {
      const data = { role: "teacher" };
      const result = parseProfile(data);
      expect(result.role).toBe("teacher");
    });

    it("should parse institution role", () => {
      const data = { role: "institution" };
      const result = parseProfile(data);
      expect(result.role).toBe("institution");
    });

    it("should default to aluno role", () => {
      const data = { role: "unknown" };
      const result = parseProfile(data);
      expect(result.role).toBe("aluno");
    });

    it("should include institutionId and institutionRole", () => {
      const data = {
        role: "teacher",
        institutionId: "inst-123",
        institutionRole: "admin",
      };
      const result = parseProfile(data);
      expect(result.institutionId).toBe("inst-123");
      expect(result.institutionRole).toBe("admin");
    });
  });

  describe("hasRole", () => {
    it("should return true when role matches", () => {
      const result = hasRole("admin", "admin", "teacher");
      expect(result).toBe(true);
    });

    it("should return false when role does not match", () => {
      const result = hasRole("aluno", "admin", "teacher");
      expect(result).toBe(false);
    });

    it("should match any of multiple roles", () => {
      expect(hasRole("teacher", "admin", "teacher", "institution")).toBe(true);
      expect(hasRole("aluno", "admin", "teacher", "institution")).toBe(false);
    });
  });

  describe("isAdminOrTeacher", () => {
    it("should return true for admin", () => {
      expect(isAdminOrTeacher("admin")).toBe(true);
    });

    it("should return true for teacher", () => {
      expect(isAdminOrTeacher("teacher")).toBe(true);
    });

    it("should return false for aluno", () => {
      expect(isAdminOrTeacher("aluno")).toBe(false);
    });

    it("should return false for institution", () => {
      expect(isAdminOrTeacher("institution")).toBe(false);
    });
  });

  describe("formatRole", () => {
    it("should format admin role", () => {
      expect(formatRole("admin")).toBe("Administrador");
    });

    it("should format teacher role", () => {
      expect(formatRole("teacher")).toBe("Professor");
    });

    it("should format aluno role", () => {
      expect(formatRole("aluno")).toBe("Aluno");
    });

    it("should format institution role", () => {
      expect(formatRole("institution")).toBe("Instituição");
    });
  });
});
