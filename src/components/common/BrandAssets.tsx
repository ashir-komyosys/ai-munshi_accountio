"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * TEMPORARY PLACEHOLDER ASSET:
 * Replace the SVG mark below with the official Accountio AI brand SVG/PNG
 * in `public/brand/accountio-logo.svg` when official assets are supplied.
 */
export function AccountioLogo({
  collapsed = false,
  className,
}: {
  collapsed?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      <svg
        width="34"
        height="34"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect x="3" y="18" width="7" height="14" rx="2.5" fill="#F59E0B" />
        <rect x="13" y="11" width="7" height="21" rx="2.5" fill="#EA5003" />
        <rect x="23" y="4" width="7" height="28" rx="2.5" fill="#EA5003" />
      </svg>
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <div className="flex items-baseline gap-1">
            <span className="font-heading text-[17px] font-bold tracking-tight text-[var(--text-primary)]">
              Accountio
            </span>
            <span
              className="text-[15px] font-bold tracking-wider text-[var(--brand-primary)]"
              style={{ fontFamily: "var(--font-orbitron), sans-serif" }}
            >
              AI
            </span>
          </div>
          <span className="mt-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
            AI Munshi
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * TEMPORARY PLACEHOLDER ASSET:
 * Replace with the official AI Munshi mascot artwork (`public/mascot/ai-munshi.png`)
 * when supplied. Do not redesign the mascot identity.
 */
export function AiMunshiMascot({
  size = 56,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AI Munshi Mascot"
      className={cn("shrink-0", className)}
    >
      {/* Antenna */}
      <line x1="40" y1="6" x2="40" y2="15" stroke="#EA5003" strokeWidth="3" strokeLinecap="round" />
      <circle cx="40" cy="6" r="3.5" fill="#EA5003" />
      {/* Head */}
      <rect x="14" y="15" width="52" height="38" rx="16" fill="#FFFFFF" stroke="#E9E5E1" strokeWidth="2.5" />
      {/* Visor */}
      <rect x="20" y="23" width="40" height="22" rx="10" fill="#171717" />
      {/* Eyes */}
      <circle cx="32" cy="34" r="4" fill="#FDBA74" />
      <circle cx="48" cy="34" r="4" fill="#FDBA74" />
      {/* Smile */}
      <path d="M35 40C37.5 42 42.5 42 45 40" stroke="#EA5003" strokeWidth="2" strokeLinecap="round" />
      {/* Ear pieces */}
      <rect x="9" y="27" width="5" height="14" rx="2.5" fill="#EA5003" />
      <rect x="66" y="27" width="5" height="14" rx="2.5" fill="#EA5003" />
      {/* Body */}
      <rect x="23" y="55" width="34" height="19" rx="9" fill="#FFFFFF" stroke="#E9E5E1" strokeWidth="2.5" />
      {/* Orange Chest Emblem */}
      <rect x="33" y="60" width="14" height="9" rx="3" fill="#FFF1E8" />
      <path d="M36 66V63M40 66V62M44 66V61" stroke="#EA5003" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
