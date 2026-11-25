"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/StatusStates";
import { Button, Card, Input, Select } from "@/components/ui/primitives";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";
import type { PartyType } from "@/types";

export default function NewKhataPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const activeBookId = useUIStore((s) => s.activeBookId);

  const [name, setName] = useState("");
  const [type, setType] = useState<PartyType>("customer");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [openingDirection, setOpeningDirection] = useState<"receivable" | "payable">("receivable");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      services.khatas.createParty({
        bookId: activeBookId,
        name,
        type,
        phone,
        address,
        openingBalance: Number(openingBalance) || 0,
        openingDirection,
        notes,
      }),
    onSuccess: (party) => {
      toast.success(`Created khata for ${party.name}`);
      queryClient.invalidateQueries({ queryKey: ["parties"] });
      router.push(`/app/khatas/${party.id}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="max-w-xl space-y-4">
      <PageHeader title="Create Naya Khata" subtitle="Add a customer, supplier, or other party." />
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
              <label className="block text-xs font-medium mb-1">Party Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tariq Weaving Mills"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Party Type</label>
              <Select
                value={type}
                onChange={(e) => {
                  const val = e.target.value as PartyType;
                  setType(val);
                  setOpeningDirection(val === "supplier" ? "payable" : "receivable");
                }}
              >
                <option value="customer">Customer</option>
                <option value="supplier">Supplier</option>
                <option value="other">Other</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Phone Number</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">City / Address</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Yarn Market, Faisalabad"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Opening Balance (PKR)</label>
              <Input
                type="number"
                min="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Balance Direction</label>
              <Select
                value={openingDirection}
                onChange={(e) =>
                  setOpeningDirection(e.target.value as "receivable" | "payable")
                }
              >
                <option value="receivable">Lena Hai (Receivable)</option>
                <option value="payable">Dena Hai (Payable)</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Notes</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment terms, credit limit..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Khata"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
