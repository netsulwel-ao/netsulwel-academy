"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Atraso em segundos antes de revelar */
  delay?: number;
  /** Deslocamento vertical inicial (px) */
  y?: number;
  /** Deslocamento horizontal inicial (px) */
  x?: number;
  /** Revelar apenas uma vez (default true) */
  once?: boolean;
  /** Aplicar blur na entrada */
  blur?: boolean;
  /** Escala inicial */
  scale?: number;
  /** Duração em segundos */
  duration?: number;
  /** Margem do viewport para disparo (ex: "-60px") */
  margin?: string;
}

/**
 * Reveal — animação de entrada ao fazer scroll (Framer Motion).
 * Usa whileInView para disparar quando o elemento entra no viewport.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  x = 0,
  once = true,
  blur = true,
  scale = 1,
  duration = 0.65,
  margin = "-60px",
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0,
        y,
        x,
        scale,
        filter: blur ? "blur(6px)" : "blur(0px)",
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
        filter: "blur(0px)",
      }}
      viewport={{ once, margin }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
