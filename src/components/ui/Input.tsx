"use client";

import { InputHTMLAttributes, ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
}

export function Input({
  label,
  error,
  helperText,
  icon: Icon,
  iconPosition = "left",
  className,
  ...props
}: InputProps) {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-300" htmlFor={props.id}>
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && iconPosition === "left" && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Icon className="h-5 w-5 text-gray-500" />
          </div>
        )}
        <input
          className={`
            block w-full border rounded-lg bg-gray-950/50 py-2.5 text-white
            placeholder-gray-600 transition-colors
            focus:outline-none focus:ring-2 focus:ring-purple-500
            focus:border-purple-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${Icon && iconPosition === "left" ? "pl-10 pr-3" : "px-3"}
            ${Icon && iconPosition === "right" ? "pl-3 pr-10" : "px-3"}
            ${error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-700"}
            ${className || ""}
          `}
          {...props}
        />
        {Icon && iconPosition === "right" && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <Icon className="h-5 w-5 text-gray-500" />
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {helperText && !error && <p className="text-sm text-gray-400">{helperText}</p>}
    </div>
  );
}
