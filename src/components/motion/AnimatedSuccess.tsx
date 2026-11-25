"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { MOTION_DURATIONS, MOTION_EASINGS } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

export function AnimatedSuccess({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? undefined : { scale: 0.85, opacity: 0 }}
      animate={reduced ? undefined : { scale: 1, opacity: 1 }}
      transition={{ duration: MOTION_DURATIONS.base, ease: MOTION_EASINGS.standard }}
      style={{ width: size, height: size }}
      className={cn(
        "rounded-full bg-[var(--status-success-bg)] text-[var(--status-success)] flex items-center justify-center shrink-0",
        className
      )}
    >
      <svg
        width={Math.round(size * 0.52)}
        height={Math.round(size * 0.52)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.path
          d="M5 13l4 4L19 7"
          initial={reduced ? undefined : { pathLength: 0 }}
          animate={reduced ? undefined : { pathLength: 1 }}
          transition={{ duration: 0.28, delay: 0.08, ease: MOTION_EASINGS.standard }}
        />
      </svg>
    </motion.div>
  );
}
