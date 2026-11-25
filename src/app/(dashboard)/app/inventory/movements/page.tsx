"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/StatusStates";
import { Badge, Card } from "@/components/ui/primitives";
import { formatPKR } from "@/lib/money";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";

export default function InventoryMovementsPage() {
  const activeBookId = useUIStore((s) => s.activeBookId);
  const { data: movements = [] } = useQuery({
    queryKey: ["movements", activeBookId],
    queryFn: () => services.inventory.listMovements(activeBookId),
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Stock Movements" subtitle="Complete arrival and dispatch history." />
      <Card className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)] text-left text-xs text-[var(--text-secondary)]">
              <th className="py-2.5 px-4">Date</th>
              <th className="py-2.5 px-4">Product</th>
              <th className="py-2.5 px-4">Type</th>
              <th className="py-2.5 px-4 text-end">Qty</th>
              <th className="py-2.5 px-4 text-end">Unit Cost</th>
              <th className="py-2.5 px-4">Reason</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id} className="border-b border-[var(--border-default)]/60">
                <td className="py-2.5 px-4">{m.date}</td>
                <td className="py-2.5 px-4 font-semibold">{m.productName}</td>
                <td className="py-2.5 px-4">
                  <Badge tone={m.type === "in" ? "success" : "warning"}>{m.type}</Badge>
                </td>
                <td className="py-2.5 px-4 text-end tabular-nums">{m.quantity}</td>
                <td className="py-2.5 px-4 text-end tabular-nums">{formatPKR(m.unitCost)}</td>
                <td className="py-2.5 px-4 text-[var(--text-secondary)]">{m.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
