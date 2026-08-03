"use client";

import { useContext } from "react";
import { AuthContext, AuthContextType } from "@/contexts/AuthContext";

/**
 * Hook para acessar contexto de autenticação
 *
 * @returns {AuthContextType} Contexto de autenticação
 *
 * @example
 * const { user, role, isAdmin, logout } = useAuth();
 *
 * if (!user) return <LoginPage />;
 * if (!isAdmin) return <UnauthorizedPage />;
 *
 * return <AdminDashboard />;
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  }

  return context;
}

/**
 * Hook para verificar se usuário está autenticado
 *
 * @returns {boolean} true se usuário está autenticado
 */
export function useIsAuthenticated(): boolean {
  const { user } = useAuth();
  return !!user;
}

/**
 * Hook para verificar se usuário tem uma role específica
 *
 * @param allowedRoles - Roles permitidas
 * @returns {boolean} true se usuário tem uma das roles
 *
 * @example
 * const canManageCourses = useHasRole('admin', 'teacher');
 */
export function useHasRole(...allowedRoles: string[]): boolean {
  const { role } = useAuth();
  return allowedRoles.includes(role);
}

/**
 * Hook para verificar se usuário é admin ou professor
 *
 * @returns {boolean} true se admin ou professor
 */
export function useIsAdminOrTeacher(): boolean {
  const { isAdminOrTeacher } = useAuth();
  return isAdminOrTeacher;
}

/**
 * Hook para verificar se usuário é admin
 *
 * @returns {boolean} true se admin
 */
export function useIsAdmin(): boolean {
  const { isAdmin } = useAuth();
  return isAdmin;
}

/**
 * Hook para obter informações do usuário
 *
 * @returns {object} Informações do usuário
 *
 * @example
 * const { uid, displayName, email } = useUserInfo();
 */
export function useUserInfo() {
  const { user } = useAuth();

  return {
    uid: user?.uid,
    displayName: user?.displayName,
    email: user?.email,
    photoURL: user?.photoURL,
    isEmailVerified: user?.emailVerified,
    metadata: user?.metadata,
  };
}

/**
 * Hook para logout
 *
 * @returns {object} { logout, isLoggingOut }
 */
export function useLogout() {
  const { logout, loading } = useAuth();

  return {
    logout,
    isLoggingOut: loading,
  };
}
