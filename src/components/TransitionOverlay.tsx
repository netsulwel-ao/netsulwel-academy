"use client";

import { useTransition } from "@/contexts/TransitionContext";
import { useEffect, useState } from "react";

export function TransitionOverlay() {
  const { isTransitioning } = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Transition Overlay with Blur and Fade */}
      <div
        className={`fixed inset-0 z-[9998] pointer-events-none transition-all duration-200 ${
          isTransitioning
            ? "opacity-100 backdrop-blur-md"
            : "opacity-0 backdrop-blur-0"
        }`}
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.15)",
        }}
      />

      {/* Loading Indicator (subtle) */}
      {isTransitioning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
          <div className="relative w-12 h-12">
            {/* Spinning gradient border */}
            <div
              className="absolute inset-0 rounded-full animate-spin"
              style={{
                background: "conic-gradient(from 0deg, rgba(124, 58, 237, 0.8), rgba(99, 102, 241, 0.2))",
                animation: "spin-loader 1s linear infinite",
              }}
            />

            {/* Inner circle */}
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-slate-950 to-slate-900" />

            {/* Center glow */}
            <div className="absolute inset-0 rounded-full animate-pulse" />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin-loader {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
