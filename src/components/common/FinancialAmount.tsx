"use client";

import React from "react";
import { formatPKR } from "@/lib/money";
import { cn } from "@/lib/utils";

export function FinancialAmount({
  amount,
  compact = false,
  sign = false,
  colored = false,
  className,
}: {
  amount: number;
  compact?: boolean;
  sign?: boolean;
  colored?: boolean;
  className?: string;
}) {
  const colorClass = colored
    ? amount > 0
      ? "text-[var(--status-success)]"
      : amount < 0
      ? "text-[var(--status-danger)]"
      : "text-[var(--text-secondary)]"
    : "";

  return (
    <span className={cn("tabular-nums bidi-isolate font-semibold", colorClass, className)}>
      {formatPKR(amount, { compact, sign })}
    </span>
  );
}
