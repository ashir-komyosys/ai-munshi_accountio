"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { MOTION_DISTANCES, MOTION_DURATIONS, MOTION_EASINGS } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

export function AnimatedCard({
  children,
  className,
  interactive = true,
  delay = 0,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  delay?: number;
  onClick?: () => void;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div
        onClick={onClick}
        className={cn(
          "rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-[var(--shadow-xs)]",
          className
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: MOTION_DISTANCES.cardY }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION_DURATIONS.base,
        delay: Math.min(delay, 0.28),
        ease: MOTION_EASINGS.standard,
      }}
      whileHover={
        interactive
          ? {
              y: MOTION_DISTANCES.hoverY,
              transition: { duration: MOTION_DURATIONS.fast, ease: MOTION_EASINGS.standard },
            }
          : undefined
      }
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-[var(--shadow-xs)] transition-shadow hover:shadow-[var(--shadow-sm)]",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
