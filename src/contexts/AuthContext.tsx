"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export type UserPlan = "free" | "smart" | "golden";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  plan: UserPlan;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isAdmin: false, plan: "free" });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [plan, setPlan] = useState<UserPlan>("free");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const prevIsAdmin = useRef(false);
  const prevPlan = useRef<UserPlan>("free");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        let adminStatus = false;
        let userPlan: UserPlan = "free";
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.role === "admin") adminStatus = true;
            if (data.plan === "smart" || data.plan === "golden") userPlan = data.plan;
          }
          prevIsAdmin.current = adminStatus;
          prevPlan.current = userPlan;
          setIsAdmin(adminStatus);
          setPlan(userPlan);
        } catch (error: any) {
          if (error?.code !== "permission-denied") {
            console.error("Erro a verificar utilizador:", error);
          }
          setIsAdmin(prevIsAdmin.current);
          setPlan(prevPlan.current);
        }
        setLoading(false);
      } else {
        setUser(null);
        setIsAdmin(false);
        setPlan("free");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    if (pathname?.startsWith("/admin")) {
      if (!user) {
        router.push("/login");
      } else if (!isAdmin) {
        router.push("/dashboard");
      }
    } else if (!user && pathname?.startsWith("/dashboard")) {
      router.push("/login");
    }
  }, [user, loading, isAdmin, pathname, router]);

  const isProtectedRoute = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin");

  if ((!user || loading) && isProtectedRoute) {
    return (
      <AuthContext.Provider value={{ user, loading, isAdmin, plan }}>
        <div className="flex items-center justify-center min-h-screen bg-gray-950">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, plan }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
