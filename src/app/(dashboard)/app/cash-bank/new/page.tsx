"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/StatusStates";
import { Button, Card, Input, Select } from "@/components/ui/primitives";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";
import type { AccountType } from "@/types";

export default function NewCashBankAccountPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const activeBookId = useUIStore((s) => s.activeBookId);

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [openingBalance, setOpeningBalance] = useState("0");

  const mutation = useMutation({
    mutationFn: () =>
      services.cashBank.createAccount({
        bookId: activeBookId,
        name,
        type,
        bankName: bankName || undefined,
        accountNumber: accountNumber || undefined,
        openingBalance: Number(openingBalance) || 0,
      }),
    onSuccess: () => {
      toast.success("Account created");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      router.push("/app/cash-bank");
    },
  });

  return (
    <div className="max-w-xl space-y-4">
      <PageHeader title="Add Cash / Bank / Wallet Account" />
      <Card className="p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium mb-1">Account Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alfalah Business Current"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Account Type</label>
              <Select value={type} onChange={(e) => setType(e.target.value as AccountType)}>
                <option value="cash">Cash in Hand</option>
                <option value="bank">Bank Account</option>
                <option value="jazzcash">JazzCash</option>
                <option value="easypaisa">Easypaisa</option>
                <option value="wallet">Digital Wallet</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Opening Balance (PKR)</label>
              <Input
                type="number"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Bank / Provider Name</label>
              <Input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Account / Mobile #</label>
              <Input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              Save Account
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
