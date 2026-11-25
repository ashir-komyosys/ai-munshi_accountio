"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { FinancialAmount } from "@/components/common/FinancialAmount";
import { LoadingSkeleton, PageHeader } from "@/components/common/StatusStates";
import { QuickEntryModal } from "@/components/transactions/QuickEntryModal";
import { Badge, Button, Card, Input, Modal, Select } from "@/components/ui/primitives";
import { formatPKR } from "@/lib/money";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";

export type FinanceSection = "loans" | "capital" | "assets" | "liabilities" | "salaries";

const TABS: Array<{ key: FinanceSection; href: string; label: string }> = [
  { key: "loans", href: "/app/cash-bank/loans", label: "Loans" },
  { key: "capital", href: "/app/cash-bank/capital", label: "Capital" },
  { key: "assets", href: "/app/cash-bank/assets", label: "Assets" },
  { key: "liabilities", href: "/app/cash-bank/liabilities", label: "Liabilities" },
  { key: "salaries", href: "/app/cash-bank/salaries", label: "Salaries" },
];

export function FinanceSubView({ section }: { section: FinanceSection }) {
  const queryClient = useQueryClient();
  const activeBookId = useUIStore((s) => s.activeBookId);

  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [loanDir, setLoanDir] = useState<"borrowed" | "lent">("borrowed");
  const [counterparty, setCounterparty] = useState("");
  const [loanAmt, setLoanAmt] = useState("");

  const [salaryModalOpen, setSalaryModalOpen] = useState(false);
  const [empId, setEmpId] = useState("");
  const [salType, setSalType] = useState<"salary" | "advance">("salary");
  const [salAmt, setSalAmt] = useState("");

  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetName, setAssetName] = useState("");
  const [assetVal, setAssetVal] = useState("");

  const [capModalOpen, setCapModalOpen] = useState(false);

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts", activeBookId],
    queryFn: () => services.cashBank.listAccounts(activeBookId),
  });
  const { data: loans = [], isLoading: lLoading } = useQuery({
    queryKey: ["loans", activeBookId],
    queryFn: () => services.loans.listLoans(activeBookId),
  });
  const { data: employees = [] } = useQuery({
    queryKey: ["employees", activeBookId],
    queryFn: () => services.loans.listEmployees(activeBookId),
  });
  const { data: salaries = [] } = useQuery({
    queryKey: ["salaries", activeBookId],
    queryFn: () => services.loans.listSalaries(activeBookId),
  });
  const { data: assets = [] } = useQuery({
    queryKey: ["assets", activeBookId],
    queryFn: () => services.loans.listAssets(activeBookId),
  });
  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", activeBookId],
    queryFn: () => services.transactions.listTransactions(activeBookId),
  });
  const { data: parties = [] } = useQuery({
    queryKey: ["parties", activeBookId],
    queryFn: () => services.khatas.listParties(activeBookId),
  });

  const invalidate = () => queryClient.invalidateQueries();

  const createLoan = useMutation({
    mutationFn: () =>
      services.loans.createLoan({
        bookId: activeBookId,
        direction: loanDir,
        counterpartyName: counterparty,
        principalAmount: Number(loanAmt),
        accountId: accounts[0]?.id ?? "acc_cash",
      }),
    onSuccess: () => {
      toast.success("Loan recorded");
      invalidate();
      setLoanModalOpen(false);
      setCounterparty("");
      setLoanAmt("");
    },
  });

  const repayLoan = useMutation({
    mutationFn: (vars: { id: string; amt: number }) =>
      services.loans.recordRepayment(vars.id, vars.amt, accounts[0]?.id ?? "acc_cash"),
    onSuccess: () => {
      toast.success("Loan repayment recorded");
      invalidate();
    },
  });

  const paySalary = useMutation({
    mutationFn: () =>
      services.loans.paySalaryOrAdvance({
        bookId: activeBookId,
        employeeId: empId || employees[0]?.id,
        type: salType,
        amount: Number(salAmt),
        month: "Nov 2026",
        accountId: accounts[0]?.id ?? "acc_cash",
      }),
    onSuccess: () => {
      toast.success("Salary / Advance recorded (Demo Payroll)");
      invalidate();
      setSalaryModalOpen(false);
      setSalAmt("");
    },
  });

  const createAsset = useMutation({
    mutationFn: () =>
      services.loans.createAsset({
        bookId: activeBookId,
        name: assetName,
        category: "Equipment",
        purchaseValue: Number(assetVal),
        currentValue: Number(assetVal),
        purchaseDate: new Date().toISOString().slice(0, 10),
        accountId: accounts[0]?.id ?? "acc_cash",
      }),
    onSuccess: () => {
      toast.success("Demo asset recorded");
      invalidate();
      setAssetModalOpen(false);
      setAssetName("");
      setAssetVal("");
    },
  });

  if (lLoading) return <LoadingSkeleton />;

  const capitalTxs = transactions.filter(
    (t) => t.type === "capital_introduced" || t.type === "owner_withdrawal"
  );
  const supplierPayables = parties
    .filter((p) => p.currentBalance < 0)
    .reduce((s, p) => s + Math.abs(p.currentBalance), 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Finance — ${TABS.find((t) => t.key === section)?.label}`}
        subtitle="Documented demo accounting workflows (not a statutory payroll or tax system)."
        actions={
          <Link href="/app/cash-bank">
            <Button variant="outline" size="sm">
              ← Back to Accounts
            </Button>
          </Link>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <Link key={t.key} href={t.href}>
            <Button size="sm" variant={t.key === section ? "primary" : "outline"}>
              {t.label}
            </Button>
          </Link>
        ))}
      </div>

      {section === "loans" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setLoanModalOpen(true)}>
              <Plus className="h-4 w-4" /> Record Loan
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {loans.map((l) => (
              <Card key={l.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{l.counterpartyName}</span>
                  <Badge tone={l.direction === "borrowed" ? "danger" : "info"}>
                    {l.direction === "borrowed" ? "Borrowed (Payable)" : "Lent (Receivable)"}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 text-xs pt-1">
                  <div>
                    <p className="text-[var(--text-secondary)]">Principal</p>
                    <p className="font-semibold tabular-nums">{formatPKR(l.principalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-secondary)]">Repaid</p>
                    <p className="font-semibold tabular-nums">{formatPKR(l.repaidAmount)}</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-secondary)]">Outstanding</p>
                    <p className="font-bold tabular-nums text-[var(--brand-primary)]">
                      {formatPKR(l.outstandingAmount)}
                    </p>
                  </div>
                </div>
                {l.outstandingAmount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      repayLoan.mutate({
                        id: l.id,
                        amt: Math.min(50000, l.outstandingAmount),
                      })
                    }
                  >
                    Record PKR 50,000 Repayment
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {section === "capital" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setCapModalOpen(true)}>
              <Plus className="h-4 w-4" /> Capital / Withdrawal Entry
            </Button>
          </div>
          <Card className="p-4">
            <h3 className="font-heading text-sm font-bold mb-3">Capital & Owner Drawings</h3>
            {capitalTxs.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)]">
                No owner capital or withdrawal entries recorded yet.
              </p>
            ) : (
              <div className="space-y-2">
                {capitalTxs.map((t) => (
                  <div key={t.id} className="flex justify-between text-xs py-2 border-b border-[var(--border-default)]">
                    <span>
                      {t.date} — {t.particulars}
                    </span>
                    <FinancialAmount amount={t.totalAmount} />
                  </div>
                ))}
              </div>
            )}
          </Card>
          <QuickEntryModal
            open={capModalOpen}
            onOpenChange={setCapModalOpen}
            defaultType="capital_introduced"
          />
        </div>
      )}

      {section === "assets" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setAssetModalOpen(true)}>
              <Plus className="h-4 w-4" /> Add Demo Asset
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {assets.map((a) => (
              <Card key={a.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{a.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {a.category} • Purchased {a.purchaseDate}
                  </p>
                </div>
                <FinancialAmount amount={a.currentValue} />
              </Card>
            ))}
          </div>
        </div>
      )}

      {section === "liabilities" && (
        <Card className="p-5 space-y-3">
          <h3 className="font-heading text-sm font-bold">Outstanding Liabilities</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)]">
              <p className="text-xs text-[var(--text-secondary)]">Supplier Payables (Dena Hai)</p>
              <FinancialAmount amount={supplierPayables} className="text-lg text-[var(--status-danger)]" />
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)]">
              <p className="text-xs text-[var(--text-secondary)]">Borrowed Loans</p>
              <FinancialAmount
                amount={loans
                  .filter((l) => l.direction === "borrowed")
                  .reduce((s, l) => s + l.outstandingAmount, 0)}
                className="text-lg text-[var(--status-danger)]"
              />
            </div>
          </div>
        </Card>
      )}

      {section === "salaries" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setSalaryModalOpen(true)}>
              <Plus className="h-4 w-4" /> Pay Salary / Advance
            </Button>
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[var(--border-default)] text-left text-xs text-[var(--text-secondary)]">
                  <th className="py-2.5 px-4">Employee</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4 text-end">Monthly Salary</th>
                  <th className="py-2.5 px-4 text-end">Advance</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.id} className="border-b border-[var(--border-default)]/60">
                    <td className="py-2.5 px-4 font-semibold">{e.name}</td>
                    <td className="py-2.5 px-4 text-[var(--text-secondary)]">{e.role}</td>
                    <td className="py-2.5 px-4 text-end tabular-nums">
                      {formatPKR(e.monthlySalary)}
                    </td>
                    <td className="py-2.5 px-4 text-end tabular-nums text-[var(--status-warning)]">
                      {formatPKR(e.advanceBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card className="p-4">
            <h3 className="font-heading text-xs font-bold mb-2">Recent Salary Payments</h3>
            {salaries.map((s) => (
              <div key={s.id} className="flex justify-between text-xs py-1.5 border-b border-[var(--border-default)]/50">
                <span>
                  {s.date} — {s.employeeName} ({s.type} • {s.month})
                </span>
                <span className="font-semibold tabular-nums">{formatPKR(s.amount)}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      <Modal open={loanModalOpen} onOpenChange={setLoanModalOpen} title="Record Loan">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createLoan.mutate();
          }}
          className="space-y-3"
        >
          <Select
            value={loanDir}
            onChange={(e) => setLoanDir(e.target.value as "borrowed" | "lent")}
          >
            <option value="borrowed">Borrow Money (Loan Received)</option>
            <option value="lent">Lend Money (Loan Given)</option>
          </Select>
          <Input
            placeholder="Counterparty Name"
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
            required
          />
          <Input
            type="number"
            min="1"
            placeholder="Principal Amount (PKR)"
            value={loanAmt}
            onChange={(e) => setLoanAmt(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">
            Save Loan
          </Button>
        </form>
      </Modal>

      <Modal open={salaryModalOpen} onOpenChange={setSalaryModalOpen} title="Pay Salary / Advance">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            paySalary.mutate();
          }}
          className="space-y-3"
        >
          <Select
            value={empId || employees[0]?.id || ""}
            onChange={(e) => setEmpId(e.target.value)}
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.role})
              </option>
            ))}
          </Select>
          <Select
            value={salType}
            onChange={(e) => setSalType(e.target.value as "salary" | "advance")}
          >
            <option value="salary">Monthly Salary</option>
            <option value="advance">Salary Advance</option>
          </Select>
          <Input
            type="number"
            min="1"
            placeholder="Amount (PKR)"
            value={salAmt}
            onChange={(e) => setSalAmt(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">
            Record Payment
          </Button>
        </form>
      </Modal>

      <Modal open={assetModalOpen} onOpenChange={setAssetModalOpen} title="Add Demo Asset">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createAsset.mutate();
          }}
          className="space-y-3"
        >
          <Input
            placeholder="Asset Name (e.g. Delivery Bike)"
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            required
          />
          <Input
            type="number"
            min="1"
            placeholder="Purchase Value (PKR)"
            value={assetVal}
            onChange={(e) => setAssetVal(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">
            Save Asset
          </Button>
        </form>
      </Modal>
    </div>
  );
}
