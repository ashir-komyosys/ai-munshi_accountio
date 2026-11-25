import { db } from "@/database/db";
import type { CreateTransactionInput } from "@/services/contracts";
import { addMoney, computeWeightedAverageCost, subMoney } from "@/lib/money";
import { generateId } from "@/lib/utils";
import type { JournalEntry, Transaction, TransactionLineItem } from "@/types";

export async function nextTransactionSerial(bookId: string): Promise<string> {
  const count = await db.transactions.where("bookId").equals(bookId).count();
  const prefix = bookId === "book_madina_retail" ? "RTL" : "NOV";
  return `${prefix}-${String(430 + count).padStart(6, "0")}`;
}

export function buildJournalEntriesForTransaction(
  tx: Transaction
): JournalEntry[] {
  const entries: JournalEntry[] = [];
  const push = (accountCode: string, accountName: string, debit: number, credit: number) => {
    if (debit === 0 && credit === 0) return;
    entries.push({
      id: generateId("je"),
      bookId: tx.bookId,
      transactionId: tx.id,
      date: tx.date,
      accountCode,
      accountName,
      debit,
      credit,
    });
  };

  switch (tx.type) {
    case "cash_sale":
    case "credit_sale":
    case "partial_sale": {
      if (tx.paidAmount > 0) push("1010", "Cash & Bank", tx.paidAmount, 0);
      if (tx.outstandingAmount > 0) push("1100", "Accounts Receivable", tx.outstandingAmount, 0);
      push("4000", "Sales Revenue", 0, tx.totalAmount);
      if (tx.cogsAmount && tx.cogsAmount > 0) {
        push("5000", "Cost of Goods Sold", tx.cogsAmount, 0);
        push("1200", "Inventory Stock", 0, tx.cogsAmount);
      }
      break;
    }
    case "cash_purchase":
    case "credit_purchase":
    case "partial_purchase": {
      push("1200", "Inventory Stock", tx.totalAmount, 0);
      if (tx.paidAmount > 0) push("1010", "Cash & Bank", 0, tx.paidAmount);
      if (tx.outstandingAmount > 0) push("2000", "Accounts Payable", 0, tx.outstandingAmount);
      break;
    }
    case "customer_receipt": {
      push("1010", "Cash & Bank", tx.totalAmount, 0);
      push("1100", "Accounts Receivable", 0, tx.totalAmount);
      break;
    }
    case "supplier_payment": {
      push("2000", "Accounts Payable", tx.totalAmount, 0);
      push("1010", "Cash & Bank", 0, tx.totalAmount);
      break;
    }
    case "expense":
    case "salary_payment": {
      push("5200", tx.type === "salary_payment" ? "Salaries Expense" : "Operating Expenses", tx.totalAmount, 0);
      push("1010", "Cash & Bank", 0, tx.totalAmount);
      break;
    }
    case "salary_advance":
    case "loan_given": {
      push("1150", "Advances & Loans Receivable", tx.totalAmount, 0);
      push("1010", "Cash & Bank", 0, tx.totalAmount);
      break;
    }
    case "loan_received": {
      push("1010", "Cash & Bank", tx.totalAmount, 0);
      push("2100", "Loans Payable", 0, tx.totalAmount);
      break;
    }
    case "loan_repayment": {
      push("2100", "Loans Payable", tx.totalAmount, 0);
      push("1010", "Cash & Bank", 0, tx.totalAmount);
      break;
    }
    case "capital_introduced": {
      push("1010", "Cash & Bank", tx.totalAmount, 0);
      push("3000", "Owner Capital", 0, tx.totalAmount);
      break;
    }
    case "owner_withdrawal": {
      push("3100", "Owner Drawings", tx.totalAmount, 0);
      push("1010", "Cash & Bank", 0, tx.totalAmount);
      break;
    }
    case "asset_purchase": {
      push("1500", "Fixed Assets", tx.totalAmount, 0);
      push("1010", "Cash & Bank", 0, tx.totalAmount);
      break;
    }
    case "sales_return": {
      push("4100", "Sales Returns", tx.totalAmount, 0);
      push("1100", "Accounts Receivable", 0, tx.totalAmount);
      break;
    }
    case "purchase_return": {
      push("2000", "Accounts Payable", tx.totalAmount, 0);
      push("1200", "Inventory Stock", 0, tx.totalAmount);
      break;
    }
    case "cash_transfer":
    case "bank_transfer": {
      // Internal transfer: debit destination, credit source (does not inflate revenue or expense)
      push("1010", "Cash & Bank (Destination)", tx.totalAmount, 0);
      push("1010", "Cash & Bank (Source)", 0, tx.totalAmount);
      break;
    }
    default: {
      push("1010", "General Ledger", tx.totalAmount, 0);
      push("3000", "General Ledger Offset", 0, tx.totalAmount);
    }
  }
  return entries;
}

