"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, ArrowDown, ArrowUp } from "lucide-react";
import { toast } from "sonner";
import { FinancialAmount } from "@/components/common/FinancialAmount";
import { LoadingSkeleton, PageHeader } from "@/components/common/StatusStates";
import { Badge, Button, Card, Input, Modal } from "@/components/ui/primitives";
import { formatPKR } from "@/lib/money";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";

export default function InventoryItemDetailPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const activeBookId = useUIStore((s) => s.activeBookId);

  const [moveType, setMoveType] = useState<"in" | "out" | null>(null);
  const [qty, setQty] = useState("25");
  const [cost, setCost] = useState("");
  const [reason, setReason] = useState("");

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", itemId],
    queryFn: () => services.inventory.getProduct(itemId),
  });

  const { data: movements = [] } = useQuery({
    queryKey: ["movements", activeBookId, itemId],
    queryFn: () => services.inventory.listMovements(activeBookId, itemId),
  });

  const moveMutation = useMutation({
    mutationFn: () => {
      if (!moveType || !product) throw new Error("Invalid state");
      return services.inventory.recordStockMovement({
        bookId: activeBookId,
        productId: product.id,
        type: moveType,
        quantity: Number(qty),
        unitCost: Number(cost || product.purchaseCost),
        reason: reason || (moveType === "in" ? "Manual Stock In" : "Manual Stock Out"),
        date: new Date().toISOString().slice(0, 10),
      });
    },
    onSuccess: () => {
      toast.success("Stock updated");
      queryClient.invalidateQueries();
      setMoveType(null);
      setReason("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const archiveMutation = useMutation({
    mutationFn: () => services.inventory.archiveProduct(itemId),
    onSuccess: () => {
      toast.success("Product archived");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      router.push("/app/inventory");
    },
  });

  if (isLoading) return <LoadingSkeleton />;
  if (!product) return <Card className="p-6">Product not found.</Card>;

  return (
    <div className="space-y-4">
      <PageHeader
        title={product.name}
        subtitle={`SKU: ${product.sku} • Category: ${product.category}`}
        actions={
          <>
            <Button
              size="sm"
              onClick={() => {
                setCost(String(product.purchaseCost));
                setMoveType("in");
              }}
            >
              <ArrowDown className="h-4 w-4" /> Stock In
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCost(String(product.purchaseCost));
                setMoveType("out");
              }}
            >
              <ArrowUp className="h-4 w-4" /> Stock Out
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => archiveMutation.mutate()}
            >
              <Archive className="h-4 w-4" /> Archive
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-[var(--text-secondary)]">Available Stock</p>
          <p className="text-xl font-bold mt-1">
            {product.quantity} {product.unit}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-secondary)]">Weighted Avg Cost</p>
          <FinancialAmount amount={product.purchaseCost} className="text-lg" />
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-secondary)]">Selling Price</p>
          <FinancialAmount amount={product.sellingPrice} className="text-lg" />
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-secondary)]">Total Stock Value</p>
          <FinancialAmount
            amount={product.quantity * product.purchaseCost}
            className="text-lg text-[var(--brand-primary)]"
          />
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="font-heading text-sm font-bold mb-3">Stock Movement History</h2>
        {movements.length === 0 ? (
          <p className="text-xs text-[var(--text-secondary)]">No movements recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {movements.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between text-xs py-2 border-b border-[var(--border-default)]/60"
              >
                <div>
                  <span className="font-medium">{m.reason}</span>
                  <p className="text-[11px] text-[var(--text-secondary)]">{m.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={m.type === "in" ? "success" : "warning"}>
                    {m.type === "in" ? "+" : "-"}
                    {m.quantity} {product.unit}
                  </Badge>
                  <span className="tabular-nums text-[var(--text-secondary)]">
                    @ {formatPKR(m.unitCost)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={moveType !== null}
        onOpenChange={(o) => !o && setMoveType(null)}
        title={moveType === "in" ? "Stock In (Arrival)" : "Stock Out (Dispatch)"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            moveMutation.mutate();
          }}
          className="space-y-3"
        >
          <div>
            <label className="block text-xs font-medium mb-1">Quantity ({product.unit})</label>
            <Input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              required
            />
          </div>
          {moveType === "in" && (
            <div>
              <label className="block text-xs font-medium mb-1">Unit Cost (PKR)</label>
              <Input
                type="number"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium mb-1">Reason</label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Godown arrival / Dispatch"
            />
          </div>
          <Button type="submit" className="w-full" disabled={moveMutation.isPending}>
            Save Stock Movement
          </Button>
        </form>
      </Modal>
    </div>
  );
}
