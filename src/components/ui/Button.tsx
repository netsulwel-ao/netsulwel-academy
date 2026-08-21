"use client";

import { ReactNode, ButtonHTMLAttributes, forwardRef } from "react";
import Link from "next/link";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: ReactNode;
  as?: "button" | "link";
  href?: string;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      children,
      disabled,
      className,
      as = "button",
      href,
      fullWidth = false,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary: "bg-purple-600 hover:bg-purple-700 text-white",
      secondary: "bg-gray-700 hover:bg-gray-800 text-white",
      ghost: "bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white",
      danger: "bg-red-600 hover:bg-red-700 text-white",
    };

    const sizes = {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-2.5 text-base",
      lg: "px-6 py-3 text-lg",
    };

    const baseClasses = `
      rounded-lg font-semibold transition-colors
      disabled:opacity-50 disabled:cursor-not-allowed
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
      ${variants[variant]}
      ${sizes[size]}
      ${fullWidth ? "w-full" : ""}
      ${className || ""}
    `;

    const content = isLoading ? (
      <span className="flex items-center gap-2">
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Carregando...
      </span>
    ) : (
      children
    );

    if (as === "link" && href) {
      return (
        <Link href={href} className={baseClasses} ref={ref as React.RefObject<HTMLAnchorElement>}>
          {content}
        </Link>
      );
    }

    return (
      <button className={baseClasses} disabled={disabled || isLoading} {...props} ref={ref as React.RefObject<HTMLButtonElement>}>
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";
