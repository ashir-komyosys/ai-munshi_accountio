"use client";

import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { modalContentVariants, modalOverlayVariants } from "@/lib/motion/variants";
import { cn } from "@/lib/utils";

export function AnimatedModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                variants={reduced ? undefined : modalOverlayVariants}
                initial={reduced ? undefined : "initial"}
                animate={reduced ? undefined : "animate"}
                exit={reduced ? undefined : "exit"}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px]"
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                variants={reduced ? undefined : modalContentVariants}
                initial={reduced ? undefined : "initial"}
                animate={reduced ? undefined : "animate"}
                exit={reduced ? undefined : "exit"}
                className={cn(
                  "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-md)] max-h-[90vh] overflow-y-auto focus:outline-none",
                  maxWidth
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <DialogPrimitive.Title className="font-heading text-lg font-semibold text-[var(--text-primary)]">
                      {title}
                    </DialogPrimitive.Title>
                    {description && (
                      <DialogPrimitive.Description className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {description}
                      </DialogPrimitive.Description>
                    )}
                  </div>
                  <DialogPrimitive.Close asChild>
                    <button
                      aria-label="Close dialog"
                      className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] cursor-pointer transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </DialogPrimitive.Close>
                </div>
                {children}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
