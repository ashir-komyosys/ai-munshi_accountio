"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AccountioLogo } from "@/components/common/BrandAssets";
import { Badge, Button, Card } from "@/components/ui/primitives";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";

function OtpInner() {
  const router = useRouter();
  const params = useSearchParams();
  const identifier = params.get("id") ?? "+92 300 8664123";
  const loginDemo = useUIStore((s) => s.loginDemo);

  const [digits, setDigits] = useState(["1", "2", "3", "4", "5", "6"]);
  const [countdown, setCountdown] = useState(30);
  const [error, setError] = useState("");
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (idx: number, val: string) => {
    const clean = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = clean;
    setDigits(next);
    setError("");
    if (clean && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      inputsRef.current[5]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join("");
    try {
      const { user } = await services.auth.verifyOtp(identifier, code);
      loginDemo({ userName: user.name, userPhone: user.phone, userEmail: user.email });
      toast.success("OTP verified! Welcome to Accountio AI.");
      router.push("/app/overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid OTP");
    }
  };

  return (
    <Card className="w-full max-w-md p-6 sm:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <AccountioLogo />
        <Badge tone="brand">Demo OTP: 123456</Badge>
      </div>
      <div>
        <h1 className="font-heading text-xl font-bold">Verify OTP</h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Enter the 6-digit simulated code for <span className="font-semibold">{identifier}</span>
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-4">
        <div className="flex justify-between gap-2" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              aria-label={`OTP digit ${i + 1}`}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !digits[i] && i > 0) {
                  inputsRef.current[i - 1]?.focus();
                }
              }}
              maxLength={1}
              inputMode="numeric"
              className="h-12 w-12 text-center text-lg font-bold rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)] focus:border-[var(--brand-primary)] focus:outline-none"
            />
          ))}
        </div>

        {error && <p className="text-xs text-[var(--status-danger)] font-medium">{error}</p>}

        <Button type="submit" className="w-full" size="lg">
          Verify & Continue
        </Button>
      </form>

      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <Link href="/login" className="text-[var(--brand-primary)] hover:underline">
          Change number
        </Link>
        {countdown > 0 ? (
          <span>Resend in {countdown}s</span>
        ) : (
          <button
            type="button"
            onClick={() => {
              setCountdown(30);
              toast.success("Demo OTP resent: 123456");
            }}
            className="text-[var(--brand-primary)] font-medium cursor-pointer"
          >
            Resend OTP
          </button>
        )}
      </div>
    </Card>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] p-4">
      <Suspense fallback={<div className="text-sm">Loading...</div>}>
        <OtpInner />
      </Suspense>
    </div>
  );
}
