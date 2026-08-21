import { createContext } from "react";
import { User } from "firebase/auth";
import { UserRole } from "@/lib/authService";

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  profileLoaded: boolean;
  role: UserRole;
  isAdmin: boolean;
  isTeacher: boolean;
  isInstitution: boolean;
  isAdminOrTeacher: boolean;
  institutionId?: string;
  institutionRole?: "admin" | "teacher" | "student";
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  profileLoaded: false,
  role: "aluno",
  isAdmin: false,
  isTeacher: false,
  isInstitution: false,
  isAdminOrTeacher: false,
  logout: async () => {},
  refreshUser: async () => {},
});


// Re-export useAuth from hooks for backwards compatibility
export { useAuth, useIsAuthenticated, useHasRole, useIsAdminOrTeacher, useIsAdmin, useUserInfo, useLogout } from "@/hooks/useAuth";

// Re-export types from authService
export type { UserRole, UserProfile } from "@/lib/authService";
