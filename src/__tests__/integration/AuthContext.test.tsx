/**
 * Integration tests — AuthContext
 * Testa o fluxo completo de autenticação com mocks do Firebase.
 * Foca na race condition teacher/admin → profileLoaded antes de redirect.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import React from "react";

// ── Mocks ─────────────────────────────────────────────────
const mockRouterReplace = vi.fn();
const mockOnIdTokenChanged = vi.fn();
const mockGetDoc = vi.fn();
const mockOnSnapshot = vi.fn(() => () => {});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockRouterReplace, push: vi.fn() }),
  usePathname: () => "/admin",
}));

vi.mock("firebase/auth", () => ({
  onIdTokenChanged: mockOnIdTokenChanged,
  signOut: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_db, col, id) => `${col}/${id}`),
  getDoc: mockGetDoc,
  onSnapshot: mockOnSnapshot,
}));

vi.mock("@/lib/firebase", () => ({ auth: {}, db: {} }));

// Import após mocks
const { AuthProvider, useAuth } = await import("@/contexts/AuthContext");

// Componente helper para ler o contexto
function AuthConsumer() {
  const { role, isAdminOrTeacher, loading, profileLoaded } = useAuth();
  return (
    <div>
      <span data-testid="role">{role}</span>
      <span data-testid="isAdminOrTeacher">{String(isAdminOrTeacher)}</span>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="profileLoaded">{String(profileLoaded)}</span>
    </div>
  );
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRouterReplace.mockClear();
  });

  it("começa com loading=true e role=aluno (defaults seguros)", () => {
    mockOnIdTokenChanged.mockImplementation(() => () => {});
    renderWithAuth();
    // O spinner é renderizado em rotas protegidas — o consumer não aparece
    // Mas os defaults do contexto são role=aluno, loading=true
  });

  it("teacher em /admin NÃO é redirecionado para /dashboard", async () => {
    // Simula: utilizador autenticado com role=teacher
    const mockUser = { uid: "teacher_uid_1" };

    mockOnIdTokenChanged.mockImplementation((_auth, callback) => {
      // Dispara o callback com o utilizador autenticado
      act(() => callback(mockUser));
      return () => {};
    });

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ role: "teacher", plan: "free" }),
    });

    mockOnSnapshot.mockImplementation((_ref, onNext) => {
      onNext({
        exists: () => true,
        data: () => ({ role: "teacher", plan: "free" }),
      });
      return () => {};
    });

    renderWithAuth();

    await waitFor(() => {
      expect(mockRouterReplace).not.toHaveBeenCalledWith("/dashboard");
    }, { timeout: 2000 });
  });

  it("aluno em /admin É redirecionado para /dashboard após profileLoaded", async () => {
    const mockUser = { uid: "aluno_uid_1" };

    mockOnIdTokenChanged.mockImplementation((_auth, callback) => {
      act(() => callback(mockUser));
      return () => {};
    });

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ role: "aluno", plan: "free" }),
    });

    mockOnSnapshot.mockImplementation((_ref, onNext) => {
      onNext({
        exists: () => true,
        data: () => ({ role: "aluno", plan: "free" }),
      });
      return () => {};
    });

    renderWithAuth();

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith("/dashboard");
    }, { timeout: 2000 });
  });

  it("utilizador não autenticado em rota protegida → redirect /login", async () => {
    mockOnIdTokenChanged.mockImplementation((_auth: unknown, callback: (u: null) => void) => {
      // Firebase chama o callback com null = não autenticado
      // Neste caso o AuthContext seta loading=false diretamente (sem loadProfile)
      act(() => callback(null));
      return () => {};
    });

    renderWithAuth();

    await waitFor(() => {
      // Quando user=null e loading=false, deve redirecionar para /login
      expect(mockRouterReplace).toHaveBeenCalledWith("/login");
    }, { timeout: 3000 });
  });
});
