"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  closeButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  closeButton = true,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`
          relative z-50 w-full ${sizes[size]} max-h-[90vh] overflow-y-auto
          rounded-lg bg-gray-900
          border border-gray-700 shadow-2xl
          animate-in fade-in zoom-in-95 duration-200
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 p-6">
          {title && <h2 className="text-xl font-semibold text-white">{title}</h2>}
          {closeButton && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300 focus:outline-none"
              aria-label="Fechar modal"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
