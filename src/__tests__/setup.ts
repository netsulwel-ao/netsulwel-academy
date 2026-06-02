import "@testing-library/jest-dom";
import { vi } from "vitest";

// ── Mock Firebase ─────────────────────────────────────────
vi.mock("@/lib/firebase", () => ({
  db: {},
  auth: {},
}));

vi.mock("@/lib/firebase-admin", () => ({
  getFirebaseAdmin: vi.fn(() => ({
    auth: () => ({ verifyIdToken: vi.fn() }),
    firestore: () => ({ collection: vi.fn() }),
  })),
}));

// ── Mock Next.js navigation ───────────────────────────────
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/dashboard",
  useParams: () => ({}),
}));

// ── Supress console.error em testes ──────────────────────
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("React")) return;
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});
