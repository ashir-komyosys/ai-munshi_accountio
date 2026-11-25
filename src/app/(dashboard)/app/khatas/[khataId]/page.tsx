"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Edit2, MessageSquare, Plus } from "lucide-react";
import { toast } from "sonner";
import { FinancialAmount } from "@/components/common/FinancialAmount";
import { LoadingSkeleton, PageHeader } from "@/components/common/StatusStates";
import { QuickEntryModal } from "@/components/transactions/QuickEntryModal";
import { Badge, Button, Card, Input, Modal } from "@/components/ui/primitives";
import { downloadPDF } from "@/lib/exportReports";
import { formatPKR } from "@/lib/money";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";
import type { TransactionType } from "@/types";

export default function KhataDetailPage() {
  const { khataId } = useParams<{ khataId: string }>();
  const queryClient = useQueryClient();
  const openMunshiDrawer = useUIStore((s) => s.openMunshiDrawer);

  const [quickOpen, setQuickOpen] = useState(false);
  const [quickType, setQuickType] = useState<TransactionType>("customer_receipt");
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const { data: party, isLoading } = useQuery({
    queryKey: ["party", khataId],
    queryFn: () => services.khatas.getParty(khataId),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["party-tx", khataId],
    queryFn: () => services.khatas.getPartyTransactions(khataId),
  });

  const editMutation = useMutation({
    mutationFn: () =>
      services.khatas.updateParty(khataId, { name: editName, phone: editPhone }),
    onSuccess: () => {
      toast.success("Party details updated");
      queryClient.invalidateQueries({ queryKey: ["party", khataId] });
      queryClient.invalidateQueries({ queryKey: ["parties"] });
      setEditOpen(false);
    },
  });

  if (isLoading) return <LoadingSkeleton />;
  if (!party) return <Card className="p-6">Khata not found.</Card>;

  const openAction = (type: TransactionType) => {
    setQuickType(type);
    setQuickOpen(true);
  };

  const handleDownloadStatement = () => {
    downloadPDF(
      `Khata-${party.name.replace(/\s+/g, "-")}`,
      `Khata Statement — ${party.name}`,
      `Phone: ${party.phone} | Current Balance: ${formatPKR(Math.abs(party.currentBalance))}`,
      ["Date", "Serial", "Particulars", "Type", "Total (PKR)", "Paid (PKR)"],
      transactions.map((t) => [
        t.date,
        t.serial,
        t.particulars,
        t.type,
        t.totalAmount,
        t.paidAmount,
      ])
    );
    toast.success("Downloaded demo PDF statement");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={party.name}
        subtitle={`${party.type.toUpperCase()} • ${party.phone} • ${party.address || "Faisalabad"}`}
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openMunshiDrawer(`${party.name} ka khata dikhao`)}
            >
              <MessageSquare className="h-4 w-4" /> Ask AI Munshi
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditName(party.name);
                setEditPhone(party.phone);
                setEditOpen(true);
              }}
            >
              <Edit2 className="h-4 w-4" /> Edit
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownloadStatement}>
              <Download className="h-4 w-4" /> PDF Statement
            </Button>
            <Link href={`/app/khatas/${party.id}/statement`}>
              <Button size="sm" variant="secondary">
                View Statement
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs text-[var(--text-secondary)]">Current Outstanding Balance</p>
          <div className="flex items-center gap-2 mt-1">
            <FinancialAmount amount={Math.abs(party.currentBalance)} className="text-xl" />
            <Badge
              tone={
                party.currentBalance > 0
                  ? "success"
                  : party.currentBalance < 0
                  ? "danger"
                  : "neutral"
              }
            >
              {party.currentBalance > 0
                ? "Lena Hai"
                : party.currentBalance < 0
                ? "Dena Hai"
                : "Settled"}
            </Badge>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-secondary)]">Opening Balance</p>
          <p className="text-xl font-bold mt-1">
            <FinancialAmount amount={party.openingBalance} />
          </p>
        </Card>
        <Card className="p-4 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => openAction("credit_sale")}>
            <Plus className="h-3.5 w-3.5" /> Sale
          </Button>
          <Button size="sm" variant="outline" onClick={() => openAction("credit_purchase")}>
            Purchase
          </Button>
          <Button size="sm" variant="outline" onClick={() => openAction("customer_receipt")}>
            Receive
          </Button>
          <Button size="sm" variant="outline" onClick={() => openAction("supplier_payment")}>
            Pay
          </Button>
        </Card>
      </div>

      <Card className="overflow-x-auto">
        <div className="p-4 border-b border-[var(--border-default)]">
          <h2 className="font-heading text-sm font-bold">Ledger History ({transactions.length})</h2>
        </div>
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--bg-subtle)]/50 text-left text-xs text-[var(--text-secondary)]">
              <th className="py-2.5 px-4">Date</th>
              <th className="py-2.5 px-4">Serial</th>
              <th className="py-2.5 px-4">Particulars</th>
              <th className="py-2.5 px-4">Type</th>
              <th className="py-2.5 px-4 text-end">Total</th>
              <th className="py-2.5 px-4 text-end">Paid</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b border-[var(--border-default)]/60">
                <td className="py-2.5 px-4 whitespace-nowrap">{t.date}</td>
                <td className="py-2.5 px-4 font-mono text-xs">{t.serial}</td>
                <td className="py-2.5 px-4">{t.particulars}</td>
                <td className="py-2.5 px-4">
                  <Badge tone="neutral">{t.type.replace(/_/g, " ")}</Badge>
                </td>
                <td className="py-2.5 px-4 text-end font-semibold tabular-nums">
                  {formatPKR(t.totalAmount)}
                </td>
                <td className="py-2.5 px-4 text-end tabular-nums text-[var(--text-secondary)]">
                  {formatPKR(t.paidAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <QuickEntryModal
        open={quickOpen}
        onOpenChange={setQuickOpen}
        defaultType={quickType}
        defaultPartyId={party.id}
      />

      <Modal open={editOpen} onOpenChange={setEditOpen} title="Edit Party Details">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            editMutation.mutate();
          }}
          className="space-y-3"
        >
          <div>
            <label className="block text-xs font-medium mb-1">Party Name</label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Phone</label>
            <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
