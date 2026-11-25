import { describe, expect, it } from "vitest";
import {
  addMoney,
  computeWeightedAverageCost,
  formatPKR,
  mulMoney,
  subMoney,
} from "@/lib/money";
import { buildJournalEntriesForTransaction } from "@/services/mock/accountingEngine";
import { khataSchema, loginSchema, otpSchema } from "@/schemas";
import type { Transaction } from "@/types";

describe("Money & Arithmetic Utilities", () => {
  it("adds and subtracts currency without floating point drift", () => {
    expect(addMoney(0.1, 0.2)).toBe(0.3);
    expect(subMoney(150000, 50000)).toBe(100000);
    expect(mulMoney(2800, 12)).toBe(33600);
  });

  it("formats PKR values cleanly", () => {
    expect(formatPKR(1250000)).toBe("PKR 1,250,000");
    expect(formatPKR(-5000)).toBe("-PKR 5,000");
  });

  it("computes weighted average cost accurately", () => {
    // 100 units @ 2000 + 100 units @ 3000 => 2500
    expect(computeWeightedAverageCost(100, 2000, 100, 3000)).toBe(2500);
  });
});

describe("Balanced Double-Entry Journal Generation", () => {
  it("balances debits and credits for partial purchase", () => {
    const tx: Transaction = {
      id: "tx_test_1",
      bookId: "book_al_madina",
      serial: "NOV-000999",
      date: "2026-11-24",
      type: "partial_purchase",
      particulars: "Yarn from Ali Traders",
      paymentMethod: "cash",
      totalAmount: 150000,
      paidAmount: 50000,
      outstandingAmount: 100000,
      source: "web",
      status: "posted",
      createdAt: new Date().toISOString(),
    };
    const entries = buildJournalEntriesForTransaction(tx);
    const totalDebit = entries.reduce((s, e) => addMoney(s, e.debit), 0);
    const totalCredit = entries.reduce((s, e) => addMoney(s, e.credit), 0);
    expect(totalDebit).toBe(150000);
    expect(totalCredit).toBe(150000);
    expect(totalDebit).toBe(totalCredit);
  });
});

describe("Validation Schemas", () => {
  it("validates OTP 6 digits and khata schema", () => {
    expect(otpSchema.safeParse({ code: "123456" }).success).toBe(true);
    expect(otpSchema.safeParse({ code: "12a456" }).success).toBe(false);
    expect(loginSchema.safeParse({ identifier: "+92 300 8664123" }).success).toBe(true);
    expect(
      khataSchema.safeParse({
        name: "Ali Traders",
        type: "supplier",
        phone: "+92 300 1234567",
        openingBalance: 50000,
        openingDirection: "payable",
      }).success
    ).toBe(true);
  });
});
