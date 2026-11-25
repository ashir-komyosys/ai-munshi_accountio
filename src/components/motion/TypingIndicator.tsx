"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { AiMunshiMascot } from "@/components/common/BrandAssets";

export function TypingIndicator({ label = "AI Munshi likh raha hai..." }: { label?: string }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? undefined : { opacity: 0, y: 6 }}
      animate={reduced ? undefined : { opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: 4 }}
      transition={{ duration: 0.16 }}
      className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"
    >
      <AiMunshiMascot size={24} className="shrink-0" />
      <div className="px-3 py-1.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] inline-flex items-center gap-2 shadow-[var(--shadow-xs)]">
        <span className="inline-flex gap-1" aria-hidden="true">
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              className="h-1.5 w-1.5 rounded-full bg-[var(--brand-primary)]"
              animate={
                reduced
                  ? undefined
                  : { y: [0, -3, 0], opacity: [0.5, 1, 0.5] }
              }
              transition={
                reduced
                  ? undefined
                  : {
                      duration: 0.7,
                      repeat: Infinity,
                      delay: dot * 0.14,
                      ease: "easeInOut",
                    }
              }
            />
          ))}
        </span>
        <span>{label}</span>
      </div>
    </motion.div>
  );
}
