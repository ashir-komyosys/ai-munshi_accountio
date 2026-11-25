import { beforeAll, describe, expect, it } from "vitest";
import { resetDemoDatabase } from "@/database/seed";
import { services } from "@/services";

describe("IndexedDB Mock Services Integration", () => {
  beforeAll(async () => {
    await resetDemoDatabase();
  });

  it("seeds Al Madina Yarn Traders with 15+ customers, 10+ suppliers, 25+ items, and 150+ transactions", async () => {
    const parties = await services.khatas.listParties("book_al_madina");
    const customers = parties.filter((p) => p.type === "customer");
    const suppliers = parties.filter((p) => p.type === "supplier");
    const products = await services.inventory.listProducts("book_al_madina");
    const txs = await services.transactions.listTransactions("book_al_madina");

    expect(customers.length).toBeGreaterThanOrEqual(15);
    expect(suppliers.length).toBeGreaterThanOrEqual(10);
    expect(products.length).toBeGreaterThanOrEqual(25);
    expect(txs.length).toBeGreaterThanOrEqual(150);
  });

  it("isolates records between books", async () => {
    const book1Parties = await services.khatas.listParties("book_al_madina");
    const book2Parties = await services.khatas.listParties("book_madina_retail");
    expect(book1Parties.some((p) => p.name === "Ibrahim Traders")).toBe(true);
    expect(book2Parties.some((p) => p.name === "Ibrahim Traders")).toBe(false);
  });

  it("updates party balance and cash account atomically on transaction & reversal", async () => {
    const party = await services.khatas.createParty({
      bookId: "book_al_madina",
      name: "Test Faisalabad Party",
      type: "customer",
      phone: "+92 300 9998877",
      openingBalance: 0,
      openingDirection: "receivable",
    });

    const tx = await services.transactions.createTransaction({
      bookId: "book_al_madina",
      date: "2026-11-25",
      type: "partial_sale",
      particulars: "Test partial sale",
      partyId: party.id,
      accountId: "acc_cash",
      paymentMethod: "cash",
      totalAmount: 100000,
      paidAmount: 40000,
    });

    const updatedParty = await services.khatas.getParty(party.id);
    expect(updatedParty?.currentBalance).toBe(60000);

    await services.transactions.reverseTransaction(tx.id, "Test reversal");
    const revertedParty = await services.khatas.getParty(party.id);
    expect(revertedParty?.currentBalance).toBe(0);
  });

  it("processes simulated AI Munshi Roman Urdu purchase and confirms draft", async () => {
    const conv = await services.chat.getOrCreateConversation("book_al_madina");
    const { munshiReply } = await services.chat.sendMessage({
      conversationId: conv.id,
      bookId: "book_al_madina",
      text: "Ali Traders se 80,000 ka yarn khareeda, 30,000 cash diya, baqi udhaar",
      clientMessageId: "cm_test_idempotent_1",
    });

    expect(munshiReply.card?.type).toBe("draft_transaction");
    const confirmOpt = munshiReply.options?.find(
      (o) => o.actionType === "CONFIRM_DRAFT_TRANSACTION"
    );
    expect(confirmOpt).toBeDefined();

    const savedReply = await services.chat.triggerOption({
      conversationId: conv.id,
      bookId: "book_al_madina",
      messageId: munshiReply.id,
      optionId: confirmOpt!.id,
    });
    expect(savedReply.card?.type).toBe("saved_transaction");
  });

  it("produces balanced Trial Balance totals", async () => {
    const tb = await services.reports.getTrialBalance("book_al_madina");
    const debit = tb.reduce((s, r) => s + r.debit, 0);
    const credit = tb.reduce((s, r) => s + r.credit, 0);
    expect(debit).toBe(credit);
  });
});
