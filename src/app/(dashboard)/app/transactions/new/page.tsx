"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/StatusStates";
import { Button, Card, Input, Select } from "@/components/ui/primitives";
import { formatPKR } from "@/lib/money";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";
import type { AccountType, TransactionType } from "@/types";

interface LineDraft {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
}

export default function NewMultiItemTransactionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const activeBookId = useUIStore((s) => s.activeBookId);

  const [type, setType] = useState<TransactionType>("partial_sale");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [partyId, setPartyId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<AccountType | "credit">("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([
    { productId: "", productName: "Cotton Yarn 40s", quantity: 10, unit: "kg", rate: 3250, discount: 0 },
  ]);

  const { data: parties = [] } = useQuery({
    queryKey: ["parties", activeBookId],
    queryFn: () => services.khatas.listParties(activeBookId),
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products", activeBookId],
    queryFn: () => services.inventory.listProducts(activeBookId),
  });
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts", activeBookId],
    queryFn: () => services.cashBank.listAccounts(activeBookId),
  });

  const grandTotal = lines.reduce(
    (sum, l) => sum + Math.max(0, l.quantity * l.rate - l.discount),
    0
  );

  const mutation = useMutation({
    mutationFn: () =>
      services.transactions.createTransaction({
        bookId: activeBookId,
        date,
        type,
        particulars: `${type.replace(/_/g, " ")} (${lines.map((l) => l.productName).join(", ")})`,
        partyId: partyId || undefined,
        accountId: accountId || accounts[0]?.id,
        paymentMethod,
        totalAmount: grandTotal,
        paidAmount: paidAmount === "" ? grandTotal : Number(paidAmount),
        notes,
        lineItems: lines.map((l) => ({
          productId: l.productId || undefined,
          productName: l.productName,
          quantity: l.quantity,
          unit: l.unit,
          rate: l.rate,
          discount: l.discount,
          total: Math.max(0, l.quantity * l.rate - l.discount),
        })),
      }),
    onSuccess: (tx) => {
      toast.success(`Saved multi-item entry ${tx.serial}`);
      queryClient.invalidateQueries();
      router.push(`/app/transactions/${tx.id}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="max-w-4xl space-y-4">
      <PageHeader
        title="New Multi-Item Transaction"
        subtitle="Record itemized sales or purchases with automatic stock & khata updates."
      />
      <Card className="p-5 sm:p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Type</label>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
              >
                <option value="partial_sale">Sale (Bechna)</option>
                <option value="partial_purchase">Purchase (Kharidna)</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Party (Khata)</label>
              <Select value={partyId} onChange={(e) => setPartyId(e.target.value)}>
                <option value="">-- Optional Party --</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Line Items</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setLines((prev) => [
                    ...prev,
                    { productId: "", productName: "", quantity: 1, unit: "kg", rate: 0, discount: 0 },
                  ])
                }
              >
                <Plus className="h-3.5 w-3.5" /> Add Row
              </Button>
            </div>
            {lines.map((line, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-xl bg-[var(--bg-subtle)]/50 border border-[var(--border-default)] items-end"
              >
                <div className="sm:col-span-4">
                  <label className="block text-[10px] mb-1">Product</label>
                  <Select
                    value={line.productId}
                    onChange={(e) => {
                      const prod = products.find((p) => p.id === e.target.value);
                      setLines((prev) =>
                        prev.map((l, i) =>
                          i === idx
                            ? {
                                ...l,
                                productId: e.target.value,
                                productName: prod?.name ?? l.productName,
                                unit: prod?.unit ?? l.unit,
                                rate: prod
                                  ? type.includes("sale")
                                    ? prod.sellingPrice
                                    : prod.purchaseCost
                                  : l.rate,
                              }
                            : l
                        )
                      );
                    }}
                  >
                    <option value="">Custom Item</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.quantity} {p.unit})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] mb-1">Qty</label>
                  <Input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((l, i) =>
                          i === idx ? { ...l, quantity: Number(e.target.value) || 0 } : l
                        )
                      )
                    }
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[10px] mb-1">Rate (PKR)</label>
                  <Input
                    type="number"
                    min="0"
                    value={line.rate}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((l, i) =>
                          i === idx ? { ...l, rate: Number(e.target.value) || 0 } : l
                        )
                      )
                    }
                  />
                </div>
                <div className="sm:col-span-2 text-xs font-bold tabular-nums py-2">
                  {formatPKR(line.quantity * line.rate - line.discount)}
                </div>
                <div className="sm:col-span-1">
                  {lines.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove item"
                      onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4 text-[var(--status-danger)]" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[var(--border-default)]">
            <div>
              <label className="block text-xs font-medium mb-1">Account</label>
              <Select
                value={accountId || accounts[0]?.id || ""}
                onChange={(e) => setAccountId(e.target.value)}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Payment Method</label>
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as AccountType | "credit")}
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
                <option value="jazzcash">JazzCash</option>
                <option value="credit">Credit (Udhaar)</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Paid Amount (PKR)</label>
              <Input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder={String(grandTotal)}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
            <p className="text-base font-bold tabular-nums">
              Grand Total: {formatPKR(grandTotal)}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending || grandTotal <= 0}>
                {mutation.isPending ? "Saving..." : "Save Multi-Item Entry"}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
