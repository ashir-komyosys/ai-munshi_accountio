"use client";

import React from "react";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import { Button, Card } from "@/components/ui/primitives";

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading content">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 rounded-2xl bg-[var(--bg-subtle)] animate-pulse border border-[var(--border-default)]"
          />
        ))}
      </div>
      <Card className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="h-10 rounded-xl bg-[var(--bg-subtle)] animate-pulse" />
        ))}
      </Card>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card className="p-10 flex flex-col items-center justify-center text-center">
      <div className="h-12 w-12 rounded-2xl bg-[var(--brand-cream)] flex items-center justify-center text-[var(--brand-primary)] mb-3">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="font-heading text-base font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-sm mt-1">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-4" size="sm">
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}

export function ErrorState({
  message = "Something went wrong while loading data.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="p-8 flex flex-col items-center justify-center text-center border-[var(--status-danger)]/30">
      <div className="h-11 w-11 rounded-2xl bg-[var(--status-danger-bg)] flex items-center justify-center text-[var(--status-danger)] mb-3">
        <AlertCircle className="h-5 w-5" />
      </div>
      <h3 className="font-heading text-base font-semibold">Unable to Load</h3>
      <p className="text-sm text-[var(--text-secondary)] mt-1">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </Button>
      )}
    </Card>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      <div>
        <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
