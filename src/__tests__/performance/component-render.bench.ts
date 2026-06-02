/**
 * Benchmark de render de componentes críticos
 * Usa Vitest bench para medir tempo de renderização.
 *
 * Executar: npx vitest bench
 */
import { bench, describe } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

// ── Componentes a medir ────────────────────────────────────

// Mock simples para componentes que dependem de contexto
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "test", displayName: "Test User", email: "test@test.com", photoURL: null },
    role: "aluno",
    plan: "free",
    isAdmin: false,
    isTeacher: false,
    isAdminOrTeacher: false,
    loading: false,
    profileLoaded: true,
  }),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  writeBatch: vi.fn(() => ({ update: vi.fn(), commit: vi.fn() })),
}));

vi.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard",
}));

describe("Component render benchmarks", () => {
  bench(
    "Dashboard Header — render inicial",
    async () => {
      const { default: Header } = await import("@/components/dashboard/Header");
      const { unmount } = render(React.createElement(Header, { theme: "dark" }));
      unmount();
    },
    { iterations: 50 }
  );

  bench(
    "Dashboard Header — light mode",
    async () => {
      const { default: Header } = await import("@/components/dashboard/Header");
      const { unmount } = render(React.createElement(Header, { theme: "light" }));
      unmount();
    },
    { iterations: 50 }
  );

  bench(
    "Admin Header — render inicial",
    async () => {
      const { default: Header } = await import("@/components/admin/Header");
      const { unmount } = render(React.createElement(Header, { theme: "dark" }));
      unmount();
    },
    { iterations: 50 }
  );
});
