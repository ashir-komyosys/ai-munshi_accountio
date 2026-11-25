"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/StatusStates";
import { Card } from "@/components/ui/primitives";
import { formatPKR } from "@/lib/money";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";

export default function InventoryCategoriesPage() {
  const activeBookId = useUIStore((s) => s.activeBookId);
  const { data: products = [] } = useQuery({
    queryKey: ["products", activeBookId],
    queryFn: () => services.inventory.listProducts(activeBookId),
  });

  const grouped = new Map<string, { count: number; value: number }>();
  products.forEach((p) => {
    const cur = grouped.get(p.category) ?? { count: 0, value: 0 };
    cur.count += 1;
    cur.value += p.quantity * p.purchaseCost;
    grouped.set(p.category, cur);
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Inventory Categories" subtitle="Stock breakdown by product category." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from(grouped.entries()).map(([cat, stats]) => (
          <Card key={cat} className="p-4">
            <p className="font-heading font-bold text-base">{cat}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{stats.count} items</p>
            <p className="text-sm font-bold mt-2 tabular-nums text-[var(--brand-primary)]">
              {formatPKR(stats.value)}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
