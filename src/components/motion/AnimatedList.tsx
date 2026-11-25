"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { MOTION_DISTANCES, MOTION_DURATIONS, MOTION_EASINGS } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

export function AnimatedList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function AnimatedListItem({
  children,
  index = 0,
  className,
}: {
  children: React.ReactNode;
  index?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced || index >= 12) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: MOTION_DISTANCES.pageY }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION_DURATIONS.fast,
        delay: index * 0.03,
        ease: MOTION_EASINGS.standard,
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
