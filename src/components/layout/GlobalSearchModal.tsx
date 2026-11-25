"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  FileText,
  Layers,
  Package,
  Search,
  Users,
  BarChart3,
} from "lucide-react";
import { Modal, Input } from "@/components/ui/primitives";
import { useUIStore } from "@/stores/uiStore";
import { services } from "@/services";
import { formatPKR } from "@/lib/money";

const STATIC_PAGES = [
  { label: "Overview (Home)", href: "/app/overview", category: "Page" },
  { label: "AI Munshi Chat", href: "/app/munshi", category: "Page" },
  { label: "My Books", href: "/app/books", category: "Page" },
  { label: "Khatas (Ledgers)", href: "/app/khatas", category: "Page" },
  { label: "Transactions (Roznamcha)", href: "/app/transactions", category: "Page" },
  { label: "Inventory (Stock)", href: "/app/inventory", category: "Page" },
  { label: "Cash & Bank", href: "/app/cash-bank", category: "Page" },
  { label: "Loans, Capital & Salaries", href: "/app/cash-bank/loans", category: "Page" },
  { label: "Profit & Loss Report", href: "/app/reports/profit-loss", category: "Report" },
  { label: "Balance Sheet", href: "/app/reports/balance-sheet", category: "Report" },
  { label: "Trial Balance", href: "/app/reports/trial-balance", category: "Report" },
  { label: "Documents", href: "/app/documents", category: "Page" },
  { label: "Settings", href: "/app/settings", category: "Page" },
  { label: "Subscription & Billing", href: "/app/settings/subscription", category: "Page" },
];

export function GlobalSearchModal() {
  const router = useRouter();
  const open = useUIStore((s) => s.globalSearchOpen);
  const setOpen = useUIStore((s) => s.setGlobalSearchOpen);
  const activeBookId = useUIStore((s) => s.activeBookId);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const { data: parties = [] } = useQuery({
    queryKey: ["parties", activeBookId],
    queryFn: () => services.khatas.listParties(activeBookId),
    enabled: open,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", activeBookId],
    queryFn: () => services.transactions.listTransactions(activeBookId),
    enabled: open,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products", activeBookId],
    queryFn: () => services.inventory.listProducts(activeBookId),
    enabled: open,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["documents", activeBookId],
    queryFn: () => services.documents.listDocuments(activeBookId),
    enabled: open,
  });

  const q = query.trim().toLowerCase();
  const matchedParties = parties
    .filter((p) => !q || p.name.toLowerCase().includes(q) || p.phone.includes(q))
    .slice(0, 4);
  const matchedTx = transactions
    .filter(
      (t) =>
        !q ||
        t.particulars.toLowerCase().includes(q) ||
        t.serial.toLowerCase().includes(q) ||
        (t.partyName ?? "").toLowerCase().includes(q)
    )
    .slice(0, 4);
  const matchedProducts = products
    .filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
    .slice(0, 4);
  const matchedDocs = documents
    .filter((d) => !q || d.title.toLowerCase().includes(q))
    .slice(0, 3);
  const matchedPages = STATIC_PAGES.filter((p) => !q || p.label.toLowerCase().includes(q)).slice(
    0,
    5
  );

  const navigate = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title="Global Search"
      description="Search khatas, roznamcha entries, inventory, documents, and pages"
      maxWidth="max-w-xl"
    >
      <div className="relative mb-4">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to search (e.g. Ali Traders, NOV-000427, Cotton Yarn)..."
          className="pl-9"
        />
      </div>

      <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
        {matchedParties.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Khatas
            </p>
            <div className="space-y-1">
              {matchedParties.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/app/khatas/${p.id}`)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[var(--bg-subtle)] text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="h-4 w-4 text-[var(--brand-primary)]" />
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-[var(--text-secondary)] capitalize">{p.type}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold tabular-nums">
                    {formatPKR(Math.abs(p.currentBalance))}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {matchedTx.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Transactions
            </p>
            <div className="space-y-1">
              {matchedTx.map((t) => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/app/transactions/${t.id}`)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[var(--bg-subtle)] text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Layers className="h-4 w-4 text-[var(--text-secondary)] shrink-0" />
                    <div className="truncate">
                      <p className="text-sm font-medium truncate">{t.particulars}</p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {t.serial} • {t.date}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold tabular-nums shrink-0 ml-2">
                    {formatPKR(t.totalAmount)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {matchedProducts.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Inventory
            </p>
            <div className="space-y-1">
              {matchedProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/app/inventory/${p.id}`)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[var(--bg-subtle)] text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="h-4 w-4 text-[var(--status-warning)]" />
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{p.sku}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium">
                    {p.quantity} {p.unit}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {matchedDocs.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Documents
            </p>
            <div className="space-y-1">
              {matchedDocs.map((d) => (
                <button
                  key={d.id}
                  onClick={() => navigate(`/app/documents/${d.id}`)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--bg-subtle)] text-left cursor-pointer"
                >
                  <FileText className="h-4 w-4 text-[var(--status-info)]" />
                  <span className="text-sm font-medium">{d.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {matchedPages.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Pages & Reports
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {matchedPages.map((p) => (
                <button
                  key={p.href}
                  onClick={() => navigate(p.href)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[var(--bg-subtle)] text-left text-sm cursor-pointer"
                >
                  {p.category === "Report" ? (
                    <BarChart3 className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                  ) : (
                    <BookOpen className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                  )}
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
