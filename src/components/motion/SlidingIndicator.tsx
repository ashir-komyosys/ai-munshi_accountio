"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { indicatorTransition } from "@/lib/motion/transitions";
import { cn } from "@/lib/utils";

export function SlidingIndicator({
  layoutId,
  className,
}: {
  layoutId: string;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <span
        aria-hidden="true"
        className={cn("absolute inset-0 rounded-xl pointer-events-none", className)}
      />
    );
  }

  return (
    <motion.span
      layoutId={layoutId}
      aria-hidden="true"
      transition={indicatorTransition}
      className={cn("absolute inset-0 rounded-xl pointer-events-none", className)}
    />
  );
}
