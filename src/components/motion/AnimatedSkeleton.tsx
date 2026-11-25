"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function AnimatedSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-xl bg-[var(--bg-subtle)] relative overflow-hidden",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.4s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/35 dark:before:via-white/10 before:to-transparent",
        className
      )}
    />
  );
}
