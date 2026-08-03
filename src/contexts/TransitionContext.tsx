"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

interface TransitionContextType {
  isTransitioning: boolean;
  startTransition: () => void;
  endTransition: () => void;
  preserveScroll: boolean;
  setPreserveScroll: (preserve: boolean) => void;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [preserveScroll, setPreserveScroll] = useState(false);
  const [savedScrollPosition, setSavedScrollPosition] = useState(0);

  // Handle scroll preservation during transitions
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      if (!isTransitioning) {
        setSavedScrollPosition(window.scrollY);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isTransitioning]);

  const startTransition = useCallback(() => {
    setIsTransitioning(true);
    // Save current scroll position when transition starts
    setSavedScrollPosition(window.scrollY);
  }, []);

  const endTransition = useCallback(() => {
    setIsTransitioning(false);
    // Restore scroll position if enabled
    if (preserveScroll && typeof window !== "undefined") {
      window.scrollTo(0, savedScrollPosition);
    }
  }, [preserveScroll, savedScrollPosition]);

  return (
    <TransitionContext.Provider
      value={{
        isTransitioning,
        startTransition,
        endTransition,
        preserveScroll,
        setPreserveScroll,
      }}
    >
      {children}
    </TransitionContext.Provider>
  );
}

export function useTransition() {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error("useTransition must be used within TransitionProvider");
  }
  return context;
}
