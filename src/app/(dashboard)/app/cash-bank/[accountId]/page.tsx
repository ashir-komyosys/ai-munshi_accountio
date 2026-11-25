"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FinancialAmount } from "@/components/common/FinancialAmount";
import { LoadingSkeleton, PageHeader } from "@/components/common/StatusStates";
import { Badge, Card } from "@/components/ui/primitives";
import { formatPKR } from "@/lib/money";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";

export default function AccountDetailPage() {
  const { accountId } = useParams<{ accountId: string }>();
  const activeBookId = useUIStore((s) => s.activeBookId);

  const { data: account, isLoading } = useQuery({
    queryKey: ["account", accountId],
    queryFn: () => services.cashBank.getAccount(accountId),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", activeBookId],
    queryFn: () => services.transactions.listTransactions(activeBookId),
  });

  if (isLoading) return <LoadingSkeleton />;
  if (!account) return <Card className="p-6">Account not found.</Card>;

  const accountTxs = transactions.filter(
    (t) => t.accountId === account.id || t.toAccountId === account.id
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title={account.name}
        subtitle={`${account.type.toUpperCase()} ${account.accountNumber ? `• ${account.accountNumber}` : ""}`}
      />
      <Card className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-[var(--text-secondary)]">Current Balance</p>
          <FinancialAmount amount={account.currentBalance} className="text-2xl" />
        </div>
        <Badge tone="brand">{account.type}</Badge>
      </Card>
      <Card className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)] text-left text-xs text-[var(--text-secondary)]">
              <th className="py-2.5 px-4">Date</th>
              <th className="py-2.5 px-4">Serial</th>
              <th className="py-2.5 px-4">Particulars</th>
              <th className="py-2.5 px-4 text-end">Amount</th>
            </tr>
          </thead>
          <tbody>
            {accountTxs.map((t) => (
              <tr key={t.id} className="border-b border-[var(--border-default)]/60">
                <td className="py-2.5 px-4">{t.date}</td>
                <td className="py-2.5 px-4 font-mono text-xs">{t.serial}</td>
                <td className="py-2.5 px-4">{t.particulars}</td>
                <td className="py-2.5 px-4 text-end font-semibold tabular-nums">
                  {formatPKR(t.paidAmount || t.totalAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
