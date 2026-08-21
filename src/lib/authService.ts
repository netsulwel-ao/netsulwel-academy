import { onIdTokenChanged, signOut as firebaseSignOut, User } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { logger } from "@/lib/logger";

export type UserRole = "aluno" | "teacher" | "admin" | "institution";

export interface UserProfile {
  role: UserRole;
  institutionId?: string;
  institutionRole?: "admin" | "teacher" | "student";
}

/**
 * Parse user profile data from Firestore
 */
export function parseProfile(data: Record<string, unknown>): UserProfile {
  const role: UserRole =
    data.role === "admin"
      ? "admin"
      : data.role === "teacher"
        ? "teacher"
        : data.role === "institution"
          ? "institution"
          : "aluno";

  const institutionId = data.institutionId as string | undefined;
  const institutionRole = data.institutionRole as "admin" | "teacher" | "student" | undefined;

  return { role, institutionId, institutionRole };
}

/**
 * Load user profile from Firestore
 */
export async function loadUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) {
      logger.warn("User profile not found", { uid });
      return null;
    }

    const profile = parseProfile(snap.data() as Record<string, unknown>);
    logger.debug("User profile loaded", { uid, role: profile.role });
    return profile;
  } catch (error) {
    logger.error("Failed to load user profile", error, { uid });
    throw error;
  }
}

/**
 * Subscribe to real-time user profile updates
 */
export function subscribeToUserProfile(
  uid: string,
  onUpdate: (profile: UserProfile) => void,
  onError?: (error: Error) => void
) {
  try {
    const unsub = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        if (snap.exists()) {
          const profile = parseProfile(snap.data() as Record<string, unknown>);
          onUpdate(profile);
        }
      },
      (error) => {
        logger.error("Profile subscription error", error, { uid });
        if (onError) onError(error);
      }
    );

    return unsub;
  } catch (error) {
    logger.error("Failed to subscribe to profile", error, { uid });
    throw error;
  }
}

/**
 * Subscribe to auth state changes
 */
export function subscribeToAuthState(
  onAuthStateChanged: (user: User | null) => void,
  onError?: (error: Error) => void
) {
  try {
    const unsub = onIdTokenChanged(auth, onAuthStateChanged, (error) => {
      logger.error("Auth state subscription error", error);
      if (onError) onError(error);
    });

    return unsub;
  } catch (error) {
    logger.error("Failed to subscribe to auth state", error);
    throw error;
  }
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
    await clearAuthCookie();
    logger.info("User logged out successfully");
  } catch (error) {
    logger.error("Failed to logout", error);
    throw error;
  }
}

/**
 * Set auth cookie via API route (HttpOnly, Secure)
 */
export async function setAuthCookie(uid: string): Promise<void> {
  try {
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, action: "set" }),
    });
  } catch (error) {
    logger.error("Failed to set auth cookie", error, { uid });
  }
}

/**
 * Clear auth cookie via API route
 */
export async function clearAuthCookie(): Promise<void> {
  try {
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear" }),
    });
  } catch (error) {
    logger.error("Failed to clear auth cookie", error);
  }
}

/**
 * Check user roles
 */
export function hasRole(role: UserRole, ...allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(role);
}

/**
 * Check if user is admin or teacher
 */
export function isAdminOrTeacher(role: UserRole): boolean {
  return role === "admin" || role === "teacher";
}

/**
 * Format role for display
 */
export function formatRole(role: UserRole): string {
  const roleMap: Record<UserRole, string> = {
    aluno: "Aluno",
    teacher: "Professor",
    admin: "Administrador",
    institution: "Instituição",
  };
  return roleMap[role];
}


