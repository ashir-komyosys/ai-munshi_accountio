"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  PackagePlus,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  UserPlus,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AiMunshiMascot } from "@/components/common/BrandAssets";
import { FinancialAmount } from "@/components/common/FinancialAmount";
import { LoadingSkeleton } from "@/components/common/StatusStates";
import { QuickEntryModal } from "@/components/transactions/QuickEntryModal";
import { Badge, Card, Input } from "@/components/ui/primitives";
import { useDictionary } from "@/hooks/useDictionary";
import { formatPKR } from "@/lib/money";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";
import type { TransactionType } from "@/types";

export default function OverviewPage() {
  const router = useRouter();
  const { t } = useDictionary();
  const activeBookId = useUIStore((s) => s.activeBookId);
  const openMunshiDrawer = useUIStore((s) => s.openMunshiDrawer);

  const [showMoreMetrics, setShowMoreMetrics] = useState(false);
  const [dateFrom, setDateFrom] = useState("2026-09-01");
  const [dateTo, setDateTo] = useState("2026-11-30");
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickType, setQuickType] = useState<TransactionType>("cash_sale");

  const { data: book } = useQuery({
    queryKey: ["book", activeBookId],
    queryFn: () => services.books.getBook(activeBookId),
  });

  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ["summary", activeBookId, dateFrom, dateTo],
    queryFn: () =>
      services.reports.getFinancialSummary(activeBookId, { from: dateFrom, to: dateTo }),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", activeBookId],
    queryFn: () => services.transactions.listTransactions(activeBookId),
  });

  const { data: parties = [] } = useQuery({
    queryKey: ["parties", activeBookId],
    queryFn: () => services.khatas.listParties(activeBookId),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products", activeBookId],
    queryFn: () => services.inventory.listProducts(activeBookId),
  });

  if (sumLoading || !summary) {
    return <LoadingSkeleton />;
  }

  const openQuick = (type: TransactionType) => {
    setQuickType(type);
    setQuickOpen(true);
  };

  // Monthly trend chart data aggregated from transactions
  const monthlyMap = new Map<string, { month: string; sales: number; purchases: number; expenses: number }>();
  transactions
    .filter((tx) => tx.status === "posted")
    .forEach((tx) => {
      const m = tx.date.slice(0, 7);
      const row = monthlyMap.get(m) ?? { month: m, sales: 0, purchases: 0, expenses: 0 };
      if (tx.type.includes("sale")) row.sales += tx.totalAmount;
      else if (tx.type.includes("purchase")) row.purchases += tx.totalAmount;
      else if (tx.type === "expense") row.expenses += tx.totalAmount;
      monthlyMap.set(m, row);
    });
  const chartData = Array.from(monthlyMap.values()).sort((a, b) =>
    a.month.localeCompare(b.month)
  );

  const lowStockItems = products.filter((p) => p.quantity <= p.lowStockThreshold);
  const topOutstanding = parties
    .filter((p) => p.currentBalance !== 0)
    .sort((a, b) => Math.abs(b.currentBalance) - Math.abs(a.currentBalance))
    .slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Welcome Banner (Matches Approved Reference) */}
      <Card className="p-4 sm:p-5 bg-[var(--brand-cream)] border-[var(--border-default)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <AiMunshiMascot size={64} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                  {t.overview.greeting} 👋
                </h1>
                <Badge tone="brand">{book?.name ?? "Al Madina Yarn Traders"}</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                {t.overview.subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              aria-label="From date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-36 h-8.5 text-xs"
            />
            <span className="text-xs text-[var(--text-muted)]">to</span>
            <Input
              type="date"
              aria-label="To date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-36 h-8.5 text-xs"
            />
          </div>
        </div>

        {/* Primary 4 Financial Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-5">
          <Card className="p-4">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5 font-medium">
                <TrendingUp className="h-3.5 w-3.5 text-[var(--status-success)]" />
                {t.overview.totalSales}
              </span>
              <Badge tone="success">+12.4%</Badge>
            </div>
            <p className="text-xl sm:text-2xl font-bold mt-2">
              <FinancialAmount amount={summary.totalSales} />
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5 font-medium">
                <ShoppingCart className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                {t.overview.totalPurchases}
              </span>
              <Badge tone="success">+6.9%</Badge>
            </div>
            <p className="text-xl sm:text-2xl font-bold mt-2">
              <FinancialAmount amount={summary.totalPurchases} />
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5 font-medium">
                <Receipt className="h-3.5 w-3.5 text-[var(--status-danger)]" />
                {t.overview.totalExpenses}
              </span>
              <Badge tone="danger">-4.1%</Badge>
            </div>
            <p className="text-xl sm:text-2xl font-bold mt-2">
              <FinancialAmount amount={summary.totalExpenses} />
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5 font-medium">
                <Wallet className="h-3.5 w-3.5 text-[var(--status-info)]" />
                {t.overview.netProfit}
              </span>
              <Badge tone="success">+18.6%</Badge>
            </div>
            <p className="text-xl sm:text-2xl font-bold mt-2">
              <FinancialAmount amount={summary.netProfit} colored />
            </p>
          </Card>
        </div>

        {/* Expandable Additional Metrics */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowMoreMetrics((v) => !v)}
            className="text-xs font-medium text-[var(--brand-primary)] flex items-center gap-1 hover:underline cursor-pointer"
          >
            {showMoreMetrics ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {t.overview.moreMetrics} (Cash, Bank, Receivables, Payables)
          </button>

          {showMoreMetrics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-3">
              <Card className="p-3.5">
                <p className="text-xs text-[var(--text-secondary)]">{t.overview.cashBalance}</p>
                <p className="text-lg font-bold mt-1">
                  <FinancialAmount amount={summary.cashBalance} />
                </p>
              </Card>
              <Card className="p-3.5">
                <p className="text-xs text-[var(--text-secondary)]">{t.overview.bankBalance}</p>
                <p className="text-lg font-bold mt-1">
                  <FinancialAmount amount={summary.bankBalance} />
                </p>
              </Card>
              <Card className="p-3.5">
                <p className="text-xs text-[var(--text-secondary)]">{t.overview.receivables}</p>
                <p className="text-lg font-bold mt-1 text-[var(--status-success)]">
                  <FinancialAmount amount={summary.totalReceivables} />
                </p>
              </Card>
              <Card className="p-3.5">
                <p className="text-xs text-[var(--text-secondary)]">{t.overview.payables}</p>
                <p className="text-lg font-bold mt-1 text-[var(--status-danger)]">
                  <FinancialAmount amount={summary.totalPayables} />
                </p>
              </Card>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-4 sm:p-5">
        <h2 className="font-heading text-sm font-bold mb-3">{t.overview.quickActions}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {[
            {
              label: t.actions.sale,
              sub: t.actions.saleSub,
              icon: ShoppingBag,
              color: "text-[var(--brand-primary)]",
              onClick: () => openQuick("cash_sale"),
            },
            {
              label: t.actions.purchase,
              sub: t.actions.purchaseSub,
              icon: ShoppingCart,
              color: "text-[var(--brand-primary)]",
              onClick: () => openQuick("partial_purchase"),
            },
            {
              label: t.actions.receive,
              sub: t.actions.receiveSub,
              icon: ArrowDownLeft,
              color: "text-[var(--status-success)]",
              onClick: () => openQuick("customer_receipt"),
            },
            {
              label: t.actions.pay,
              sub: t.actions.paySub,
              icon: ArrowUpRight,
              color: "text-[var(--status-danger)]",
              onClick: () => openQuick("supplier_payment"),
            },
            {
              label: t.actions.expense,
              sub: t.actions.expenseSub,
              icon: Receipt,
              color: "text-[var(--status-warning)]",
              onClick: () => openQuick("expense"),
            },
            {
              label: t.actions.newKhata,
              sub: "(Party)",
              icon: UserPlus,
              color: "text-[var(--status-info)]",
              onClick: () => router.push("/app/khatas/new"),
            },
            {
              label: t.actions.addStock,
              sub: "(Inventory)",
              icon: PackagePlus,
              color: "text-[var(--brand-primary)]",
              onClick: () => router.push("/app/inventory/new"),
            },
            {
              label: t.actions.askMunshi,
              sub: "(AI Chat)",
              icon: MessageSquare,
              color: "text-[var(--brand-primary)]",
              onClick: () => openMunshiDrawer(),
            },
          ].map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.label}
                type="button"
                onClick={act.onClick}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)] hover:border-[var(--brand-primary)] hover:bg-[var(--brand-cream)] transition-colors text-center cursor-pointer"
              >
                <Icon className={`h-5 w-5 mb-1.5 ${act.color}`} />
                <span className="text-xs font-semibold">{act.label}</span>
                <span className="text-[10px] text-[var(--text-secondary)]">{act.sub}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Main Grid: Trends Chart + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 sm:p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-sm font-bold">{t.overview.businessTrends}</h2>
            <Link href="/app/reports" className="text-xs text-[var(--brand-primary)] hover:underline">
              Full Reports →
            </Link>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v) => formatPKR(Number(v ?? 0))} />
                <Bar dataKey="sales" name="Sales" fill="#16A34A" radius={[6, 6, 0, 0]} />
                <Bar dataKey="purchases" name="Purchases" fill="#EA5003" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#D97706" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Outstanding Khatas */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-sm font-bold">{t.overview.outstandingKhatas}</h2>
            <Link href="/app/khatas" className="text-xs text-[var(--brand-primary)] hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-2.5">
            {topOutstanding.map((p) => (
              <Link
                key={p.id}
                href={`/app/khatas/${p.id}`}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--bg-subtle)] border border-[var(--border-default)]"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{p.name}</p>
                  <p className="text-[11px] text-[var(--text-secondary)] capitalize">{p.type}</p>
                </div>
                <div className="text-end shrink-0">
                  <Badge tone={p.currentBalance > 0 ? "success" : "danger"}>
                    {p.currentBalance > 0 ? t.khata.lenaHai : t.khata.denaHai}
                  </Badge>
                  <p className="text-xs font-bold mt-0.5 tabular-nums">
                    {formatPKR(Math.abs(p.currentBalance))}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Grid: Recent Transactions + Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 sm:p-5 lg:col-span-2 overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-sm font-bold">{t.overview.recentTransactions}</h2>
            <Link
              href="/app/transactions"
              className="text-xs text-[var(--brand-primary)] hover:underline"
            >
              Roznamcha →
            </Link>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border-default)] text-[var(--text-secondary)] text-left">
                <th className="py-2 pe-2">Date</th>
                <th className="py-2 pe-2">Particulars</th>
                <th className="py-2 pe-2">Type</th>
                <th className="py-2 text-end">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 6).map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => router.push(`/app/transactions/${tx.id}`)}
                  className="border-b border-[var(--border-default)]/60 hover:bg-[var(--bg-subtle)] cursor-pointer"
                >
                  <td className="py-2.5 pe-2 whitespace-nowrap text-[var(--text-secondary)]">
                    {tx.date}
                  </td>
                  <td className="py-2.5 pe-2 font-medium">{tx.particulars}</td>
                  <td className="py-2.5 pe-2">
                    <Badge tone="neutral">{tx.type.replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="py-2.5 text-end font-semibold tabular-nums">
                    {formatPKR(tx.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-sm font-bold flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-[var(--status-warning)]" />
              {t.overview.lowStockAlerts}
            </h2>
            <Link
              href="/app/inventory"
              className="text-xs text-[var(--brand-primary)] hover:underline"
            >
              Inventory
            </Link>
          </div>
          {lowStockItems.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)] py-4">All stock levels healthy.</p>
          ) : (
            <div className="space-y-2">
              {lowStockItems.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href={`/app/inventory/${item.id}`}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--status-warning-bg)]/60 border border-[var(--border-default)]"
                >
                  <div>
                    <p className="text-xs font-semibold">{item.name}</p>
                    <p className="text-[10px] text-[var(--text-secondary)]">
                      Threshold: {item.lowStockThreshold} {item.unit}
                    </p>
                  </div>
                  <Badge tone={item.quantity === 0 ? "danger" : "warning"}>
                    {item.quantity} {item.unit}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <QuickEntryModal
        open={quickOpen}
        onOpenChange={setQuickOpen}
        defaultType={quickType}
      />
    </div>
  );
}
