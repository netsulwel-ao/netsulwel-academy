"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface Action {
  label: string;
  href: string;
  icon?: LucideIcon;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: Action;
  secondaryAction?: Action;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, secondaryAction, compact }: EmptyStateProps) {
  return (
    <div role="status" aria-live="polite" className={`flex flex-col items-center justify-center text-center ${compact ? "py-12" : "py-20"} bg-gray-900/40 border border-gray-800`}>
      <div className="h-16 w-16 flex items-center justify-center bg-gray-800/50 mb-4">
        <Icon className="h-8 w-8 text-gray-500" />
      </div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
      {description && <p className="mt-2 text-base text-gray-400 max-w-md">{description}</p>}
      {action && (
        <Link href={action.href}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-purple hover:bg-purple-light text-white text-sm font-bold transition-colors">
          {action.icon && <action.icon className="h-4 w-4" />}
          {action.label}
        </Link>
      )}
      {secondaryAction && (
        <Link href={secondaryAction.href}
          className="mt-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-purple transition-colors font-bold">
          {secondaryAction.label}
          {secondaryAction.icon && <secondaryAction.icon className="h-4 w-4" />}
        </Link>
      )}
    </div>
  );
}
