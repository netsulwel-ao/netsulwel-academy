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
  const [adminLoaded, setAdminLoaded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const prevRole = useRef<UserRole>("aluno");
  const prevPlan = useRef<UserPlan>("free");

  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";
  const isAdminOrTeacher = isAdmin || isTeacher;
  const needsEmailVerification = !!user && !user.emailVerified;

  const logout = async () => {
    document.cookie = "auth-uid=;path=/;max-age=0";
    setUser(null);
    setRole("aluno");
    setPlan("free");
    setAdminLoaded(false);
    await firebaseSignOut(auth);
    router.replace("/login");
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      await user.reload();
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) return;
      const data = snap.data();
      setRole(data.role === "admin" ? "admin" : data.role === "teacher" ? "teacher" : "aluno");
      setPlan(data.plan === "smart" || data.plan === "golden" ? data.plan : "free");
    } catch {
      // silencia erro de refresh
    }
  };

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        document.cookie = `auth-uid=${currentUser.uid};path=/;max-age=86400;SameSite=Lax`;
        setLoading(false);
      } else {
        document.cookie = "auth-uid=;path=/;max-age=0";
        setUser(null);
        setRole("aluno");
        setPlan("free");
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (!snap.exists()) {
        setAdminLoaded(true);
        return;
      }
      const data = snap.data();
      const r = data.role === "admin" ? "admin" : data.role === "teacher" ? "teacher" : "aluno";
      prevRole.current = r;
      prevPlan.current = data.plan === "smart" || data.plan === "golden" ? data.plan : "free";
      setRole(r);
      setPlan(data.plan === "smart" || data.plan === "golden" ? data.plan : "free");
      setAdminLoaded(true);
    }, () => {
      setRole(prevRole.current);
      setPlan(prevPlan.current);
      setAdminLoaded(true);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (loading) return;
    if (!user && (pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin"))) {
      router.replace("/login");
    } else if (user && pathname?.startsWith("/admin") && adminLoaded && !isAdminOrTeacher) {
      router.replace("/dashboard");
    } else if (user && !user.emailVerified && pathname !== "/verify-email" && !pathname?.startsWith("/api")) {
      router.replace("/verify-email");
    }
  }, [user, loading, isAdminOrTeacher, adminLoaded, pathname, router]);

  const isProtectedRoute = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin");
  const needsAdminCheck = pathname?.startsWith("/admin") && !adminLoaded && !!user;

  const ctx = { user, loading, role, isAdmin, isTeacher, isAdminOrTeacher, plan, logout, refreshUser };

  if ((loading || needsAdminCheck || (!user && isProtectedRoute)) && isProtectedRoute) {
    return (
      <AuthContext.Provider value={ctx}>
        <div className="flex items-center justify-center min-h-screen bg-gray-950">
          <Loader2 className="h-8 w-8 animate-spin text-purple" />
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
