/**
 * Integration tests — AuthProvider
 * Testa o estado de autenticação gerenciado pelo AuthProvider.
 * O redirect é responsabilidade do middleware, não do provider.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import React from "react";

// ── Mocks ─────────────────────────────────────────────────
const mockOnIdTokenChanged = vi.fn();
const mockGetDoc = vi.fn();
const mockOnSnapshot = vi.fn(() => () => {});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/dashboard",
}));

vi.mock("firebase/auth", () => ({
  onIdTokenChanged: mockOnIdTokenChanged,
  signOut: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_db: unknown, col: string, id: string) => `${col}/${id}`),
  getDoc: mockGetDoc,
  onSnapshot: mockOnSnapshot,
}));

vi.mock("@/lib/firebase", () => ({ auth: {}, db: {} }));

// Import após mocks
const { AuthProvider } = await import("@/contexts/AuthProvider");
const { TransitionProvider } = await import("@/contexts/TransitionContext");
const { useAuth } = await import("@/hooks/useAuth");

// Componente helper para ler o contexto
function AuthConsumer() {
  const { role, isAdmin, isAdminOrTeacher, loading, profileLoaded } = useAuth();
  return (
    <div>
      <span data-testid="role">{role}</span>
      <span data-testid="isAdmin">{String(isAdmin)}</span>
      <span data-testid="isAdminOrTeacher">{String(isAdminOrTeacher)}</span>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="profileLoaded">{String(profileLoaded)}</span>
    </div>
  );
}

function renderWithAuth() {
  return render(
    <TransitionProvider>
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    </TransitionProvider>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza consumer imediatamente mesmo sem auth state (sem spinner global)", () => {
    // Nunca chama o callback → loading permanece true
    mockOnIdTokenChanged.mockImplementation(() => () => {});

    renderWithAuth();

    // AuthProvider já não mostra spinner global — o consumer renderiza imediatamente
    expect(screen.getByTestId("role")).toBeInTheDocument();
  });

  it("carrega perfil de teacher corretamente", async () => {
    const mockUser = { uid: "teacher_uid_1" };

    mockOnIdTokenChanged.mockImplementation((_auth: unknown, callback: (u: typeof mockUser) => void) => {
      act(() => callback(mockUser));
      return () => {};
    });

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ role: "teacher", plan: "free" }),
    });

    mockOnSnapshot.mockImplementation((_ref: unknown, onNext: (snap: { exists: () => boolean; data: () => { role: string; plan: string } }) => void) => {
      onNext({
        exists: () => true,
        data: () => ({ role: "teacher", plan: "free" }),
      });
      return () => {};
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId("role")).toHaveTextContent("teacher");
    }, { timeout: 3000 });

    expect(screen.getByTestId("isAdmin")).toHaveTextContent("false");
    expect(screen.getByTestId("isAdminOrTeacher")).toHaveTextContent("true");
    expect(screen.getByTestId("profileLoaded")).toHaveTextContent("true");
  });

  it("carrega perfil de aluno corretamente", async () => {
    const mockUser = { uid: "aluno_uid_1" };

    mockOnIdTokenChanged.mockImplementation((_auth: unknown, callback: (u: typeof mockUser) => void) => {
      act(() => callback(mockUser));
      return () => {};
    });

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ role: "aluno", plan: "free" }),
    });

    mockOnSnapshot.mockImplementation((_ref: unknown, onNext: (snap: { exists: () => boolean; data: () => { role: string; plan: string } }) => void) => {
      onNext({
        exists: () => true,
        data: () => ({ role: "aluno", plan: "free" }),
      });
      return () => {};
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId("role")).toHaveTextContent("aluno");
    }, { timeout: 3000 });

    expect(screen.getByTestId("isAdmin")).toHaveTextContent("false");
    expect(screen.getByTestId("isAdminOrTeacher")).toHaveTextContent("false");
  });

  it("utilizador não autenticado → user null, loading false", async () => {
    mockOnIdTokenChanged.mockImplementation((_auth: unknown, callback: (u: null) => void) => {
      act(() => callback(null));
      return () => {};
    });

    renderWithAuth();

    await waitFor(() => {
      // Quando user=null, o provider não mostra spinner
      expect(screen.getByTestId("role")).toHaveTextContent("aluno");
    }, { timeout: 3000 });

    expect(screen.getByTestId("loading")).toHaveTextContent("false");
    expect(screen.getByTestId("profileLoaded")).toHaveTextContent("false");
  });
});
