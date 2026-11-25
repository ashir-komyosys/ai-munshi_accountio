"use client";

import React from "react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { formatPKR } from "@/lib/money";
import { cn } from "@/lib/utils";

export function FinancialAmount({
  amount,
  compact = false,
  sign = false,
  colored = false,
  animate = false,
  className,
}: {
  amount: number;
  compact?: boolean;
  sign?: boolean;
  colored?: boolean;
  animate?: boolean;
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
      {animate ? (
        <AnimatedNumber
          value={amount}
          formatter={(n) => formatPKR(n, { compact, sign })}
        />
      ) : (
        formatPKR(amount, { compact, sign })
      )}
    </span>
  );
}
