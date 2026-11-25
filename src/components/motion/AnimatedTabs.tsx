"use client";

import React, { useState } from "react";
import { LayoutGroup } from "motion/react";
import { cn } from "@/lib/utils";
import { SlidingIndicator } from "./SlidingIndicator";

export interface TabOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  badge?: React.ReactNode;
}

export function AnimatedTabs<T extends string = string>({
  items,
  value,
  onChange,
  layoutId,
  variant = "pill",
  className,
  itemClassName,
}: {
  items: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  layoutId: string;
  variant?: "pill" | "segmented";
  className?: string;
  itemClassName?: string;
}) {
  const [hovered, setHovered] = useState<T | null>(null);

  return (
    <LayoutGroup id={layoutId}>
      <div
        role="tablist"
        onMouseLeave={() => setHovered(null)}
        className={cn(
          "inline-flex flex-wrap items-center gap-1",
          variant === "segmented" &&
            "p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-default)]",
          className
        )}
      >
        {items.map((item) => {
          const isActive = item.value === value;
          const isHovered = item.value === hovered && !isActive;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(item.value)}
              onMouseEnter={() => setHovered(item.value)}
              onFocus={() => setHovered(item.value)}
              onBlur={() => setHovered(null)}
              className={cn(
                "relative px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap select-none",
                isActive
                  ? "text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                variant === "segmented" && !isActive && "rounded-lg",
                itemClassName
              )}
            >
              {isHovered && (
                <SlidingIndicator
                  layoutId={`${layoutId}-hover`}
                  className={cn(
                    "bg-[var(--brand-cream)] border border-[var(--border-default)]/60",
                    variant === "segmented" && "rounded-lg"
                  )}
                />
              )}
              {isActive && (
                <SlidingIndicator
                  layoutId={`${layoutId}-active`}
                  className={cn(
                    "bg-[var(--brand-primary)] shadow-xs",
                    variant === "segmented" && "rounded-lg"
                  )}
                />
              )}
              <span className="relative z-10 inline-flex items-center gap-1.5">
                {item.label}
                {item.badge}
              </span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
