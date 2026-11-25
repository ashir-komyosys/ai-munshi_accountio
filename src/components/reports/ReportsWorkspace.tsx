"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, FileText, Printer, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { LoadingSkeleton, PageHeader } from "@/components/common/StatusStates";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import { downloadCSV, downloadExcel, downloadPDF } from "@/lib/exportReports";
import { addMoney, formatPKR, subMoney } from "@/lib/money";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";

export type ReportKey =
  | "profit-loss"
  | "balance-sheet"
  | "cash-flow"
  | "trial-balance"
  | "general-ledger"
  | "day-book"
  | "sales"
  | "purchases"
  | "expenses"
  | "receivables"
  | "payables"
  | "inventory"
  | "aging";

const FINANCIAL_REPORTS: Array<{ key: ReportKey; label: string }> = [
  { key: "profit-loss", label: "Profit & Loss" },
  { key: "balance-sheet", label: "Balance Sheet" },
  { key: "cash-flow", label: "Cash Flow" },
  { key: "trial-balance", label: "Trial Balance" },
  { key: "general-ledger", label: "General Ledger" },
  { key: "day-book", label: "Day Book" },
];

const BUSINESS_REPORTS: Array<{ key: ReportKey; label: string }> = [
  { key: "sales", label: "Sales Report" },
  { key: "purchases", label: "Purchase Report" },
  { key: "expenses", label: "Expense Report" },
  { key: "inventory", label: "Inventory Report" },
  { key: "receivables", label: "Receivables (Lena Hai)" },
  { key: "payables", label: "Payables (Dena Hai)" },
  { key: "aging", label: "Aging Report" },
];

