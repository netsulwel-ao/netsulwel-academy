"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { onIdTokenChanged, signOut as firebaseSignOut, User } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export type UserRole = "aluno" | "teacher" | "admin";
export type UserPlan = "free" | "smart" | "golden";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: UserRole;
  isAdmin: boolean;
  isTeacher: boolean;
  isAdminOrTeacher: boolean;
  plan: UserPlan;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true,
  role: "aluno", isAdmin: false, isTeacher: false, isAdminOrTeacher: false,
  plan: "free",
  logout: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>("aluno");
  const [plan, setPlan] = useState<UserPlan>("free");
  const [loading, setLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  // Usar refs para evitar re-renders desnecessários no effect de redirect
  const redirectingRef = useRef(false);

  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";
  const isAdminOrTeacher = isAdmin || isTeacher;

  const logout = async () => {
    document.cookie = "auth-uid=;path=/;max-age=0";
    setUser(null);
    setRole("aluno");
    setPlan("free");
    setProfileLoaded(false);
    redirectingRef.current = false;
    await firebaseSignOut(auth);
    router.replace("/login");
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) return;
      const data = snap.data();
      setRole(data.role === "admin" ? "admin" : data.role === "teacher" ? "teacher" : "aluno");
      setPlan(data.plan === "smart" || data.plan === "golden" ? data.plan : "free");
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
        setRole("aluno");
        setPlan("free");
        setProfileLoaded(false);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // ── Firestore profile ─────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    // Primeira leitura com getDoc — mais fiável logo após login/registo
    const loadProfile = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (cancelled) return;
        if (snap.exists()) {
          const data = snap.data();
          const r: UserRole = data.role === "admin" ? "admin" : data.role === "teacher" ? "teacher" : "aluno";
          const p: UserPlan = data.plan === "smart" || data.plan === "golden" ? data.plan : "free";
          setRole(r);
          setPlan(p);
        }
        setProfileLoaded(true);
        setLoading(false);
      } catch {
        if (!cancelled) {
          // Sem permissão ou erro — continua com defaults
          setProfileLoaded(true);
          setLoading(false);
        }
      }
    };

    loadProfile();

    // Listener em tempo real para mudanças de role/plan (ex: admin promove aluno)
    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        const r: UserRole = data.role === "admin" ? "admin" : data.role === "teacher" ? "teacher" : "aluno";
        const p: UserPlan = data.plan === "smart" || data.plan === "golden" ? data.plan : "free";
        setRole(r);
        setPlan(p);
      },
      () => { /* ignora erros do listener — já temos os dados do getDoc */ }
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, [user?.uid]);

  // ── Redirect logic — separado e com guard anti-loop ───────
  useEffect(() => {
    // Aguarda loading terminar
    if (loading) return;
    // Aguarda profile se em rota protegida
    if (user && !profileLoaded && (pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin"))) return;

    // Evita múltiplos redirects simultâneos
    if (redirectingRef.current) return;

    const isProtected = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin");
    const isAdminRoute = pathname?.startsWith("/admin");
    const isAuthPage = pathname === "/login" || pathname === "/";

    if (!user && isProtected) {
      // Não logado a tentar aceder rota protegida
      redirectingRef.current = true;
      router.replace("/login");
      setTimeout(() => { redirectingRef.current = false; }, 1000);
      return;
    }

    if (user && profileLoaded && isAdminRoute && !isAdminOrTeacher) {
      // Logado mas sem permissão admin
      redirectingRef.current = true;
      router.replace("/dashboard");
      setTimeout(() => { redirectingRef.current = false; }, 1000);
      return;
    }

    // NÃO redirecionar por verificação de email — causa loops
    // NÃO redirecionar se já está na página correta
  }, [loading, user, profileLoaded, isAdminOrTeacher, pathname]);
  // router intencionalmente omitido — é estável e causava loops

  const isProtectedRoute = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin");
  const stillLoading = loading || (user && !profileLoaded && isProtectedRoute);

  const ctx: AuthContextType = {
    user, loading, role, isAdmin, isTeacher, isAdminOrTeacher, plan, logout, refreshUser,
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
