"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Printer, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { FinancialAmount } from "@/components/common/FinancialAmount";
import { LoadingSkeleton, PageHeader } from "@/components/common/StatusStates";
import { Badge, Button, Card } from "@/components/ui/primitives";
import { formatPKR } from "@/lib/money";
import { services } from "@/services";

export default function TransactionDetailPage() {
  const { transactionId } = useParams<{ transactionId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["transaction", transactionId],
    queryFn: () => services.transactions.getTransaction(transactionId),
  });

  const reverseMutation = useMutation({
    mutationFn: () => services.transactions.reverseTransaction(transactionId, "User reversal"),
    onSuccess: (rev) => {
      toast.success(`Reversed with audit entry ${rev.serial}`);
      queryClient.invalidateQueries();
      router.push(`/app/transactions/${rev.id}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return <LoadingSkeleton />;
  if (!data) return <Card className="p-6">Transaction not found.</Card>;

  const { transaction: tx, lineItems, journalEntries } = data;

  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader
        title={`Entry ${tx.serial}`}
        subtitle={`${tx.date} • ${tx.type.replace(/_/g, " ")} • Source: ${tx.source}`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="no-print">
              <Printer className="h-4 w-4" /> Print Voucher
            </Button>
            {tx.status === "posted" && !tx.reversesId && (
              <Button
                variant="danger"
                size="sm"
                disabled={reverseMutation.isPending}
                onClick={() => reverseMutation.mutate()}
                className="no-print"
              >
                <RotateCcw className="h-4 w-4" /> Reverse Entry
              </Button>
            )}
          </>
        }
      />

      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-default)]">
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Particulars</p>
            <p className="font-semibold text-base">{tx.particulars}</p>
          </div>
          <Badge tone={tx.status === "reversed" ? "danger" : "success"}>{tx.status}</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <p className="text-[var(--text-secondary)]">Party</p>
            <p className="font-semibold mt-0.5">{tx.partyName ?? "Cash / General"}</p>
          </div>
          <div>
            <p className="text-[var(--text-secondary)]">Total Amount</p>
            <FinancialAmount amount={tx.totalAmount} className="text-sm" />
          </div>
          <div>
            <p className="text-[var(--text-secondary)]">Paid Amount</p>
            <FinancialAmount amount={tx.paidAmount} className="text-sm text-[var(--status-success)]" />
          </div>
          <div>
            <p className="text-[var(--text-secondary)]">Outstanding (Udhaar)</p>
            <FinancialAmount amount={tx.outstandingAmount} className="text-sm text-[var(--brand-primary)]" />
          </div>
        </div>

        {lineItems.length > 0 && (
          <div>
            <h3 className="text-xs font-bold mb-2">Line Items</h3>
            <table className="w-full text-xs border border-[var(--border-default)] rounded-xl">
              <thead>
                <tr className="bg-[var(--bg-subtle)] text-left">
                  <th className="py-2 px-3">Item</th>
                  <th className="py-2 px-3">Qty</th>
                  <th className="py-2 px-3">Rate</th>
                  <th className="py-2 px-3 text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((li) => (
                  <tr key={li.id} className="border-t border-[var(--border-default)]">
                    <td className="py-2 px-3">{li.productName}</td>
                    <td className="py-2 px-3">
                      {li.quantity} {li.unit}
                    </td>
                    <td className="py-2 px-3 tabular-nums">{formatPKR(li.rate)}</td>
                    <td className="py-2 px-3 text-end font-semibold tabular-nums">
                      {formatPKR(li.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div>
          <h3 className="text-xs font-bold mb-2">Balanced Double-Entry Journal</h3>
          <table className="w-full text-xs border border-[var(--border-default)]">
            <thead>
              <tr className="bg-[var(--bg-subtle)] text-left">
                <th className="py-2 px-3">Account</th>
                <th className="py-2 px-3 text-end">Debit (PKR)</th>
                <th className="py-2 px-3 text-end">Credit (PKR)</th>
              </tr>
            </thead>
            <tbody>
              {journalEntries.map((je) => (
                <tr key={je.id} className="border-t border-[var(--border-default)]">
                  <td className="py-2 px-3">
                    {je.accountCode} — {je.accountName}
                  </td>
                  <td className="py-2 px-3 text-end tabular-nums">
                    {je.debit > 0 ? formatPKR(je.debit) : "-"}
                  </td>
                  <td className="py-2 px-3 text-end tabular-nums">
                    {je.credit > 0 ? formatPKR(je.credit) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
