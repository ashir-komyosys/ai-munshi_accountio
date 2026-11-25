"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { FinancialAmount } from "@/components/common/FinancialAmount";
import { EmptyState, LoadingSkeleton, PageHeader } from "@/components/common/StatusStates";
import { Badge, Button, Card, Input, Select } from "@/components/ui/primitives";
import { useDictionary } from "@/hooks/useDictionary";
import { formatPKR } from "@/lib/money";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";
import type { PartyType } from "@/types";

export default function KhatasPage() {
  const router = useRouter();
  const { t } = useDictionary();
  const activeBookId = useUIStore((s) => s.activeBookId);

  const [tab, setTab] = useState<PartyType>("customer");
  const [search, setSearch] = useState("");
  const [balanceFilter, setBalanceFilter] = useState<"all" | "lena" | "dena" | "settled">("all");
  const [sortBy, setSortBy] = useState<"name" | "balance">("balance");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: parties = [], isLoading } = useQuery({
    queryKey: ["parties", activeBookId],
    queryFn: () => services.khatas.listParties(activeBookId),
  });

  if (isLoading) return <LoadingSkeleton />;

  const totalLena = parties
    .filter((p) => p.currentBalance > 0)
    .reduce((s, p) => s + p.currentBalance, 0);
  const totalDena = parties
    .filter((p) => p.currentBalance < 0)
    .reduce((s, p) => s + Math.abs(p.currentBalance), 0);

  const filtered = parties
    .filter((p) => p.type === tab)
    .filter((p) => {
      if (balanceFilter === "lena" && p.currentBalance <= 0) return false;
      if (balanceFilter === "dena" && p.currentBalance >= 0) return false;
      if (balanceFilter === "settled" && p.currentBalance !== 0) return false;
      if (
        search &&
        !p.name.toLowerCase().includes(search.toLowerCase()) &&
        !p.phone.includes(search)
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) =>
      sortBy === "name"
        ? a.name.localeCompare(b.name)
        : Math.abs(b.currentBalance) - Math.abs(a.currentBalance)
    );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.khata.title}
        subtitle={t.khata.subtitle}
        actions={
          <Link href="/app/khatas/new">
            <Button size="sm">
              <Plus className="h-4 w-4" /> {t.actions.newKhata}
            </Button>
          </Link>
        }
      />

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Total {t.khata.lenaHai} (Receivable)</p>
            <p className="text-xl font-bold text-[var(--status-success)] mt-1">
              <FinancialAmount amount={totalLena} />
            </p>
          </div>
          <Badge tone="success">Receivable</Badge>
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Total {t.khata.denaHai} (Payable)</p>
            <p className="text-xl font-bold text-[var(--status-danger)] mt-1">
              <FinancialAmount amount={totalDena} />
            </p>
          </div>
          <Badge tone="danger">Payable</Badge>
        </Card>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { key: "customer", label: t.khata.customers },
            { key: "supplier", label: t.khata.suppliers },
            { key: "other", label: t.khata.others },
          ] as const
        ).map((item) => (
          <Button
            key={item.key}
            size="sm"
            variant={tab === item.key ? "primary" : "outline"}
            onClick={() => {
              setTab(item.key);
              setPage(1);
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t.khata.searchPlaceholder}
            className="pl-9"
          />
        </div>
        <Select
          value={balanceFilter}
          onChange={(e) => setBalanceFilter(e.target.value as typeof balanceFilter)}
          className="sm:w-44"
        >
          <option value="all">All Balances</option>
          <option value="lena">Lena Hai (Receivable)</option>
          <option value="dena">Dena Hai (Payable)</option>
          <option value="settled">Hisaab Barabar</option>
        </Select>
        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="sm:w-40"
        >
          <option value="balance">Sort: Balance</option>
          <option value="name">Sort: Name</option>
        </Select>
      </div>

      {paginated.length === 0 ? (
        <EmptyState
          title="No Khatas Found"
          description="Try clearing your search or create a new customer/supplier khata."
          actionLabel="Create Naya Khata"
          onAction={() => router.push("/app/khatas/new")}
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--bg-subtle)]/50 text-xs text-[var(--text-secondary)] text-left">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Lena / Dena</th>
                <th className="py-3 px-4 text-end">Balance</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((p) => {
                const status =
                  p.currentBalance > 0
                    ? { label: t.khata.lenaHai, tone: "success" as const }
                    : p.currentBalance < 0
                    ? { label: t.khata.denaHai, tone: "danger" as const }
                    : { label: t.khata.settled, tone: "neutral" as const };
                return (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/app/khatas/${p.id}`)}
                    className="border-b border-[var(--border-default)]/70 hover:bg-[var(--bg-subtle)] cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[var(--text-primary)]">{p.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{p.phone}</p>
                    </td>
                    <td className="py-3 px-4 capitalize text-xs text-[var(--text-secondary)]">
                      {p.type}
                    </td>
                    <td className="py-3 px-4">
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </td>
                    <td className="py-3 px-4 text-end font-bold tabular-nums">
                      {formatPKR(Math.abs(p.currentBalance))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-default)] text-xs">
              <span className="text-[var(--text-secondary)]">
                Page {page} of {totalPages} ({filtered.length} parties)
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((x) => x - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage((x) => x + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
