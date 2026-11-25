"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { MOTION_DURATIONS, MOTION_EASINGS } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

export function AnimatedTableRow({
  children,
  index = 0,
  className,
  onClick,
}: {
  children: React.ReactNode;
  index?: number;
  className?: string;
  onClick?: () => void;
}) {
  const reduced = useReducedMotion();

  if (reduced || index >= 14) {
    return (
      <tr onClick={onClick} className={cn("transition-colors", className)}>
        {children}
      </tr>
    );
  }

  return (
    <motion.tr
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION_DURATIONS.fast,
        delay: Math.min(index * 0.025, 0.25),
        ease: MOTION_EASINGS.standard,
      }}
      onClick={onClick}
      className={cn("transition-colors", className)}
    >
      {children}
    </motion.tr>
  );
}
