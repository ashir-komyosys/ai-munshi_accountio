"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { EmptyState, LoadingSkeleton, PageHeader } from "@/components/common/StatusStates";
import { QuickEntryModal } from "@/components/transactions/QuickEntryModal";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import { formatPKR } from "@/lib/money";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";
import type { TransactionType } from "@/types";

export type TxFilterGroup =
  | "all"
  | "sales"
  | "purchases"
  | "receipts"
  | "payments"
  | "expenses"
  | "transfers"
  | "returns"
  | "journals";

export function TransactionsView({
  initialGroup = "all",
  title = "Transactions (Roznamcha)",
  subtitle = "Sabhi entries ka roznamcha (journal) yahan dekhein.",
}: {
  initialGroup?: TxFilterGroup;
  title?: string;
  subtitle?: string;
}) {
  const router = useRouter();
  const activeBookId = useUIStore((s) => s.activeBookId);
  const [group, setGroup] = useState<TxFilterGroup>(initialGroup);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [quickOpen, setQuickOpen] = useState(false);
  const pageSize = 12;

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions", activeBookId],
    queryFn: () => services.transactions.listTransactions(activeBookId),
  });

  if (isLoading) return <LoadingSkeleton />;

  const matchesGroup = (type: TransactionType) => {
    if (group === "all") return true;
    if (group === "sales") return type === "cash_sale" || type === "credit_sale" || type === "partial_sale";
    if (group === "purchases")
      return type === "cash_purchase" || type === "credit_purchase" || type === "partial_purchase";
    if (group === "receipts") return type === "customer_receipt";
    if (group === "payments") return type === "supplier_payment";
    if (group === "expenses") return type === "expense" || type === "salary_payment";
    if (group === "transfers") return type === "cash_transfer" || type === "bank_transfer";
    if (group === "returns") return type === "sales_return" || type === "purchase_return";
    if (group === "journals") return type === "journal";
    return true;
  };

  const filtered = transactions.filter((tx) => {
    if (!matchesGroup(tx.type)) return false;
    if (dateFrom && tx.date < dateFrom) return false;
    if (dateTo && tx.date > dateTo) return false;
    if (
      search &&
      !tx.particulars.toLowerCase().includes(search.toLowerCase()) &&
      !tx.serial.toLowerCase().includes(search.toLowerCase()) &&
      !(tx.partyName ?? "").toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-4">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <Button size="sm" onClick={() => setQuickOpen(true)}>
              <Plus className="h-4 w-4" /> Quick Entry
            </Button>
            <Link href="/app/transactions/new">
              <Button size="sm" variant="outline">
                Multi-Item Entry
              </Button>
            </Link>
          </>
        }
      />

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            { key: "all", label: "All" },
            { key: "sales", label: "Sales" },
            { key: "purchases", label: "Purchase" },
            { key: "receipts", label: "Receive" },
            { key: "payments", label: "Pay" },
            { key: "expenses", label: "Expense" },
            { key: "transfers", label: "Transfers" },
            { key: "returns", label: "Returns" },
            { key: "journals", label: "Journals" },
          ] as const
        ).map((tab) => (
          <Button
            key={tab.key}
            size="sm"
            variant={group === tab.key ? "primary" : "outline"}
            onClick={() => {
              setGroup(tab.key);
              setPage(1);
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Search & Date Range */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
        <div className="relative sm:col-span-2">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Entry search karein (serial, party, description)..."
            className="pl-9"
          />
        </div>
        <Input
          type="date"
          aria-label="Filter from date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <Input
          type="date"
          aria-label="Filter to date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
      </div>

      {paginated.length === 0 ? (
        <EmptyState
          title="No Transactions Found"
          description="No entries match your active filters."
          actionLabel="Create New Entry"
          onAction={() => setQuickOpen(true)}
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--bg-subtle)]/50 text-left text-xs text-[var(--text-secondary)]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Serial</th>
                <th className="py-3 px-4">Particulars</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-end">Amount (PKR)</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((tx) => {
                const isCredit = tx.type.includes("sale") || tx.type === "customer_receipt";
                const isDebit = tx.type.includes("purchase") || tx.type === "expense" || tx.type === "supplier_payment";
                return (
                  <tr
                    key={tx.id}
                    onClick={() => router.push(`/app/transactions/${tx.id}`)}
                    className="border-b border-[var(--border-default)]/70 hover:bg-[var(--bg-subtle)] cursor-pointer"
                  >
                    <td className="py-3 px-4 whitespace-nowrap text-[var(--text-secondary)]">
                      {tx.date}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{tx.serial}</td>
                    <td className="py-3 px-4 font-medium">{tx.particulars}</td>
                    <td className="py-3 px-4">
                      <Badge tone="neutral">{tx.type.replace(/_/g, " ")}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge tone={tx.status === "reversed" ? "danger" : "success"}>
                        {tx.status}
                      </Badge>
                    </td>
                    <td
                      className={`py-3 px-4 text-end font-bold tabular-nums ${
                        isCredit
                          ? "text-[var(--status-success)]"
                          : isDebit
                          ? "text-[var(--status-danger)]"
                          : ""
                      }`}
                    >
                      {formatPKR(tx.totalAmount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-default)] text-xs">
              <span className="text-[var(--text-secondary)]">
                Page {page} of {totalPages} ({filtered.length} entries)
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      <QuickEntryModal open={quickOpen} onOpenChange={setQuickOpen} />
    </div>
  );
}
