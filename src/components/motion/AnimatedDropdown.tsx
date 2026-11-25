"use client";

import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { dropdownVariants } from "@/lib/motion/variants";
import { cn } from "@/lib/utils";

export function AnimatedDropdown({
  open,
  children,
  className,
  align = "end",
}: {
  open: boolean;
  children: React.ReactNode;
  className?: string;
  align?: "start" | "end";
}) {
  const reduced = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={reduced ? undefined : dropdownVariants}
          initial={reduced ? undefined : "initial"}
          animate={reduced ? undefined : "animate"}
          exit={reduced ? undefined : "exit"}
          style={{
            transformOrigin: align === "end" ? "top right" : "top left",
          }}
          className={cn(className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
