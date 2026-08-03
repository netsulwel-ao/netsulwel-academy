"use client";

import { ReactNode, HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info";
  children: ReactNode;
}

export function Badge({
  variant = "default",
  children,
  className,
  ...props
}: BadgeProps) {
  const variants = {
    default: "bg-gray-700 text-gray-100",
    success: "bg-green-700/20 text-green-400 border border-green-700/30",
    warning: "bg-yellow-700/20 text-yellow-400 border border-yellow-700/30",
    error: "bg-red-700/20 text-red-400 border border-red-700/30",
    info: "bg-blue-700/20 text-blue-400 border border-blue-700/30",
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full px-3 py-1 text-sm font-medium
        ${variants[variant]}
        ${className || ""}
      `}
      {...props}
    >
      {children}
    </span>
  );
}
