"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, Input, Modal, Select } from "@/components/ui/primitives";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";
import type { AccountType, TransactionType } from "@/types";

export function QuickEntryModal({
  open,
  onOpenChange,
  defaultType = "cash_sale",
  defaultPartyId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: TransactionType;
  defaultPartyId?: string;
}) {
  const queryClient = useQueryClient();
  const activeBookId = useUIStore((s) => s.activeBookId);

  const [typeOverride, setTypeOverride] = useState<TransactionType | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [particulars, setParticulars] = useState("");
  const [partyOverride, setPartyOverride] = useState<string | null>(null);
  const [accountId, setAccountId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<AccountType | "credit">("cash");
  const [totalAmount, setTotalAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [notes, setNotes] = useState("");

  const type = typeOverride ?? defaultType;
  const partyId = partyOverride ?? defaultPartyId ?? "";
  const setType = setTypeOverride;
  const setPartyId = setPartyOverride;

  const { data: parties = [] } = useQuery({
    queryKey: ["parties", activeBookId],
    queryFn: () => services.khatas.listParties(activeBookId),
    enabled: open,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts", activeBookId],
    queryFn: () => services.cashBank.listAccounts(activeBookId),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const total = Number(totalAmount);
      if (!total || total <= 0) throw new Error("Enter a valid positive amount");
      const paid =
        type === "credit_sale" || type === "credit_purchase"
          ? 0
          : paidAmount !== ""
          ? Number(paidAmount)
          : total;

      return services.transactions.createTransaction({
        bookId: activeBookId,
        date,
        type,
        particulars: particulars.trim() || `${type.replace(/_/g, " ")} entry`,
        partyId: partyId || undefined,
        accountId: accountId || accounts[0]?.id,
        paymentMethod,
        totalAmount: total,
        paidAmount: Math.min(total, Math.max(0, paid)),
        notes: notes || undefined,
        source: "web",
      });
    },
    onSuccess: (tx) => {
      toast.success(`Saved entry ${tx.serial}`);
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["parties"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      setParticulars("");
      setTotalAmount("");
      setPaidAmount("");
      setNotes("");
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const needsParty =
    type.includes("sale") ||
    type.includes("purchase") ||
    type === "customer_receipt" ||
    type === "supplier_payment";

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Record Transaction (Roznamcha)"
      description="Updates party khata, cash/bank balance, and balanced journal entries automatically."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-3.5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Transaction Type</label>
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
            >
              <option value="cash_sale">Cash Sale (Naqad Bechna)</option>
              <option value="credit_sale">Credit Sale (Udhaar Bechna)</option>
              <option value="partial_sale">Partial Payment Sale</option>
              <option value="cash_purchase">Cash Purchase (Naqad Kharid)</option>
              <option value="credit_purchase">Credit Purchase (Udhaar Kharid)</option>
              <option value="partial_purchase">Partial Payment Purchase</option>
              <option value="customer_receipt">Customer Receipt (Raqam Lena)</option>
              <option value="supplier_payment">Supplier Payment (Raqam Dena)</option>
              <option value="expense">Business Expense (Kharcha)</option>
              <option value="sales_return">Sales Return</option>
              <option value="purchase_return">Purchase Return</option>
              <option value="capital_introduced">Capital Introduced</option>
              <option value="owner_withdrawal">Owner Withdrawal</option>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
        </div>

        {needsParty && (
          <div>
            <label className="block text-xs font-medium mb-1">Party (Khata)</label>
            <Select value={partyId} onChange={(e) => setPartyId(e.target.value)}>
              <option value="">-- Select Customer / Supplier --</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.type})
                </option>
              ))}
            </Select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium mb-1">Description / Particulars</label>
          <Input
            value={particulars}
            onChange={(e) => setParticulars(e.target.value)}
            placeholder="e.g. Cotton Yarn 40s sold to Ibrahim Traders"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Total Amount (PKR)</label>
            <Input
              type="number"
              min="1"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="e.g. 150000"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Paid / Received Now (PKR)</label>
            <Input
              type="number"
              min="0"
              value={
                type === "credit_sale" || type === "credit_purchase" ? "0" : paidAmount
              }
              disabled={type === "credit_sale" || type === "credit_purchase"}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder={totalAmount || "Same as total"}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <option value="cash">Cash (Galla)</option>
              <option value="bank">Bank Transfer</option>
              <option value="jazzcash">JazzCash</option>
              <option value="easypaisa">Easypaisa</option>
              <option value="credit">Credit (Udhaar)</option>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Notes (Optional)</label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Invoice #, bilty reference, etc."
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save Entry"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
