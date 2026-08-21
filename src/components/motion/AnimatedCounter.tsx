"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

interface AnimatedCounterProps {
  /** Valor final */
  to: number;
  /** Casas decimais */
  decimals?: number;
  /** Prefixo (ex: "+") */
  prefix?: string;
  /** Sufixo (ex: "k", "★") */
  suffix?: string;
  /** Duração em segundos */
  duration?: number;
  className?: string;
}

/**
 * AnimatedCounter — número que conta até ao valor quando entra no viewport.
 */
export function AnimatedCounter({
  to,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1.8,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const render = (v: number) => {
      el.textContent = `${prefix}${v.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`;
    };

    if (reduceMotion || !inView) {
      render(to);
      return;
    }

    const controls = animate(0, to, {
      duration,
      ease: EASE,
      onUpdate: render,
    });

    return () => controls.stop();
  }, [inView, to, decimals, prefix, suffix, duration, reduceMotion]);

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}
