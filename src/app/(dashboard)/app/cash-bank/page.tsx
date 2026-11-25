"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, Building2, Plus, Smartphone, Wallet } from "lucide-react";
import { FinancialAmount } from "@/components/common/FinancialAmount";
import { LoadingSkeleton, PageHeader } from "@/components/common/StatusStates";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";

const FINANCE_TABS = [
  { href: "/app/cash-bank", label: "Accounts" },
  { href: "/app/cash-bank/transfers", label: "Transfers" },
  { href: "/app/cash-bank/loans", label: "Loans" },
  { href: "/app/cash-bank/capital", label: "Capital" },
  { href: "/app/cash-bank/assets", label: "Assets" },
  { href: "/app/cash-bank/liabilities", label: "Liabilities" },
  { href: "/app/cash-bank/salaries", label: "Salaries" },
];

export default function CashBankPage() {
  const activeBookId = useUIStore((s) => s.activeBookId);
  const [search, setSearch] = useState("");

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts", activeBookId],
    queryFn: () => services.cashBank.listAccounts(activeBookId),
  });

  if (isLoading) return <LoadingSkeleton />;

  const filtered = accounts.filter(
    (a) =>
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.type.toLowerCase().includes(search.toLowerCase())
  );

  const totalLiquidity = accounts.reduce((s, a) => s + a.currentBalance, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Cash, Bank & Finance"
        subtitle="Manage galla cash, bank accounts, JazzCash, Easypaisa, loans, capital, and salaries."
        actions={
          <>
            <Link href="/app/cash-bank/transfers">
              <Button variant="outline" size="sm">
                <ArrowLeftRight className="h-4 w-4" /> Transfer Funds
              </Button>
            </Link>
            <Link href="/app/cash-bank/new">
              <Button size="sm">
                <Plus className="h-4 w-4" /> Add Account
              </Button>
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        {FINANCE_TABS.map((tab) => (
          <Link key={tab.href} href={tab.href}>
            <Button
              size="sm"
              variant={tab.href === "/app/cash-bank" ? "primary" : "outline"}
            >
              {tab.label}
            </Button>
          </Link>
        ))}
      </div>

      <Card className="p-4 flex items-center justify-between bg-[var(--brand-cream)]">
        <div>
          <p className="text-xs text-[var(--text-secondary)]">Total Liquid Balance (Cash + Bank + Wallets)</p>
          <p className="text-2xl font-bold mt-1">
            <FinancialAmount amount={totalLiquidity} />
          </p>
        </div>
        <Badge tone="brand">Simulated Balances</Badge>
      </Card>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search accounts..."
        className="max-w-sm"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((acc) => {
          const Icon =
            acc.type === "cash"
              ? Wallet
              : acc.type === "bank"
              ? Building2
              : Smartphone;
          return (
            <Link key={acc.id} href={`/app/cash-bank/${acc.id}`}>
              <Card className="p-4 hover:border-[var(--brand-primary)] transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{acc.name}</p>
                    <p className="text-xs text-[var(--text-secondary)] capitalize">
                      {acc.type} {acc.accountNumber ? `• ${acc.accountNumber}` : ""}
                    </p>
                  </div>
                </div>
                <FinancialAmount amount={acc.currentBalance} className="text-base" />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
