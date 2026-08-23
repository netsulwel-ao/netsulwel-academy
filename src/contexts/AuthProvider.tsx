"use client";

import React, { useEffect, useState, useCallback, ReactNode } from "react";
import { User } from "firebase/auth";
import { AuthContext, AuthContextType } from "./AuthContext";
import {
  subscribeToAuthState,
  subscribeToUserProfile,
  loadUserProfile,
  logoutUser,
  setAuthCookie,
  clearAuthCookie,
  UserProfile,
  isAdminOrTeacher,
} from "@/lib/authService";
import { logger } from "@/lib/logger";
import { usePageTransition } from "@/hooks/usePageTransition";

interface AuthProviderProps {
  children: ReactNode;
}

interface ProfileState extends UserProfile {
  profileLoaded: boolean;
}

const DEFAULT_PROFILE: ProfileState = {
  role: "aluno",
  profileLoaded: false,
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileState>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const navigate = usePageTransition();
  const isLoggingOut = React.useRef(false);

  // Handle auth state changes
  useEffect(() => {
    logger.debug("Subscribing to auth state");

    const unsubscribe = subscribeToAuthState(
      (currentUser) => {
        if (currentUser) {
          isLoggingOut.current = false;
          setUser(currentUser);
          currentUser.getIdToken().then((token) => {
            setAuthCookie(currentUser.uid, token).catch(() => {});
          }).catch(() => {});
          logger.info("User authenticated", { uid: currentUser.uid });
        } else {
          setUser(null);
          clearAuthCookie().catch(() => {});
          setProfile(DEFAULT_PROFILE);
          setLoading(false);
          logger.info("User logged out");
        }
      },
      (error) => {
        logger.error("Auth state subscription error", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Load and subscribe to profile
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const loadAndSubscribe = async () => {
      try {
        // Load initial profile
        const profile = await loadUserProfile(user.uid);
        if (cancelled) return;

        if (profile) {
          setProfile({ ...profile, profileLoaded: true });
        } else {
          setProfile({ ...DEFAULT_PROFILE, profileLoaded: true });
        }
        setLoading(false);
      } catch (error) {
        logger.error("Failed to load user profile on init", error, {
          uid: user.uid,
        });
        if (!cancelled) {
          setProfile({ ...DEFAULT_PROFILE, profileLoaded: true });
          setLoading(false);
        }
      }
    };

    loadAndSubscribe();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToUserProfile(
      user.uid,
      (newProfile) => {
        setProfile((prev) => ({ ...prev, ...newProfile }));
      },
      (error) => {
        if (isLoggingOut.current) return;
        logger.error("Profile update subscription error", error, {
          uid: user.uid,
        });
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user?.uid]);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      isLoggingOut.current = true;
      await logoutUser();
      setUser(null);
      setProfile(DEFAULT_PROFILE);
      navigate("/login");
    } catch (error) {
      isLoggingOut.current = false;
      logger.error("Logout failed", error);
      throw error;
    }
  }, [navigate]);

  // Refresh user profile
  const refreshUser = useCallback(async () => {
    if (!user) return;

    try {
      const newProfile = await loadUserProfile(user.uid);
      if (newProfile) {
        setProfile((prev) => ({ ...prev, ...newProfile }));
      }
    } catch (error) {
      logger.error("Failed to refresh user profile", error, { uid: user.uid });
    }
  }, [user?.uid]);

  // Calculate derived state
  const isAdmin = profile.role === "admin";
  const isTeacher = profile.role === "teacher";
  const isInstitution = profile.role === "institution";
  const isAdminOrTeacherState = isAdminOrTeacher(profile.role);

  const ctx: AuthContextType = {
    user,
    loading,
    profileLoaded: profile.profileLoaded,
    role: profile.role,
    isAdmin,
    isTeacher,
    isInstitution,
    isAdminOrTeacher: isAdminOrTeacherState,
    institutionId: profile.institutionId,
    institutionRole: profile.institutionRole,
    logout,
    refreshUser,
  };

  // Sempre renderiza children — rotas públicas (landing, login, etc.)
  // não precisam de esperar auth. Rotas protegidas (dashboard, admin)
  // verificam loading/profileLoaded por conta própria.

  return (
    <AuthContext.Provider value={ctx}>
      {children}
    </AuthContext.Provider>
  );
}
