"use client";

import { useEffect } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
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

const EASE = [0.16, 1, 0.3, 1] as const;

const variants: Record<"default" | "auth" | "dashboard", Variants> = {
  default: {
    hidden: { opacity: 0, y: 12, scale: 0.99 },
    visible: { opacity: 1, y: 0, scale: 1 },
  },
  auth: {
    hidden: { opacity: 0, y: 16, filter: "blur(10px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  },
  dashboard: {
    hidden: { opacity: 0, scale: 0.985 },
    visible: { opacity: 1, scale: 1 },
  },
};

const durations: Record<"default" | "auth" | "dashboard", number> = {
  default: 0.45,
  auth: 0.55,
  dashboard: 0.35,
};

/**
 * PageTransition Wrapper
 *
 * Wraps page content with premium Framer Motion entrance animations and
 * manages the transition lifecycle (signals the overlay to reveal).
 */
export function PageTransition({
  children,
  exitDelay = 0,
  preserveScroll = false,
  type = "default",
}: PageTransitionProps) {
  const { endTransition, setPreserveScroll } = useTransition();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setPreserveScroll(preserveScroll);
  }, [preserveScroll, setPreserveScroll]);

  useEffect(() => {
    // End transition when page mounts (new page is ready)
    const timer = setTimeout(() => {
      endTransition();
    }, exitDelay + 80);

    return () => clearTimeout(timer);
  }, [endTransition, exitDelay]);

  if (reduceMotion) {
    return <div className="w-full">{children}</div>;
  }

  return (
    <motion.div
      className="w-full"
      variants={variants[type]}
      initial="hidden"
      animate="visible"
      transition={{ duration: durations[type], ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
