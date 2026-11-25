"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AccountioLogo } from "@/components/common/BrandAssets";
import { Button, Card, Input, Select } from "@/components/ui/primitives";
import { services } from "@/services";

export default function OnboardingBusinessPage() {
  const router = useRouter();
  const [name, setName] = useState("Al Madina Yarn Traders");
  const [type, setType] = useState("Yarn & Cloth Trading");
  const [address, setAddress] = useState("Chiniot Bazar, Faisalabad, Pakistan");

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    await services.settings.updateBusiness({ name, type, address });
    router.push("/onboarding/create-book");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] p-4">
      <Card className="w-full max-w-lg p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <AccountioLogo />
          <span className="text-xs font-medium text-[var(--text-secondary)]">Step 3 of 4</span>
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold">Business Information</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Tell AI Munshi about your dukaan or trading company.
          </p>
        </div>
        <form onSubmit={handleNext} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium mb-1">Business Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Business Type</label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="Yarn & Cloth Trading">Yarn & Cloth Trading</option>
              <option value="Wholesale & Distribution">Wholesale & Distribution</option>
              <option value="Retail Shop / Kiryana">Retail Shop / Kiryana</option>
              <option value="Manufacturing / Looms">Manufacturing / Looms</option>
              <option value="Services">Services</option>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Address / City</label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} required />
          </div>
          <div className="flex justify-between gap-3 pt-2">
            <Link href="/onboarding/connect-whatsapp" className="flex-1">
              <Button variant="outline" className="w-full">
                Back
              </Button>
            </Link>
            <Button type="submit" className="flex-1">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
