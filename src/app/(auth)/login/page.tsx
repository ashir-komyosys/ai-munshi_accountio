"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, Mail, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AccountioLogo, AiMunshiMascot } from "@/components/common/BrandAssets";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { AnimatedPage } from "@/components/motion/AnimatedPage";
import { AnimatedTabs } from "@/components/motion/AnimatedTabs";
import { Badge, Button, Input } from "@/components/ui/primitives";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";

export default function LoginPage() {
  const router = useRouter();
  const loginDemo = useUIStore((s) => s.loginDemo);
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [identifier, setIdentifier] = useState("3008664123");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formatted = mode === "phone" ? `+92 ${identifier.trim()}` : identifier.trim();
      await services.auth.loginWithIdentifier(formatted);
      toast.success("Simulated OTP sent! Use demo code: 123456");
      router.push(`/verify-otp?id=${encodeURIComponent(formatted)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemo = () => {
    loginDemo();
    toast.success("Signed in to Al Madina Yarn Traders (Demo Mode)");
    router.push("/app/overview");
  };

  return (
    <AnimatedPage className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] p-4">
      <AnimatedCard interactive={false} className="w-full max-w-md p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <AccountioLogo />
          <Badge tone="brand">Simulated Auth</Badge>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl bg-[var(--brand-cream)] border border-[var(--border-default)] p-4">
          <AiMunshiMascot size={52} />
          <div>
            <h1 className="font-heading text-lg font-bold">Assalamualaikum!</h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Accounting as a conversation. Sign in to manage your business hisaab.
            </p>
          </div>
        </div>

        <AnimatedTabs
          layoutId="login-mode-tabs"
          variant="segmented"
          className="w-full grid grid-cols-2"
          itemClassName="justify-center py-1.5"
          value={mode}
          onChange={(next) => {
            setMode(next);
            setIdentifier(next === "phone" ? "3008664123" : "owner@almadinayarn.pk");
          }}
          items={[
            {
              value: "phone",
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> Phone (+92)
                </span>
              ),
            },
            {
              value: "email",
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Email
                </span>
              ),
            },
          ]}
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5">
              {mode === "phone" ? "Pakistani Mobile Number" : "Email Address"}
            </label>
            <div className="flex gap-2">
              {mode === "phone" && (
                <div className="h-9.5 px-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] flex items-center text-sm font-medium shrink-0">
                  🇵🇰 +92
                </div>
              )}
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={mode === "phone" ? "300 8664123" : "owner@almadinayarn.pk"}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Sending OTP..." : "Continue"} <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[var(--border-default)]" />
          <span className="shrink mx-3 text-[11px] text-[var(--text-muted)]">OR</span>
          <div className="flex-grow border-t border-[var(--border-default)]" />
        </div>

        <Button
          variant="outline"
          className="w-full border-[var(--brand-primary)]/40 text-[var(--brand-primary)] hover:bg-[var(--brand-cream)]"
          size="lg"
          onClick={handleInstantDemo}
        >
          <Sparkles className="h-4 w-4" /> Instant Demo Login (Al Madina Yarn)
        </Button>

        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] pt-1">
          <Link href="/register" className="hover:text-[var(--brand-primary)] font-medium">
            Create new account
          </Link>
          <Link href="/forgot-password" className="hover:text-[var(--brand-primary)]">
            Forgot password?
          </Link>
        </div>
      </AnimatedCard>
    </AnimatedPage>
  );
}
