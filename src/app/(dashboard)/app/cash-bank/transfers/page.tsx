"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/StatusStates";
import { Button, Card, Input, Select } from "@/components/ui/primitives";
import { formatPKR } from "@/lib/money";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";

export default function TransfersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const activeBookId = useUIStore((s) => s.activeBookId);

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts", activeBookId],
    queryFn: () => services.cashBank.listAccounts(activeBookId),
  });

  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      services.cashBank.transferFunds({
        bookId: activeBookId,
        fromAccountId: fromId || accounts[0]?.id,
        toAccountId: toId || accounts[1]?.id,
        amount: Number(amount),
        date,
        notes,
      }),
    onSuccess: (tx) => {
      toast.success(`Transfer recorded (${tx.serial}). Does not inflate revenue.`);
      queryClient.invalidateQueries();
      router.push("/app/cash-bank");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="max-w-xl space-y-4">
      <PageHeader
        title="Internal Cash & Bank Transfer"
        subtitle="Move funds between Cash, Bank, JazzCash, and Easypaisa without inflating sales or expenses."
      />
      <Card className="p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium mb-1">From Account</label>
            <Select
              value={fromId || accounts[0]?.id || ""}
              onChange={(e) => setFromId(e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatPKR(a.currentBalance)})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">To Account</label>
            <Select
              value={toId || accounts[1]?.id || ""}
              onChange={(e) => setToId(e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatPKR(a.currentBalance)})
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Amount (PKR)</label>
              <Input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Notes</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bank deposit slip #"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              Transfer Funds
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
