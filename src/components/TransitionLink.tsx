"use client";

import Link from "next/link";
import { motion, type HTMLMotionProps } from "framer-motion";
import { usePageTransition } from "@/hooks/usePageTransition";
import type { ComponentProps } from "react";

const MotionLink = motion.create(Link);

type TransitionLinkProps = Omit<ComponentProps<typeof Link>, "href" | "onClick"> &
  HTMLMotionProps<"a"> & {
    children: React.ReactNode;
  };

/**
 * TransitionLink
 *
 * Next.js Link que dispara a transição de página premium
 * (cortina + overlay animado) antes de navegar.
 *
 * - Links âncora (#...) e externos navegam normalmente.
 * - Suporta props de motion (whileHover, whileTap, etc.).
 */
export function TransitionLink({
  href,
  children,
  onClick,
  ...rest
}: TransitionLinkProps) {
  const navigate = usePageTransition();

  const hrefStr = typeof href === "string" ? href : "";
  const isInternal = hrefStr.startsWith("/") && !hrefStr.startsWith("//");
  const isAnchor = hrefStr.startsWith("#");

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (!isInternal || isAnchor) return;
    // Clicks modificados (nova aba, etc.) mantêm o comportamento nativo
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(hrefStr);
  };

  return (
    <MotionLink href={href} onClick={handleClick} {...rest}>
      {children}
    </MotionLink>
  );
}
