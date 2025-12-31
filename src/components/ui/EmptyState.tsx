"use client";

import { ReactNode } from "react";
import Link from "next/link";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="glass-card p-12 text-center animate-fade-in">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-bg-tertiary flex items-center justify-center">
        {icon}
      </div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-text-secondary mb-6">{description}</p>
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="btn-primary inline-flex items-center gap-2 py-3 px-6"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="btn-primary inline-flex items-center gap-2 py-3 px-6"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
