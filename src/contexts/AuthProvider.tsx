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
  parseProfile,
  isAdminOrTeacher,
} from "@/lib/authService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { logger } from "@/lib/logger";
import { Spinner } from "@/components/ui/Spinner";

interface AuthProviderProps {
  children: ReactNode;
}

interface ProfileState extends UserProfile {
  profileLoaded: boolean;
}

const DEFAULT_PROFILE: ProfileState = {
  role: "aluno",
  plan: "free",
  profileLoaded: false,
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileState>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  // Handle auth state changes
  useEffect(() => {
    logger.debug("Subscribing to auth state");

    const unsubscribe = subscribeToAuthState(
      (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          setAuthCookie(currentUser.uid);
          logger.info("User authenticated", { uid: currentUser.uid });
        } else {
          setUser(null);
          clearAuthCookie();
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
      await logoutUser();
      setUser(null);
      setProfile(DEFAULT_PROFILE);
    } catch (error) {
      logger.error("Logout failed", error);
      throw error;
    }
  }, []);

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
    plan: profile.plan,
    isAdmin,
    isTeacher,
    isInstitution,
    isAdminOrTeacher: isAdminOrTeacherState,
    institutionId: profile.institutionId,
    institutionRole: profile.institutionRole,
    logout,
    refreshUser,
  };

  // Show loading spinner only on protected routes
  const isLoading = loading || (!!user && !profile.profileLoaded);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center space-y-4">
          <Spinner size="lg" color="primary" />
          <p className="text-gray-400 text-sm">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={ctx}>
      {children}
    </AuthContext.Provider>
  );
}
