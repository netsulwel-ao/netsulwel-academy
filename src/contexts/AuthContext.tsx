"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
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
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true,
  role: "aluno", isAdmin: false, isTeacher: false, isAdminOrTeacher: false,
  plan: "free"
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        document.cookie = `auth-uid=${currentUser.uid};path=/;max-age=86400;SameSite=Strict`;
      } else {
        setUser(null);
        document.cookie = "auth-uid=;path=/;max-age=0";
        setRole("aluno");
        setPlan("free");
      }
      setLoading(false);
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

    if (pathname?.startsWith("/admin")) {
      if (!user) {
        router.push("/login");
      } else if (adminLoaded && !isAdminOrTeacher) {
        router.push("/dashboard");
      }
    } else if (!user && pathname?.startsWith("/dashboard")) {
      router.push("/login");
    }
  }, [user, loading, isAdminOrTeacher, adminLoaded, pathname, router]);

  const isProtectedRoute = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin");
  const needsAdminCheck = pathname?.startsWith("/admin") && !adminLoaded && !!user;

  if ((!user || loading || needsAdminCheck) && isProtectedRoute) {
    return (
      <AuthContext.Provider value={{ user, loading, role, isAdmin, isTeacher, isAdminOrTeacher, plan }}>
        <div className="flex items-center justify-center min-h-screen bg-gray-950">
          <Loader2 className="h-8 w-8 animate-spin text-purple" />
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, role, isAdmin, isTeacher, isAdminOrTeacher, plan }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
