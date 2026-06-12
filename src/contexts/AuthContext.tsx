"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { onIdTokenChanged, signOut as firebaseSignOut, User } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export type UserRole = "aluno" | "teacher" | "admin" | "institution";
export type UserPlan = "free" | "smart" | "golden";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profileLoaded: boolean;
  role: UserRole;
  plan: UserPlan;
  isAdmin: boolean;
  isTeacher: boolean;
  isInstitution: boolean;
  isAdminOrTeacher: boolean;
  institutionId?: string;
  institutionRole?: "admin" | "teacher" | "student";
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true, profileLoaded: false,
  role: "aluno", plan: "free", isAdmin: false, isTeacher: false, isInstitution: false, isAdminOrTeacher: false,
  logout: async () => {},
  refreshUser: async () => {},
});

// Estado de perfil combinado — atualizado num único setState para evitar renders intermédios
interface ProfileState {
  role: UserRole;
  plan: UserPlan;
  profileLoaded: boolean;
  institutionId?: string;
  institutionRole?: "admin" | "teacher" | "student";
}

const DEFAULT_PROFILE: ProfileState = { role: "aluno", plan: "free", profileLoaded: false };

function parseProfile(data: Record<string, unknown>): { role: UserRole; plan: UserPlan; institutionId?: string; institutionRole?: "admin" | "teacher" | "student" } {
  const role: UserRole = data.role === "admin" ? "admin" : data.role === "teacher" ? "teacher" : data.role === "institution" ? "institution" : "aluno";
  const plan: UserPlan = data.plan === "smart" ? "smart" : data.plan === "golden" ? "golden" : "free";
  const institutionId = data.institutionId as string | undefined;
  const institutionRole = data.institutionRole as "admin" | "teacher" | "student" | undefined;
  return { role, plan, institutionId, institutionRole };
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileState>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  const redirectingRef = useRef(false);

  const { role, plan, profileLoaded, institutionId, institutionRole } = profile;
  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";
  const isInstitution = role === "institution";
  const isAdminOrTeacher = isAdmin || isTeacher;

  const logout = async () => {
    document.cookie = "auth-uid=;path=/;max-age=0";
    setUser(null);
    setProfile(DEFAULT_PROFILE);
    setLoading(false);
    redirectingRef.current = false;
    await firebaseSignOut(auth);
    router.replace("/login");
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) return;
      const { role, plan, institutionId, institutionRole } = parseProfile(snap.data() as Record<string, unknown>);
      setProfile((prev) => ({ ...prev, role, plan, institutionId, institutionRole }));
    } catch { /* silencia */ }
  };

  // ── Auth state ────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        document.cookie = `auth-uid=${currentUser.uid};path=/;max-age=86400;SameSite=Lax`;
      } else {
        document.cookie = "auth-uid=;path=/;max-age=0";
        setUser(null);
        setProfile(DEFAULT_PROFILE);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // ── Firestore profile ─────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    // Primeira leitura com getDoc — atualiza role+profileLoaded num único setState
    const loadProfile = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (cancelled) return;
        if (snap.exists()) {
          const { role, plan, institutionId, institutionRole } = parseProfile(snap.data() as Record<string, unknown>);
          // Um único setState → sem renders com estado parcial
          setProfile({ role, plan, institutionId, institutionRole, profileLoaded: true });
        } else {
          setProfile({ role: "aluno", plan: "free", profileLoaded: true });
        }
        setLoading(false);
      } catch {
        if (!cancelled) {
          setProfile({ role: "aluno", plan: "free", profileLoaded: true });
          setLoading(false);
        }
      }
    };

    loadProfile();

    // Listener em tempo real para mudanças de role (ex: admin promove aluno)
    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        if (!snap.exists()) return;
        const { role, plan, institutionId, institutionRole } = parseProfile(snap.data() as Record<string, unknown>);
        setProfile((prev) => ({ ...prev, role, plan, institutionId, institutionRole }));
      },
      () => { /* ignora erros do listener */ }
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, [user?.uid]);

  // ── Redirect logic ────────────────────────────────────────
  useEffect(() => {
    // Para utilizador não autenticado, basta loading=false
    // Para utilizador autenticado, aguarda também profileLoaded
    if (loading) return;
    if (user && !profileLoaded) return;
    if (redirectingRef.current) return;

    const isProtected = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin");
    const isAdminRoute = pathname?.startsWith("/admin");

    if (!user && isProtected) {
      redirectingRef.current = true;
      router.replace("/login");
      setTimeout(() => { redirectingRef.current = false; }, 1000);
      return;
    }

    if (user && isAdminRoute && !isAdmin) {
      redirectingRef.current = true;
      router.replace("/dashboard");
      setTimeout(() => { redirectingRef.current = false; }, 1000);
      return;
    }
  }, [loading, profileLoaded, user, isAdminOrTeacher, pathname]);
  // router intencionalmente omitido — é estável

  const isProtectedRoute = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin");
  // Só mostra spinner se autenticado mas ainda a carregar o perfil
  const stillLoading = loading || (!!user && !profileLoaded && isProtectedRoute);

  const ctx: AuthContextType = {
    user, loading, profileLoaded, role, plan, isAdmin, isTeacher, isInstitution, isAdminOrTeacher, institutionId, institutionRole, logout, refreshUser,
  };

  // Mostra spinner apenas em rotas protegidas enquanto carrega
  if (stillLoading && isProtectedRoute) {
    return (
      <AuthContext.Provider value={ctx}>
        <div className="flex items-center justify-center min-h-screen bg-gray-950">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={ctx}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
