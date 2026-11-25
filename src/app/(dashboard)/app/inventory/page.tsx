"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Boxes, Package, Plus, Search } from "lucide-react";
import { FinancialAmount } from "@/components/common/FinancialAmount";
import { EmptyState, LoadingSkeleton, PageHeader } from "@/components/common/StatusStates";
import { Badge, Button, Card, Input, Select } from "@/components/ui/primitives";
import { formatPKR } from "@/lib/money";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";

export default function InventoryPage() {
  const router = useRouter();
  const activeBookId = useUIStore((s) => s.activeBookId);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", activeBookId],
    queryFn: () => services.inventory.listProducts(activeBookId),
  });

  if (isLoading) return <LoadingSkeleton />;

  const categories = Array.from(new Set(products.map((p) => p.category)));
  const totalValue = products.reduce((s, p) => s + p.quantity * p.purchaseCost, 0);
  const lowStockCount = products.filter(
    (p) => p.quantity > 0 && p.quantity <= p.lowStockThreshold
  ).length;
  const outOfStockCount = products.filter((p) => p.quantity === 0).length;

  const filtered = products.filter((p) => {
    if (category !== "all" && p.category !== category) return false;
    if (
      search &&
      !p.name.toLowerCase().includes(search.toLowerCase()) &&
      !p.sku.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Inventory (Stock)"
        subtitle="Apne maal ka stock, arrival, aur value dekhein. (Weighted-average demo costing)"
        actions={
          <>
            <Link href="/app/inventory/movements">
              <Button variant="outline" size="sm">
                Movements
              </Button>
            </Link>
            <Link href="/app/inventory/adjustments">
              <Button variant="outline" size="sm">
                Adjustments
              </Button>
            </Link>
            <Link href="/app/inventory/categories">
              <Button variant="outline" size="sm">
                Categories
              </Button>
            </Link>
            <Link href="/app/inventory/new">
              <Button size="sm">
                <Plus className="h-4 w-4" /> Add Item
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[var(--status-success-bg)] text-[var(--status-success)] flex items-center justify-center">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Total Items</p>
            <p className="text-xl font-bold tabular-nums">{products.length}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] flex items-center justify-center">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Total Stock Value</p>
            <FinancialAmount amount={totalValue} className="text-lg" />
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[var(--status-warning-bg)] text-[var(--status-warning)] flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Low Stock</p>
            <p className="text-xl font-bold tabular-nums">{lowStockCount} Items</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[var(--status-danger-bg)] text-[var(--status-danger)] flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Out of Stock</p>
            <p className="text-xl font-bold tabular-nums">{outOfStockCount} Items</p>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Item search karein (name or SKU)..."
            className="pl-9"
          />
        </div>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="sm:w-48"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No Inventory Items"
          description="Add yarn, fabric, or packaging items to track stock."
          actionLabel="Add Item"
          onAction={() => router.push("/app/inventory/new")}
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--bg-subtle)]/50 text-left text-xs text-[var(--text-secondary)]">
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-end">Stock</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4 text-end">Cost / Unit</th>
                <th className="py-3 px-4 text-end">Value (PKR)</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const status =
                  p.quantity === 0
                    ? { label: "Out of Stock", tone: "danger" as const }
                    : p.quantity <= p.lowStockThreshold
                    ? { label: "Low Stock", tone: "warning" as const }
                    : { label: "In Stock", tone: "success" as const };
                return (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/app/inventory/${p.id}`)}
                    className="border-b border-[var(--border-default)]/70 hover:bg-[var(--bg-subtle)] cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-[11px] text-[var(--text-secondary)]">{p.sku}</p>
                    </td>
                    <td className="py-3 px-4 text-[var(--text-secondary)]">{p.category}</td>
                    <td className="py-3 px-4 text-end font-semibold tabular-nums">
                      {p.quantity.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">{p.unit}</td>
                    <td className="py-3 px-4 text-end tabular-nums">
                      {formatPKR(p.purchaseCost)}
                    </td>
                    <td className="py-3 px-4 text-end font-bold tabular-nums">
                      {formatPKR(p.quantity * p.purchaseCost)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
