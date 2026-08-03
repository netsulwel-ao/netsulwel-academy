"use client";

import { useEffect } from "react";
import { useTransition } from "@/contexts/TransitionContext";

interface PageTransitionProps {
  children: React.ReactNode;
  /**
   * Delay before starting the exit animation (in ms)
   * Default: 0
   */
  exitDelay?: number;
  /**
   * Whether to preserve scroll position on transition
   * Default: false
   */
  preserveScroll?: boolean;
  /**
   * Page type for different animation styles
   * Default: 'default'
   */
  type?: "default" | "auth" | "dashboard";
}

/**
 * PageTransition Wrapper
 * 
 * Wraps page content with entrance/exit animations and manages transitions.
 * Combines fade + scale effects for a premium feel.
 * 
 * Usage:
 * ```tsx
 * <PageTransition type="auth">
 *   <YourPageContent />
 * </PageTransition>
 * ```
 */
export function PageTransition({
  children,
  exitDelay = 0,
  preserveScroll = false,
  type = "default",
}: PageTransitionProps) {
  const { endTransition, setPreserveScroll } = useTransition();

  useEffect(() => {
    setPreserveScroll(preserveScroll);
  }, [preserveScroll, setPreserveScroll]);

  useEffect(() => {
    // End transition when page mounts (new page is ready)
    const timer = setTimeout(() => {
      endTransition();
    }, exitDelay + 100); // Small buffer for safety

    return () => clearTimeout(timer);
  }, [endTransition, exitDelay]);

  const getAnimationClass = () => {
    switch (type) {
      case "auth":
        return "animate-page-enter-auth";
      case "dashboard":
        return "animate-page-enter-dashboard";
      case "default":
      default:
        return "animate-page-enter";
    }
  };

  return (
    <div className={`w-full ${getAnimationClass()}`}>
      {children}
    </div>
  );
}