export function ReportsWorkspace({ activeKey = "profit-loss" }: { activeKey?: ReportKey }) {
  const activeBookId = useUIStore((s) => s.activeBookId);
  const [dateFrom, setDateFrom] = useState("2026-09-01");
  const [dateTo, setDateTo] = useState("2026-11-30");
  const [search, setSearch] = useState("");

  const { data: summary, isLoading: sLoading } = useQuery({
    queryKey: ["summary", activeBookId, dateFrom, dateTo],
    queryFn: () =>
      services.reports.getFinancialSummary(activeBookId, { from: dateFrom, to: dateTo }),
  });

  const { data: trialBalance = [] } = useQuery({
    queryKey: ["trial-balance", activeBookId],
    queryFn: () => services.reports.getTrialBalance(activeBookId),
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

  if (sLoading || !summary) return <LoadingSkeleton />;

  const title =
    [...FINANCIAL_REPORTS, ...BUSINESS_REPORTS].find((r) => r.key === activeKey)?.label ??
    "Profit & Loss";

  // Build tabular export rows for the current report
  const buildExportData = (): { headers: string[]; rows: (string | number)[][] } => {
    if (activeKey === "profit-loss") {
      return {
        headers: ["Line Item", "Amount (PKR)"],
        rows: [
          ["Total Sales Revenue", summary.totalSales],
          ["Less: Cost of Goods Sold (COGS)", -summary.cogs],
          ["Gross Profit", subMoney(summary.totalSales, summary.cogs)],
          ["Less: Operating & Salary Expenses", -summary.totalExpenses],
          ["Net Profit (Munafa)", summary.netProfit],
        ],
      };
    }
    if (activeKey === "trial-balance") {
      return {
        headers: ["Code", "Account Name", "Debit (PKR)", "Credit (PKR)"],
        rows: trialBalance.map((r) => [r.accountCode, r.accountName, r.debit, r.credit]),
      };
    }
    if (activeKey === "inventory") {
      return {
        headers: ["SKU", "Item", "Category", "Stock", "Unit", "Cost", "Value (PKR)"],
        rows: products.map((p) => [
          p.sku,
          p.name,
          p.category,
          p.quantity,
          p.unit,
          p.purchaseCost,
          p.quantity * p.purchaseCost,
        ]),
      };
    }
    if (activeKey === "receivables" || activeKey === "payables" || activeKey === "aging") {
      const list = parties.filter((p) =>
        activeKey === "payables" ? p.currentBalance < 0 : p.currentBalance > 0
      );
      return {
        headers: ["Party", "Type", "Phone", "Balance (PKR)"],
        rows: list.map((p) => [p.name, p.type, p.phone, Math.abs(p.currentBalance)]),
      };
    }
    const filteredTx = transactions.filter((t) => {
      if (activeKey === "sales") return t.type.includes("sale");
      if (activeKey === "purchases") return t.type.includes("purchase");
      if (activeKey === "expenses") return t.type === "expense" || t.type === "salary_payment";
      return true;
    });
    return {
      headers: ["Date", "Serial", "Particulars", "Type", "Amount (PKR)"],
      rows: filteredTx.map((t) => [t.date, t.serial, t.particulars, t.type, t.totalAmount]),
    };
  };

  const handleExport = (fmt: "pdf" | "csv" | "xlsx") => {
    const { headers, rows } = buildExportData();
    const fname = `Accountio-${activeKey}-${dateTo}`;
    if (fmt === "pdf") {
      downloadPDF(fname, title, `${dateFrom} to ${dateTo}`, headers, rows);
    } else if (fmt === "csv") {
      downloadCSV(fname, headers, rows);
    } else {
      downloadExcel(fname, title, headers, rows);
    }
    toast.success(`Downloaded ${fmt.toUpperCase()} demo report`);
  };

  const totalAssets = addMoney(
    summary.cashBalance,
    summary.bankBalance,
    summary.totalReceivables,
    summary.inventoryValue,
    summary.assetsValue,
    summary.loansReceivable
  );
  const totalLiabilities = addMoney(summary.totalPayables, summary.loansPayable);
  const ownerEquity = subMoney(totalAssets, totalLiabilities);

  const tbDebit = trialBalance.reduce((s, r) => addMoney(s, r.debit), 0);
  const tbCredit = trialBalance.reduce((s, r) => addMoney(s, r.credit), 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reports"
        subtitle="Apne business ka mukammal hisaab (reports) hasil karein."
        actions={
          <div className="flex flex-wrap items-center gap-2 no-print">
            <Input
              type="date"
              aria-label="From"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-36 h-8.5 text-xs"
            />
            <Input
              type="date"
              aria-label="To"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-36 h-8.5 text-xs"
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Sub-Nav (Matches Screen 6) */}
        <Card className="p-3 space-y-4 h-fit no-print">
          <div>
            <p className="px-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Financial Reports
            </p>
            <div className="space-y-1">
              {FINANCIAL_REPORTS.map((r) => (
                <Link
                  key={r.key}
                  href={`/app/reports/${r.key}`}
                  className={`block px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    activeKey === r.key
                      ? "bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] font-semibold"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                  }`}
                >
                  {r.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="px-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Business Reports
            </p>
            <div className="space-y-1">
              {BUSINESS_REPORTS.map((r) => (
                <Link
                  key={r.key}
                  href={`/app/reports/${r.key}`}
                  className={`block px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    activeKey === r.key
                      ? "bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] font-semibold"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                  }`}
                >
                  {r.label}
                </Link>
              ))}
            </div>
          </div>
        </Card>

        {/* Right Report Statement Panel */}
        <Card className="p-5 lg:col-span-3 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-default)]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg font-bold">{title}</h2>
                <Badge tone="brand">Demo Report</Badge>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                {dateFrom} – {dateTo} • Al Madina Yarn Traders
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 no-print">
              <Button size="sm" variant="outline" onClick={() => handleExport("pdf")}>
                <Download className="h-3.5 w-3.5" /> PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleExport("xlsx")}>
                <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleExport("csv")}>
                <FileText className="h-3.5 w-3.5" /> CSV
              </Button>
              <Button size="sm" variant="secondary" onClick={() => window.print()}>
                <Printer className="h-3.5 w-3.5" /> Print
              </Button>
            </div>
          </div>

          {activeKey === "profit-loss" && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-[var(--border-default)]/60">
                <span>Total Sales Revenue</span>
                <span className="font-semibold tabular-nums">{formatPKR(summary.totalSales)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border-default)]/60">
                <span>Cost of Goods Sold (COGS)</span>
                <span className="font-semibold tabular-nums text-[var(--status-danger)]">
                  -{formatPKR(summary.cogs)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border-default)]/60">
                <span>Gross Profit</span>
                <span className="font-bold tabular-nums">
                  {formatPKR(subMoney(summary.totalSales, summary.cogs))}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border-default)]/60">
                <span>Total Operating & Salary Expenses</span>
                <span className="font-semibold tabular-nums text-[var(--status-danger)]">
                  -{formatPKR(summary.totalExpenses)}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[var(--status-success-bg)] flex items-center justify-between">
                <span className="font-bold flex items-center gap-2 text-[var(--status-success)]">
                  <TrendingUp className="h-4 w-4" /> Net Profit (Munafa)
                </span>
                <span className="text-lg font-bold tabular-nums text-[var(--status-success)]">
                  {formatPKR(summary.netProfit)}
                </span>
              </div>
            </div>
          )}

          {activeKey === "balance-sheet" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2 p-4 rounded-xl bg-[var(--bg-subtle)]/50 border border-[var(--border-default)]">
                <h3 className="font-bold text-xs uppercase text-[var(--text-secondary)]">Assets</h3>
                <div className="flex justify-between">
                  <span>Cash & Bank</span>
                  <span className="tabular-nums font-semibold">
                    {formatPKR(addMoney(summary.cashBalance, summary.bankBalance))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Accounts Receivable (Lena Hai)</span>
                  <span className="tabular-nums font-semibold">
                    {formatPKR(summary.totalReceivables)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Inventory Stock</span>
                  <span className="tabular-nums font-semibold">
                    {formatPKR(summary.inventoryValue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Fixed Assets & Loans Lent</span>
                  <span className="tabular-nums font-semibold">
                    {formatPKR(addMoney(summary.assetsValue, summary.loansReceivable))}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[var(--border-default)] font-bold">
                  <span>Total Assets</span>
                  <span className="tabular-nums">{formatPKR(totalAssets)}</span>
                </div>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-[var(--bg-subtle)]/50 border border-[var(--border-default)]">
                <h3 className="font-bold text-xs uppercase text-[var(--text-secondary)]">
                  Liabilities & Equity
                </h3>
                <div className="flex justify-between">
                  <span>Accounts Payable (Dena Hai)</span>
                  <span className="tabular-nums font-semibold">
                    {formatPKR(summary.totalPayables)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Loans Payable</span>
                  <span className="tabular-nums font-semibold">
                    {formatPKR(summary.loansPayable)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Owner Equity & Retained Earnings</span>
                  <span className="tabular-nums font-semibold">{formatPKR(ownerEquity)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[var(--border-default)] font-bold">
                  <span>Total Liabilities + Equity</span>
                  <span className="tabular-nums">
                    {formatPKR(addMoney(totalLiabilities, ownerEquity))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeKey === "trial-balance" && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-default)] text-left text-xs text-[var(--text-secondary)]">
                    <th className="py-2">Code</th>
                    <th className="py-2">Account</th>
                    <th className="py-2 text-end">Debit (PKR)</th>
                    <th className="py-2 text-end">Credit (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {trialBalance.map((row) => (
                    <tr key={row.accountCode} className="border-b border-[var(--border-default)]/60">
                      <td className="py-2 font-mono text-xs">{row.accountCode}</td>
                      <td className="py-2">{row.accountName}</td>
                      <td className="py-2 text-end tabular-nums">{formatPKR(row.debit)}</td>
                      <td className="py-2 text-end tabular-nums">{formatPKR(row.credit)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-[var(--bg-subtle)]">
                    <td className="py-2.5 px-2" colSpan={2}>
                      Total (Balanced)
                    </td>
                    <td className="py-2.5 text-end tabular-nums">{formatPKR(tbDebit)}</td>
                    <td className="py-2.5 text-end tabular-nums">{formatPKR(tbCredit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeKey !== "profit-loss" &&
            activeKey !== "balance-sheet" &&
            activeKey !== "trial-balance" && (
              <div className="space-y-3">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search inside report..."
                  className="max-w-xs no-print"
                />
                {(() => {
                  const { headers, rows } = buildExportData();
                  const filteredRows = rows.filter(
                    (r) =>
                      !search ||
                      r.some((c) => String(c).toLowerCase().includes(search.toLowerCase()))
                  );
                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[var(--border-default)] text-left text-[var(--text-secondary)]">
                            {headers.map((h) => (
                              <th key={h} className="py-2 px-2">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRows.slice(0, 50).map((r, i) => (
                            <tr key={i} className="border-b border-[var(--border-default)]/50">
                              {r.map((cell, j) => (
                                <td key={j} className="py-2 px-2 tabular-nums">
                                  {typeof cell === "number" && j === r.length - 1
                                    ? formatPKR(cell)
                                    : String(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}
        </Card>
      </div>
    </div>
  );
}