export async function postAtomicTransaction(
  input: CreateTransactionInput
): Promise<Transaction> {
  const serial = await nextTransactionSerial(input.bookId);
  const txId = generateId("tx");
  const outstanding = Math.max(0, subMoney(input.totalAmount, input.paidAmount));

  return db.transaction(
    "rw",
    [
      db.transactions,
      db.lineItems,
      db.journalEntries,
      db.parties,
      db.accounts,
      db.products,
      db.stockMovements,
      db.books,
    ],
    async () => {
      let partyName: string | undefined;
      if (input.partyId) {
        const party = await db.parties.get(input.partyId);
        if (party) {
          partyName = party.name;
          let delta = 0;
          if (
            input.type === "credit_sale" ||
            input.type === "partial_sale" ||
            input.type === "cash_sale"
          ) {
            delta = outstanding; // increases receivable (+ Lena Hai)
          } else if (
            input.type === "credit_purchase" ||
            input.type === "partial_purchase" ||
            input.type === "cash_purchase"
          ) {
            delta = -outstanding; // increases payable (- Dena Hai)
          } else if (input.type === "customer_receipt") {
            delta = -input.totalAmount; // customer paid us
          } else if (input.type === "supplier_payment") {
            delta = input.totalAmount; // we paid supplier
          } else if (input.type === "sales_return") {
            delta = -input.totalAmount;
          } else if (input.type === "purchase_return") {
            delta = input.totalAmount;
          }
          if (delta !== 0) {
            await db.parties.update(party.id, {
              currentBalance: addMoney(party.currentBalance, delta),
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }

      // Update Cash/Bank Account balances
      if (input.type === "cash_transfer" || input.type === "bank_transfer") {
        if (input.accountId && input.toAccountId) {
          const fromAcc = await db.accounts.get(input.accountId);
          const toAcc = await db.accounts.get(input.toAccountId);
          if (fromAcc) {
            await db.accounts.update(fromAcc.id, {
              currentBalance: subMoney(fromAcc.currentBalance, input.totalAmount),
            });
          }
          if (toAcc) {
            await db.accounts.update(toAcc.id, {
              currentBalance: addMoney(toAcc.currentBalance, input.totalAmount),
            });
          }
        }
      } else if (input.accountId && input.paidAmount > 0 && input.paymentMethod !== "credit") {
        const acc = await db.accounts.get(input.accountId);
        if (acc) {
          const isInflow =
            input.type === "cash_sale" ||
            input.type === "partial_sale" ||
            input.type === "customer_receipt" ||
            input.type === "loan_received" ||
            input.type === "capital_introduced";
          const nextBal = isInflow
            ? addMoney(acc.currentBalance, input.paidAmount)
            : subMoney(acc.currentBalance, input.paidAmount);
          await db.accounts.update(acc.id, { currentBalance: nextBal });
        }
      }

      // Update Inventory & compute COGS for line items
      let computedCogs = 0;
      const lineItemsToInsert: TransactionLineItem[] = [];

      if (input.lineItems && input.lineItems.length > 0) {
        for (const item of input.lineItems) {
          lineItemsToInsert.push({
            ...item,
            id: generateId("li"),
            transactionId: txId,
          });
          if (item.productId) {
            const product = await db.products.get(item.productId);
            if (product) {
              if (input.type.includes("sale")) {
                const newQty = Math.max(0, product.quantity - item.quantity);
                computedCogs = addMoney(computedCogs, item.quantity * product.purchaseCost);
                await db.products.update(product.id, {
                  quantity: newQty,
                  updatedAt: new Date().toISOString(),
                });
                await db.stockMovements.put({
                  id: generateId("sm"),
                  bookId: input.bookId,
                  productId: product.id,
                  productName: product.name,
                  type: "out",
                  quantity: item.quantity,
                  unitCost: product.purchaseCost,
                  reason: `Sale ${serial}`,
                  transactionId: txId,
                  date: input.date,
                });
              } else if (input.type.includes("purchase")) {
                const newCost = computeWeightedAverageCost(
                  product.quantity,
                  product.purchaseCost,
                  item.quantity,
                  item.rate
                );
                await db.products.update(product.id, {
                  quantity: product.quantity + item.quantity,
                  purchaseCost: newCost,
                  updatedAt: new Date().toISOString(),
                });
                await db.stockMovements.put({
                  id: generateId("sm"),
                  bookId: input.bookId,
                  productId: product.id,
                  productName: product.name,
                  type: "in",
                  quantity: item.quantity,
                  unitCost: item.rate,
                  reason: `Purchase ${serial}`,
                  transactionId: txId,
                  date: input.date,
                });
              }
            }
          }
        }
      }

      const tx: Transaction = {
        id: txId,
        bookId: input.bookId,
        serial,
        date: input.date,
        type: input.type,
        particulars: input.particulars,
        partyId: input.partyId,
        partyName,
        accountId: input.accountId,
        toAccountId: input.toAccountId,
        paymentMethod: input.paymentMethod,
        totalAmount: input.totalAmount,
        paidAmount: input.paidAmount,
        outstandingAmount: outstanding,
        cogsAmount: computedCogs > 0 ? computedCogs : input.type.includes("sale") ? Math.round(input.totalAmount * 0.75) : undefined,
        notes: input.notes,
        source: input.source ?? "web",
        status: "posted",
        createdAt: new Date().toISOString(),
      };

      const journalEntries = buildJournalEntriesForTransaction(tx);

      await db.transactions.put(tx);
      if (lineItemsToInsert.length > 0) {
        await db.lineItems.bulkPut(lineItemsToInsert);
      }
      if (journalEntries.length > 0) {
        await db.journalEntries.bulkPut(journalEntries);
      }
      await db.books.update(input.bookId, {
        lastActivityAt: new Date().toISOString(),
      });

      return tx;
    }
  );
}

export async function reverseAtomicTransaction(
  transactionId: string,
  reason = "User reversal"
): Promise<Transaction> {
  const orig = await db.transactions.get(transactionId);
  if (!orig) throw new Error("Transaction not found");
  if (orig.status === "reversed") throw new Error("Transaction is already reversed");

  const reversalId = generateId("tx");
  const serial = await nextTransactionSerial(orig.bookId);

  return db.transaction(
    "rw",
    [db.transactions, db.journalEntries, db.parties, db.accounts],
    async () => {
      // Reverse party balance impact
      if (orig.partyId) {
        const party = await db.parties.get(orig.partyId);
        if (party) {
          let reverseDelta = 0;
          if (orig.type.includes("sale")) reverseDelta = -orig.outstandingAmount;
          else if (orig.type.includes("purchase")) reverseDelta = orig.outstandingAmount;
          else if (orig.type === "customer_receipt") reverseDelta = orig.totalAmount;
          else if (orig.type === "supplier_payment") reverseDelta = -orig.totalAmount;
          if (reverseDelta !== 0) {
            await db.parties.update(party.id, {
              currentBalance: addMoney(party.currentBalance, reverseDelta),
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }

      // Reverse Cash/Bank impact
      if (orig.accountId && orig.paidAmount > 0 && orig.paymentMethod !== "credit") {
        const acc = await db.accounts.get(orig.accountId);
        if (acc) {
          const wasInflow =
            orig.type.includes("sale") ||
            orig.type === "customer_receipt" ||
            orig.type === "loan_received" ||
            orig.type === "capital_introduced";
          const nextBal = wasInflow
            ? subMoney(acc.currentBalance, orig.paidAmount)
            : addMoney(acc.currentBalance, orig.paidAmount);
          await db.accounts.update(acc.id, { currentBalance: nextBal });
        }
      }

      const reversalTx: Transaction = {
        id: reversalId,
        bookId: orig.bookId,
        serial,
        date: new Date().toISOString().slice(0, 10),
        type: "journal",
        particulars: `Reversal of ${orig.serial}: ${orig.particulars} (${reason})`,
        partyId: orig.partyId,
        partyName: orig.partyName,
        accountId: orig.accountId,
        paymentMethod: orig.paymentMethod,
        totalAmount: orig.totalAmount,
        paidAmount: orig.paidAmount,
        outstandingAmount: orig.outstandingAmount,
        source: "web",
        status: "posted",
        reversesId: orig.id,
        createdAt: new Date().toISOString(),
      };

      // Flip original journal entries
      const origJournals = await db.journalEntries
        .where("transactionId")
        .equals(orig.id)
        .toArray();
      const reversedJournals: JournalEntry[] = origJournals.map((je) => ({
        id: generateId("je"),
        bookId: je.bookId,
        transactionId: reversalId,
        date: reversalTx.date,
        accountCode: je.accountCode,
        accountName: je.accountName,
        debit: je.credit,
        credit: je.debit,
      }));

      await db.transactions.update(orig.id, {
        status: "reversed",
        reversedById: reversalId,
      });
      await db.transactions.put(reversalTx);
      if (reversedJournals.length > 0) {
        await db.journalEntries.bulkPut(reversedJournals);
      }

      return reversalTx;
    }
  );
}
