"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";

const BAR_HEIGHTS = [0.4, 0.85, 0.55, 1, 0.65, 0.9, 0.45, 0.75];

export function RecordingWaveform() {
  const reduced = useReducedMotion();

  return (
    <span className="inline-flex items-center gap-0.5 h-4" aria-hidden="true">
      {BAR_HEIGHTS.map((peak, i) => (
        <motion.span
          key={i}
          className="w-0.5 rounded-full bg-[var(--status-danger)]"
          style={{ height: "100%", originY: 0.5 }}
          animate={
            reduced
              ? { scaleY: peak }
              : { scaleY: [0.3, peak, 0.35] }
          }
          transition={
            reduced
              ? undefined
              : {
                  duration: 0.55,
                  repeat: Infinity,
                  repeatType: "mirror",
                  delay: i * 0.06,
                  ease: "easeInOut",
                }
          }
        />
      ))}
    </span>
  );
}
