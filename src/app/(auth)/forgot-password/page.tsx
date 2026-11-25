"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AccountioLogo } from "@/components/common/BrandAssets";
import { Button, Card, Input } from "@/components/ui/primitives";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] p-4">
      <Card className="w-full max-w-md p-6 sm:p-8 space-y-5">
        <AccountioLogo />
        <div>
          <h1 className="font-heading text-xl font-bold">Reset Password (Demo)</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            In demo mode, password recovery is simulated locally.
          </p>
        </div>
        {sent ? (
          <div className="p-4 rounded-xl bg-[var(--status-success-bg)] text-[var(--status-success)] text-xs">
            Simulated reset instructions sent to <strong>{email}</strong>. You can sign in using
            the Instant Demo Login button.
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
              toast.success("Simulated reset link sent");
            }}
            className="space-y-3"
          >
            <Input
              type="email"
              required
              placeholder="owner@almadinayarn.pk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" className="w-full">
              Send Reset Instructions
            </Button>
          </form>
        )}
        <Link href="/login" className="block text-center text-xs text-[var(--brand-primary)] hover:underline">
          ← Back to Login
        </Link>
      </Card>
    </div>
  );
}
