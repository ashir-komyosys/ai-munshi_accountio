"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { AccountioLogo } from "@/components/common/BrandAssets";
import { Badge, Button, Card } from "@/components/ui/primitives";
import { useUIStore } from "@/stores/uiStore";

export default function OnboardingWhatsAppPage() {
  const { session, setWhatsappConnected } = useUIStore();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] p-4">
      <Card className="w-full max-w-lg p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <AccountioLogo />
          <span className="text-xs font-medium text-[var(--text-secondary)]">Step 2 of 4</span>
        </div>

        <div>
          <h1 className="font-heading text-xl font-bold">Connect WhatsApp (Simulated Demo)</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            In production, your WhatsApp AI Munshi syncs with your web books. Real WhatsApp sync is
            simulated in demo mode.
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[var(--status-success-bg)] text-[var(--status-success)] flex items-center justify-center">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">{session.userPhone}</p>
              <Badge tone={session.whatsappConnected ? "success" : "neutral"}>
                {session.whatsappConnected ? "Connected (Demo)" : "Not Linked"}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWhatsappConnected(!session.whatsappConnected)}
          >
            {session.whatsappConnected ? "Disconnect" : "Simulate Link"}
          </Button>
        </div>

        <div className="flex justify-between gap-3">
          <Link href="/onboarding" className="flex-1">
            <Button variant="outline" className="w-full">
              Back
            </Button>
          </Link>
          <Link href="/onboarding/business" className="flex-1">
            <Button className="w-full">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
