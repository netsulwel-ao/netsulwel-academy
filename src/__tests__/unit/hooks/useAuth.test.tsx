import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { renderHook } from "@testing-library/react";
import { useAuth, useIsAuthenticated, useHasRole, useIsAdmin } from "@/hooks/useAuth";
import { AuthContext } from "@/contexts/AuthContext";
import { createMockAuthContext } from "@/__tests__/utils/testHelpers";

describe("useAuth hooks", () => {
  describe("useAuth", () => {
    it("should return default context when outside provider", () => {
      const { result } = renderHook(() => useAuth());
      // Default context has user=null, role=aluno
      expect(result.current).toBeDefined();
      expect(result.current.role).toBe("aluno");
    });

    it("should return auth context when inside provider", () => {
      const mockContext = createMockAuthContext();

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider value={mockContext}>
          {children}
        </AuthContext.Provider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeDefined();
      expect(result.current.role).toBe("aluno");
      expect(result.current.isAdmin).toBe(false);
    });

    it("should have logout function", () => {
      const mockLogout = vi.fn();
      const mockContext = createMockAuthContext({ logout: mockLogout });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider value={mockContext}>
          {children}
        </AuthContext.Provider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.logout).toBe("function");
    });
  });

  describe("useIsAuthenticated", () => {
    it("should return true when user exists", () => {
      const mockContext = createMockAuthContext({ user: { uid: "123" } as any });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider value={mockContext}>
          {children}
        </AuthContext.Provider>
      );

      const { result } = renderHook(() => useIsAuthenticated(), { wrapper });

      expect(result.current).toBe(true);
    });

    it("should return false when user is null", () => {
      const mockContext = createMockAuthContext({ user: null });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider value={mockContext}>
          {children}
        </AuthContext.Provider>
      );

      const { result } = renderHook(() => useIsAuthenticated(), { wrapper });

      expect(result.current).toBe(false);
    });
  });

  describe("useHasRole", () => {
    it("should return true when user has required role", () => {
      const mockContext = createMockAuthContext({ role: "admin" });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider value={mockContext}>
          {children}
        </AuthContext.Provider>
      );

      const { result } = renderHook(() => useHasRole("admin", "teacher"), { wrapper });

      expect(result.current).toBe(true);
    });

    it("should return false when user does not have required role", () => {
      const mockContext = createMockAuthContext({ role: "aluno" });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider value={mockContext}>
          {children}
        </AuthContext.Provider>
      );

      const { result } = renderHook(() => useHasRole("admin", "teacher"), { wrapper });

      expect(result.current).toBe(false);
    });
  });

  describe("useIsAdmin", () => {
    it("should return true when user is admin", () => {
      const mockContext = createMockAuthContext({ isAdmin: true });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider value={mockContext}>
          {children}
        </AuthContext.Provider>
      );

      const { result } = renderHook(() => useIsAdmin(), { wrapper });

      expect(result.current).toBe(true);
    });

    it("should return false when user is not admin", () => {
      const mockContext = createMockAuthContext({ isAdmin: false });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider value={mockContext}>
          {children}
        </AuthContext.Provider>
      );

      const { result } = renderHook(() => useIsAdmin(), { wrapper });

      expect(result.current).toBe(false);
    });
  });
});
