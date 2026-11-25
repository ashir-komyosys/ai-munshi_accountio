"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/StatusStates";
import { Button, Card, Input, Select } from "@/components/ui/primitives";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";

export default function InventoryAdjustmentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const activeBookId = useUIStore((s) => s.activeBookId);

  const { data: products = [] } = useQuery({
    queryKey: ["products", activeBookId],
    queryFn: () => services.inventory.listProducts(activeBookId),
  });

  const [productId, setProductId] = useState("");
  const [newQty, setNewQty] = useState("");
  const [reason, setReason] = useState("Physical godown stock count adjustment");

  const mutation = useMutation({
    mutationFn: () => {
      const target = products.find((p) => p.id === (productId || products[0]?.id));
      if (!target) throw new Error("Select a product");
      return services.inventory.recordStockMovement({
        bookId: activeBookId,
        productId: target.id,
        type: "adjustment",
        quantity: Number(newQty),
        unitCost: target.purchaseCost,
        reason,
        date: new Date().toISOString().slice(0, 10),
      });
    },
    onSuccess: () => {
      toast.success("Stock count adjusted");
      queryClient.invalidateQueries();
      router.push("/app/inventory");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="max-w-xl space-y-4">
      <PageHeader title="Stock Adjustments" subtitle="Reconcile physical godown counts." />
      <Card className="p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium mb-1">Product</label>
            <Select
              value={productId || products[0]?.id || ""}
              onChange={(e) => setProductId(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Current: {p.quantity} {p.unit})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">New Physical Quantity</label>
            <Input
              type="number"
              min="0"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Reason</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            Apply Adjustment
          </Button>
        </form>
      </Card>
    </div>
  );
}
