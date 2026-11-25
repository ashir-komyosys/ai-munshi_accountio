"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AccountioLogo } from "@/components/common/BrandAssets";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import { useUIStore } from "@/stores/uiStore";

export default function RegisterPage() {
  const router = useRouter();
  const loginDemo = useUIStore((s) => s.loginDemo);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    loginDemo({
      userName: name || "Demo Shopkeeper",
      userPhone: `+92 ${phone}`,
      userEmail: email || "demo@accountio.ai",
      onboardingCompleted: false,
    });
    toast.success("Demo account created! Let's set up your business.");
    router.push("/onboarding");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] p-4">
      <Card className="w-full max-w-md p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <AccountioLogo />
          <Badge tone="brand">Demo Registration</Badge>
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold">Create Accountio AI Account</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Simulated registration for demo mode — no external credentials needed.
          </p>
        </div>
        <form onSubmit={handleRegister} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium mb-1">Full Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Muhammad Bilal"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Mobile Number (+92)</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="300 1234567"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Email (Optional)</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="bilal@business.pk"
            />
          </div>
          <Button type="submit" className="w-full" size="lg">
            Continue to Onboarding
          </Button>
        </form>
        <p className="text-center text-xs text-[var(--text-secondary)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--brand-primary)] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
