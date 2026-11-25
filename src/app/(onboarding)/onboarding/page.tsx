"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Globe } from "lucide-react";
import { AccountioLogo, AiMunshiMascot } from "@/components/common/BrandAssets";
import { Button, Card } from "@/components/ui/primitives";
import { useUIStore } from "@/stores/uiStore";

export default function OnboardingWelcomePage() {
  const { locale, setLocale } = useUIStore();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] p-4">
      <Card className="w-full max-w-lg p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <AccountioLogo />
          <span className="text-xs font-medium text-[var(--text-secondary)]">Step 1 of 4</span>
        </div>

        <div className="rounded-2xl bg-[var(--brand-cream)] border border-[var(--border-default)] p-5 flex items-center gap-4">
          <AiMunshiMascot size={64} />
          <div>
            <h1 className="font-heading text-xl font-bold">Welcome to AI Munshi</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Assalamualaikum! Let’s set up your conversational accounting workspace in 4 quick
              steps.
            </p>
          </div>
        </div>

        <div className="space-y-2.5 text-sm">
          <p className="font-medium text-xs text-[var(--text-secondary)]">
            Select your preferred language:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={`p-3 rounded-xl border text-left cursor-pointer ${
                locale === "en"
                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)]"
                  : "border-[var(--border-default)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">English</span>
                {locale === "en" && <CheckCircle2 className="h-4 w-4 text-[var(--brand-primary)]" />}
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                English + Roman Urdu chat
              </p>
            </button>
            <button
              type="button"
              onClick={() => setLocale("ur")}
              className={`p-3 rounded-xl border text-left cursor-pointer ${
                locale === "ur"
                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)]"
                  : "border-[var(--border-default)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" /> اردو (RTL)
                </span>
                {locale === "ur" && <CheckCircle2 className="h-4 w-4 text-[var(--brand-primary)]" />}
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                مکمل اردو انٹرفیس
              </p>
            </button>
          </div>
        </div>

        <Link href="/onboarding/connect-whatsapp" className="block">
          <Button className="w-full" size="lg">
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </Card>
    </div>
  );
}
