"use client";

import React, { useEffect, useRef, useState } from "react";
import { animate, useMotionValue, useReducedMotion } from "motion/react";
import { MOTION_DURATIONS, MOTION_EASINGS } from "@/lib/motion/tokens";

export function AnimatedNumber({
  value,
  formatter,
  className,
}: {
  value: number;
  formatter?: (n: number) => string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const motionValue = useMotionValue(value);
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (reduced || prevValueRef.current === value) {
      prevValueRef.current = value;
      return;
    }

    const controls = animate(motionValue, value, {
      duration: MOTION_DURATIONS.number,
      ease: MOTION_EASINGS.standard,
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
      onComplete: () => setDisplayValue(value),
    });

    prevValueRef.current = value;
    return () => controls.stop();
  }, [value, reduced, motionValue]);

  const activeValue = reduced ? value : displayValue;
  const text = formatter ? formatter(activeValue) : String(activeValue);
  return <span className={className}>{text}</span>;
}
