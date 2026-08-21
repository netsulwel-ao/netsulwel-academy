import type { Variants } from "framer-motion";

export const EASE = [0.16, 1, 0.3, 1] as const;

/** Contentor com stagger para entradas em cascata */
export const staggerContainer = (stagger = 0.09, delay = 0): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger,
      delayChildren: delay,
    },
  },
});

/** Item que sobe com fade + blur */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: EASE },
  },
};

/** Item que entra pela direita */
export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -28, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: EASE },
  },
};

/** Item que entra pela esquerda */
export const fadeRight: Variants = {
  hidden: { opacity: 0, x: 28, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: EASE },
  },
};

/** Apenas fade + scale */
export const fadeScale: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: EASE },
  },
};
