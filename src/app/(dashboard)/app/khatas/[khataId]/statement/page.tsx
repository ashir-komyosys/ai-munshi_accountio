"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { PageHeader } from "@/components/common/StatusStates";
import { Button, Card } from "@/components/ui/primitives";
import { formatPKR } from "@/lib/money";
import { services } from "@/services";

export default function KhataStatementPage() {
  const { khataId } = useParams<{ khataId: string }>();
  const { data: party } = useQuery({
    queryKey: ["party", khataId],
    queryFn: () => services.khatas.getParty(khataId),
  });
  const { data: transactions = [] } = useQuery({
    queryKey: ["party-tx", khataId],
    queryFn: () => services.khatas.getPartyTransactions(khataId),
  });

  if (!party) return null;

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Account Statement — ${party.name}`}
        subtitle="Demo Statement • Generated from local ledger"
        actions={
          <Button size="sm" onClick={() => window.print()} className="no-print">
            <Printer className="h-4 w-4" /> Print Statement
          </Button>
        }
      />
      <Card className="p-6 space-y-4">
        <div className="flex justify-between border-b border-[var(--border-default)] pb-4">
          <div>
            <p className="font-heading font-bold text-lg">Al Madina Yarn Traders</p>
            <p className="text-xs text-[var(--text-secondary)]">Chiniot Bazar, Faisalabad</p>
          </div>
          <div className="text-end">
            <p className="text-xs text-[var(--text-secondary)]">Current Balance</p>
            <p className="font-bold text-lg tabular-nums">
              {formatPKR(Math.abs(party.currentBalance))}
            </p>
          </div>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border-default)] text-left text-[var(--text-secondary)]">
              <th className="py-2">Date</th>
              <th className="py-2">Serial</th>
              <th className="py-2">Description</th>
              <th className="py-2 text-end">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b border-[var(--border-default)]/50">
                <td className="py-2">{t.date}</td>
                <td className="py-2 font-mono">{t.serial}</td>
                <td className="py-2">{t.particulars}</td>
                <td className="py-2 text-end tabular-nums">{formatPKR(t.totalAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
