"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Loader2 } from "lucide-react";
import { MOTION_DISTANCES, MOTION_DURATIONS } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

export interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  success?: boolean;
}

export function AnimatedButton({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  loading = false,
  success = false,
  disabled,
  children,
  ...props
}: AnimatedButtonProps) {
  const reduced = useReducedMotion();
  const isDisabled = disabled || loading;

  const variants = {
    primary:
      "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] shadow-xs",
    secondary:
      "bg-[var(--bg-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] border border-[var(--border-default)]",
    outline:
      "bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-subtle)]",
    ghost:
      "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]",
    danger: "bg-[var(--status-danger)] text-white hover:opacity-90",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
    md: "h-9.5 px-4 text-sm rounded-xl gap-2",
    lg: "h-11 px-5 text-sm rounded-xl gap-2",
    icon: "h-9 w-9 rounded-xl justify-center",
  };

  const baseClass = cn(
    "inline-flex items-center justify-center font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]",
    variants[variant],
    sizes[size],
    className
  );

  const content = (
    <>
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />}
      {!loading && success && <Check className="h-3.5 w-3.5 shrink-0" />}
      {children}
    </>
  );

  if (reduced || isDisabled) {
    return (
      <button type={type} disabled={isDisabled} className={baseClass} {...props}>
        {content}
      </button>
    );
  }

  return (
    <motion.button
      type={type}
      whileTap={{ scale: MOTION_DISTANCES.pressScale }}
      transition={{ duration: MOTION_DURATIONS.instant }}
      className={baseClass}
      {...(props as Record<string, unknown>)}
    >
      {content}
    </motion.button>
  );
}
