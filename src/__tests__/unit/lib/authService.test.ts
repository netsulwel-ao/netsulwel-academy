import { describe, it, expect, vi } from "vitest";
import {
  parseProfile,
  hasRole,
  isAdminOrTeacher,
  formatRole,
  formatPlan,
  type UserRole,
  type UserPlan,
} from "@/lib/authService";

describe("authService", () => {
  describe("parseProfile", () => {
    it("should parse admin role", () => {
      const data = { role: "admin", plan: "golden" };
      const result = parseProfile(data);
      expect(result.role).toBe("admin");
    });

    it("should parse teacher role", () => {
      const data = { role: "teacher", plan: "smart" };
      const result = parseProfile(data);
      expect(result.role).toBe("teacher");
    });

    it("should parse institution role", () => {
      const data = { role: "institution", plan: "golden" };
      const result = parseProfile(data);
      expect(result.role).toBe("institution");
    });

    it("should default to aluno role", () => {
      const data = { role: "unknown" };
      const result = parseProfile(data);
      expect(result.role).toBe("aluno");
    });

    it("should parse smart plan", () => {
      const data = { plan: "smart" };
      const result = parseProfile(data);
      expect(result.plan).toBe("smart");
    });

    it("should parse golden plan", () => {
      const data = { plan: "golden" };
      const result = parseProfile(data);
      expect(result.plan).toBe("golden");
    });

    it("should default to free plan", () => {
      const data = { plan: "unknown" };
      const result = parseProfile(data);
      expect(result.plan).toBe("free");
    });

    it("should include institutionId and institutionRole", () => {
      const data = {
        role: "teacher",
        plan: "smart",
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

  describe("formatPlan", () => {
    it("should format free plan", () => {
      expect(formatPlan("free")).toBe("Gratuito");
    });

    it("should format smart plan", () => {
      expect(formatPlan("smart")).toBe("Smart");
    });

    it("should format golden plan", () => {
      expect(formatPlan("golden")).toBe("Golden");
    });
  });
});
