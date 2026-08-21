import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { AuthProvider } from "@/contexts/AuthProvider";
import { TransitionProvider } from "@/contexts/TransitionContext";

/**
 * Custom render function that includes providers
 */
function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <TransitionProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </TransitionProvider>
  );
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

/**
 * Mock user data for tests
 */
export const mockUser = {
  uid: "test-user-123",
  email: "test@example.com",
  displayName: "Test User",
  emailVerified: false,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  refreshToken: "test-token",
  getIdToken: async () => "test-id-token",
  getIdTokenResult: async () => ({
    token: "test-id-token",
    expirationTime: new Date().toISOString(),
    authTime: new Date().toISOString(),
    issuedAtTime: new Date().toISOString(),
    signInProvider: "custom",
    signInSecondFactor: null,
    claims: {},
  }),
  reload: async () => {},
  toJSON: () => ({}),
} as any;

/**
 * Mock auth profile data
 */
export const mockProfile = {
  role: "aluno" as const,
  plan: "free" as const,
  institutionId: undefined,
  institutionRole: undefined,
};

/**
 * Mock admin profile
 */
export const mockAdminProfile = {
  ...mockProfile,
  role: "admin" as const,
  plan: "golden" as const,
};

/**
 * Mock teacher profile
 */
export const mockTeacherProfile = {
  ...mockProfile,
  role: "teacher" as const,
  plan: "smart" as const,
};

/**
 * Create mock auth context value
 */
export const createMockAuthContext = (overrides = {}) => ({
  user: mockUser,
  loading: false,
  profileLoaded: true,
  role: "aluno" as const,
  plan: "free" as const,
  isAdmin: false,
  isTeacher: false,
  isInstitution: false,
  isAdminOrTeacher: false,
  logout: async () => {},
  refreshUser: async () => {},
  ...overrides,
});

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };
