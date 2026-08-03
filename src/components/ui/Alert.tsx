"use client";

import { ReactNode, HTMLAttributes } from "react";
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from "lucide-react";

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  type?: "error" | "success" | "warning" | "info";
  title?: string;
  children: ReactNode;
  closable?: boolean;
  onClose?: () => void;
}

export function Alert({
  type = "info",
  title,
  children,
  closable = false,
  onClose,
  className,
  ...props
}: AlertProps) {
  const variants = {
    error: {
      bg: "bg-red-950/20 border-red-700/30",
      text: "text-red-400",
      icon: AlertCircle,
    },
    success: {
      bg: "bg-green-950/20 border-green-700/30",
      text: "text-green-400",
      icon: CheckCircle,
    },
    warning: {
      bg: "bg-yellow-950/20 border-yellow-700/30",
      text: "text-yellow-400",
      icon: AlertTriangle,
    },
    info: {
      bg: "bg-blue-950/20 border-blue-700/30",
      text: "text-blue-400",
      icon: Info,
    },
  };

  const variant = variants[type];
  const IconComponent = variant.icon;

  return (
    <div
      className={`
        rounded-lg border p-4 flex gap-3
        ${variant.bg}
        ${className || ""}
      `}
      {...props}
    >
      <IconComponent className={`h-5 w-5 flex-shrink-0 ${variant.text} mt-0.5`} />
      <div className="flex-1">
        {title && <p className={`font-semibold ${variant.text}`}>{title}</p>}
        <div className={`text-sm ${variant.text}`}>{children}</div>
      </div>
      {closable && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-300"
          aria-label="Fechar alerta"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
