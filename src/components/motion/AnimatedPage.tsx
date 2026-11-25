"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { pageVariants } from "@/lib/motion/variants";
import { cn } from "@/lib/utils";

export function AnimatedPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className={cn("min-w-0", className)}
    >
      {children}
    </motion.div>
  );
}
