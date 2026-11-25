"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AccountioLogo } from "@/components/common/BrandAssets";
import { Button, Card, Input } from "@/components/ui/primitives";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";

export default function OnboardingCreateBookPage() {
  const router = useRouter();
  const { completeOnboarding, setActiveBookId } = useUIStore();
  const [bookName, setBookName] = useState("New Business Khata 2026");
  const [openingCash, setOpeningCash] = useState("100000");
  const [openingBank, setOpeningBank] = useState("250000");

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    const book = await services.books.createBook({
      name: bookName,
      businessType: "Trading",
      openingCash: Number(openingCash) || 0,
      openingBank: Number(openingBank) || 0,
    });
    setActiveBookId(book.id);
    completeOnboarding();
    toast.success("Setup complete! Welcome to AI Munshi.");
    router.push("/app/overview");
  };

  const handleUseDefault = () => {
    setActiveBookId("book_al_madina");
    completeOnboarding();
    router.push("/app/overview");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] p-4">
      <Card className="w-full max-w-lg p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <AccountioLogo />
          <span className="text-xs font-medium text-[var(--text-secondary)]">Step 4 of 4</span>
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold">Create Accounting Book</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Create a fresh book or jump right into the seeded Al Madina Yarn Traders demo book.
          </p>
        </div>

        <form onSubmit={handleFinish} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium mb-1">Book Name</label>
            <Input value={bookName} onChange={(e) => setBookName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Opening Cash (PKR)</label>
              <Input
                type="number"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Opening Bank (PKR)</label>
              <Input
                type="number"
                value={openingBank}
                onChange={(e) => setOpeningBank(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg">
            <CheckCircle2 className="h-4 w-4" /> Create Book & Finish
          </Button>
        </form>

        <div className="flex items-center justify-between gap-3 pt-1">
          <Link href="/onboarding/business">
            <Button variant="ghost" size="sm">
              ← Back
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleUseDefault}>
            Use Seeded Al Madina Demo Book →
          </Button>
        </div>
      </Card>
    </div>
  );
}
