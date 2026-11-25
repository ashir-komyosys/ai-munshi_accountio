"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/StatusStates";
import { Button, Card, Input, Select } from "@/components/ui/primitives";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";
import type { StockUnit } from "@/types";

export default function NewInventoryItemPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const activeBookId = useUIStore((s) => s.activeBookId);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("Yarn");
  const [unit, setUnit] = useState<StockUnit>("kg");
  const [quantity, setQuantity] = useState("100");
  const [lowStockThreshold, setLowStockThreshold] = useState("25");
  const [purchaseCost, setPurchaseCost] = useState("2500");
  const [sellingPrice, setSellingPrice] = useState("3000");

  const mutation = useMutation({
    mutationFn: () =>
      services.inventory.createProduct({
        bookId: activeBookId,
        name,
        sku: sku || `SKU-${Date.now().toString().slice(-4)}`,
        category,
        unit,
        quantity: Number(quantity) || 0,
        lowStockThreshold: Number(lowStockThreshold) || 10,
        purchaseCost: Number(purchaseCost) || 0,
        sellingPrice: Number(sellingPrice) || 0,
      }),
    onSuccess: (p) => {
      toast.success(`Added ${p.name} to inventory`);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      router.push("/app/inventory");
    },
  });

  return (
    <div className="max-w-xl space-y-4">
      <PageHeader title="Add Inventory Item" />
      <Card className="p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Product Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Combed Cotton 40s"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">SKU</label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="YRN-C40-NEW"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Category</label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Unit</label>
              <Select value={unit} onChange={(e) => setUnit(e.target.value as StockUnit)}>
                <option value="kg">Kilogram (kg)</option>
                <option value="gram">Gram</option>
                <option value="meter">Meter</option>
                <option value="yard">Yard</option>
                <option value="piece">Piece</option>
                <option value="bag">Bag</option>
                <option value="carton">Carton</option>
                <option value="roll">Roll</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Initial Quantity</label>
              <Input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Low-Stock Threshold</label>
              <Input
                type="number"
                min="0"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Purchase Cost (PKR)</label>
              <Input
                type="number"
                min="0"
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Selling Price (PKR)</label>
              <Input
                type="number"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              Save Item
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
