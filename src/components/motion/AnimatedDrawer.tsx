"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { drawerSpring } from "@/lib/motion/transitions";
import { modalOverlayVariants } from "@/lib/motion/variants";
import { cn } from "@/lib/utils";

export function AnimatedDrawer({
  open,
  onClose,
  side = "end",
  isRtl = false,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  side?: "start" | "end";
  isRtl?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const slidesFromRight =
    (side === "end" && !isRtl) || (side === "start" && isRtl);
  const initialX = slidesFromRight ? "100%" : "-100%";

  return (
    <AnimatePresence>
      {open && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex",
            side === "end" ? "justify-end" : "justify-start"
          )}
        >
          <motion.div
            variants={reduced ? undefined : modalOverlayVariants}
            initial={reduced ? undefined : "initial"}
            animate={reduced ? undefined : "animate"}
            exit={reduced ? undefined : "exit"}
            className="fixed inset-0 bg-black/35"
            onClick={onClose}
          />
          <motion.div
            initial={reduced ? undefined : { x: initialX }}
            animate={reduced ? undefined : { x: 0 }}
            exit={reduced ? undefined : { x: initialX }}
            transition={reduced ? { duration: 0 } : drawerSpring}
            className={cn("relative z-10 h-full flex flex-col", className)}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
