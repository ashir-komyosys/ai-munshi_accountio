"use client";

import React from "react";
import { AnimatedModal } from "@/components/motion/AnimatedModal";
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
}) {
  const variants = {
    primary:
      "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] shadow-xs",
    secondary:
      "bg-[var(--bg-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] border border-[var(--border-default)]",
    outline:
      "bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-subtle)]",
    ghost: "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]",
    danger: "bg-[var(--status-danger)] text-white hover:opacity-90",
  };
  const sizes = {
    sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
    md: "h-9.5 px-4 text-sm rounded-xl gap-2",
    lg: "h-11 px-5 text-sm rounded-xl gap-2",
    icon: "h-9 w-9 rounded-xl justify-center",
  };
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-[var(--shadow-xs)]",
        className
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  tone = "neutral",
  children,
}: {
  className?: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "brand" | "info";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-default)]",
    success: "bg-[var(--status-success-bg)] text-[var(--status-success)] border-transparent",
    warning: "bg-[var(--status-warning-bg)] text-[var(--status-warning)] border-transparent",
    danger: "bg-[var(--status-danger-bg)] text-[var(--status-danger)] border-transparent",
    brand: "bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] border-transparent",
    info: "bg-[var(--status-info-bg)] text-[var(--status-info)] border-transparent",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9.5 w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-9.5 w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Modal({
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
  return (
    <AnimatedModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      maxWidth={maxWidth}
    >
      {children}
    </AnimatedModal>
  );
}
