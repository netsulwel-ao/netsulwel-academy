"use client";

import { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: "sm" | "md" | "lg" | "xl";
  hover?: boolean;
}

export function Card({
  children,
  padding = "md",
  hover = false,
  className,
  ...props
}: CardProps) {
  const paddingVariants = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
    xl: "p-12",
  };

  return (
    <div
      className={`
        rounded-lg border border-gray-700 bg-gray-900
        shadow-lg
        ${hover ? "hover:border-purple-500/50 hover:shadow-xl transition-all" : ""}
        ${paddingVariants[padding]}
        ${className || ""}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
