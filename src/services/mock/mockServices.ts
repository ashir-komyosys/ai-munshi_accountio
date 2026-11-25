import { db } from "@/database/db";
import { addMoney, computeWeightedAverageCost, subMoney } from "@/lib/money";
import { generateId } from "@/lib/utils";
import {
  DEMO_BILLING_HISTORY,
  DEMO_SUBSCRIPTION_PLANS,
} from "@/mocks/fixtures/seedData";
import type {
  AuthService,
  BooksService,
  CashBankService,
  ChatService,
  DocumentsService,
  InventoryService,
  KhatasService,
  LoansService,
  NotificationsService,
  ReportsService,
  SettingsService,
  SubscriptionService,
  TransactionsService,
} from "@/services/contracts";
import { postAtomicTransaction, reverseAtomicTransaction } from "./accountingEngine";
import { executeInteractiveOption, processSimulatedMunshiMessage } from "./chatEngine";

export const mockAuthService: AuthService = {
  async loginWithIdentifier(identifier) {
    if (!identifier.trim()) throw new Error("Phone or email is required");
    return { otpSent: true, demoOtp: "123456" };
  },
  async verifyOtp(identifier, code) {
    if (code !== "123456") {
      throw new Error("Invalid OTP. Use demo code 123456.");
    }
    const users = await db.users.toArray();
    const user = users[0] ?? {
      id: "user_owner",
      name: "Haji Muhammad Ashir",
      phone: identifier,
      email: "owner@almadinayarn.pk",
      role: "owner" as const,
      whatsappLinked: true,
      createdAt: new Date().toISOString(),
    };
    return { user };
  },
  async logout() {
    // Client store clears session
  },
};

export const mockBooksService: BooksService = {
  async listBooks() {
    return db.books.toArray();
  },
  async getBook(bookId) {
    return db.books.get(bookId);
  },
  async createBook(input) {
    const id = generateId("book");
    const now = new Date().toISOString();
    const book = {
      id,
      businessId: "biz_al_madina",
      name: input.name,
      businessType: input.businessType,
      currency: "PKR" as const,
      status: "active" as const,
      openingCash: input.openingCash,
      openingBank: input.openingBank,
      lastActivityAt: now,
      createdAt: now,
    };
    await db.transaction("rw", [db.books, db.accounts], async () => {
      await db.books.put(book);
      await db.accounts.bulkPut([
        {
          id: generateId("acc"),
          bookId: id,
          name: "Cash in Hand",
          type: "cash",
          openingBalance: input.openingCash,
          currentBalance: input.openingCash,
          isDefault: true,
          createdAt: now,
        },
        {
          id: generateId("acc"),
          bookId: id,
          name: "Primary Bank Account",
          type: "bank",
          openingBalance: input.openingBank,
          currentBalance: input.openingBank,
          createdAt: now,
        },
      ]);
    });
    return book;
  },
  async updateBook(bookId, patch) {
    await db.books.update(bookId, patch);
    const updated = await db.books.get(bookId);
    if (!updated) throw new Error("Book not found");
    return updated;
  },
  async archiveBook(bookId) {
    await db.books.update(bookId, { status: "archived" });
    const b = await db.books.get(bookId);
    if (!b) throw new Error("Book not found");
    return b;
  },
  async restoreBook(bookId) {
    await db.books.update(bookId, { status: "active" });
    const b = await db.books.get(bookId);
    if (!b) throw new Error("Book not found");
    return b;
  },
};

export const mockKhatasService: KhatasService = {
  async listParties(bookId, type) {
    const all = await db.parties.where("bookId").equals(bookId).toArray();
    return type ? all.filter((p) => p.type === type) : all;
  },
  async getParty(partyId) {
    return db.parties.get(partyId);
  },
  async createParty(input) {
    const signedBal =
      input.openingDirection === "receivable" ? input.openingBalance : -input.openingBalance;
    const now = new Date().toISOString();
    const party = {
      id: generateId("party"),
      bookId: input.bookId,
      name: input.name,
      type: input.type,
      phone: input.phone,
      address: input.address ?? "",
      openingBalance: input.openingBalance,
      openingDirection: input.openingDirection,
      currentBalance: signedBal,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };
    await db.parties.put(party);
    return party;
  },
  async updateParty(partyId, patch) {
    await db.parties.update(partyId, { ...patch, updatedAt: new Date().toISOString() });
    const p = await db.parties.get(partyId);
    if (!p) throw new Error("Party not found");
    return p;
  },
  async getPartyTransactions(partyId) {
    const list = await db.transactions.where("partyId").equals(partyId).toArray();
    return list.sort((a, b) => b.date.localeCompare(a.date));
  },
};

export const mockTransactionsService: TransactionsService = {
  async listTransactions(bookId) {
    const list = await db.transactions.where("bookId").equals(bookId).toArray();
    return list.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  },
  async getTransaction(transactionId) {
    const transaction = await db.transactions.get(transactionId);
    if (!transaction) return null;
    const [lineItems, journalEntries] = await Promise.all([
      db.lineItems.where("transactionId").equals(transactionId).toArray(),
      db.journalEntries.where("transactionId").equals(transactionId).toArray(),
    ]);
    return { transaction, lineItems, journalEntries };
  },
  async createTransaction(input) {
    return postAtomicTransaction(input);
  },
  async reverseTransaction(transactionId, reason) {
    return reverseAtomicTransaction(transactionId, reason);
  },
};

export const mockInventoryService: InventoryService = {
  async listProducts(bookId) {
    const all = await db.products.where("bookId").equals(bookId).toArray();
    return all.filter((p) => p.status === "active");
  },
  async getProduct(productId) {
    return db.products.get(productId);
  },
  async createProduct(input) {
    const product = {
      ...input,
      id: generateId("prod"),
      status: "active" as const,
      updatedAt: new Date().toISOString(),
    };
    await db.products.put(product);
    return product;
  },
  async updateProduct(productId, patch) {
    await db.products.update(productId, { ...patch, updatedAt: new Date().toISOString() });
    const p = await db.products.get(productId);
    if (!p) throw new Error("Product not found");
    return p;
  },
  async archiveProduct(productId) {
    await db.products.update(productId, { status: "archived" });
  },
  async recordStockMovement(input) {
    const product = await db.products.get(input.productId);
    if (!product) throw new Error("Product not found");

    if (input.type === "out" && product.quantity < input.quantity) {
      throw new Error(
        `Insufficient stock for ${product.name}. Available: ${product.quantity} ${product.unit}`
      );
    }

    const nextQty =
      input.type === "in"
        ? product.quantity + input.quantity
        : input.type === "out"
        ? product.quantity - input.quantity
        : input.quantity; // adjustment sets absolute or delta; here we treat as new qty or +/-

    const nextCost =
      input.type === "in"
        ? computeWeightedAverageCost(
            product.quantity,
            product.purchaseCost,
            input.quantity,
            input.unitCost
          )
        : product.purchaseCost;

    const movement = {
      id: generateId("sm"),
      bookId: input.bookId,
      productId: product.id,
      productName: product.name,
      type: input.type,
      quantity: input.quantity,
      unitCost: input.unitCost,
      reason: input.reason,
      date: input.date,
    };

    await db.transaction("rw", [db.products, db.stockMovements], async () => {
      await db.products.update(product.id, {
        quantity: nextQty,
        purchaseCost: nextCost,
        updatedAt: new Date().toISOString(),
      });
      await db.stockMovements.put(movement);
    });
    return movement;
  },
  async listMovements(bookId, productId) {
    const all = await db.stockMovements.where("bookId").equals(bookId).toArray();
    const filtered = productId ? all.filter((m) => m.productId === productId) : all;
    return filtered.sort((a, b) => b.date.localeCompare(a.date));
  },
};

export const mockCashBankService: CashBankService = {
  async listAccounts(bookId) {
    return db.accounts.where("bookId").equals(bookId).toArray();
  },
  async getAccount(accountId) {
    return db.accounts.get(accountId);
  },
  async createAccount(input) {
    const account = {
      ...input,
      id: generateId("acc"),
      currentBalance: input.openingBalance,
      createdAt: new Date().toISOString(),
    };
    await db.accounts.put(account);
    return account;
  },
  async updateAccount(accountId, patch) {
    await db.accounts.update(accountId, patch);
    const a = await db.accounts.get(accountId);
    if (!a) throw new Error("Account not found");
    return a;
  },
  async transferFunds(input) {
    if (input.fromAccountId === input.toAccountId) {
      throw new Error("Source and destination accounts must be different");
    }
    const fromAcc = await db.accounts.get(input.fromAccountId);
    const toAcc = await db.accounts.get(input.toAccountId);
    if (!fromAcc || !toAcc) throw new Error("Account not found");
    return postAtomicTransaction({
      bookId: input.bookId,
      date: input.date,
      type: toAcc.type === "cash" ? "cash_transfer" : "bank_transfer",
      particulars: `Transfer: ${fromAcc.name} → ${toAcc.name}`,
      accountId: fromAcc.id,
      toAccountId: toAcc.id,
      paymentMethod: fromAcc.type,
      totalAmount: input.amount,
      paidAmount: input.amount,
      notes: input.notes,
      source: "web",
    });
  },
};

export const mockLoansService: LoansService = {
  async listLoans(bookId) {
    return db.loans.where("bookId").equals(bookId).toArray();
  },
  async createLoan(input) {
    const loan = {
      id: generateId("loan"),
      bookId: input.bookId,
      direction: input.direction,
      counterpartyName: input.counterpartyName,
      principalAmount: input.principalAmount,
      repaidAmount: 0,
      outstandingAmount: input.principalAmount,
      dueDate: input.dueDate,
      status: "active" as const,
      createdAt: new Date().toISOString(),
    };
    await db.loans.put(loan);
    await postAtomicTransaction({
      bookId: input.bookId,
      date: new Date().toISOString().slice(0, 10),
      type: input.direction === "borrowed" ? "loan_received" : "loan_given",
      particulars: `Loan (${input.direction}) — ${input.counterpartyName}`,
      accountId: input.accountId,
      paymentMethod: "cash",
      totalAmount: input.principalAmount,
      paidAmount: input.principalAmount,
    });
    return loan;
  },
  async recordRepayment(loanId, amount, accountId) {
    const loan = await db.loans.get(loanId);
    if (!loan) throw new Error("Loan not found");
    const nextRepaid = addMoney(loan.repaidAmount, amount);
    const nextOut = Math.max(0, subMoney(loan.principalAmount, nextRepaid));
    await db.loans.update(loanId, {
      repaidAmount: nextRepaid,
      outstandingAmount: nextOut,
      status: nextOut === 0 ? "settled" : "active",
    });
    await postAtomicTransaction({
      bookId: loan.bookId,
      date: new Date().toISOString().slice(0, 10),
      type: "loan_repayment",
      particulars: `Loan Repayment — ${loan.counterpartyName}`,
      accountId,
      paymentMethod: "cash",
      totalAmount: amount,
      paidAmount: amount,
    });
    const updated = await db.loans.get(loanId);
    if (!updated) throw new Error("Loan not found");
    return updated;
  },
  async listEmployees(bookId) {
    return db.employees.where("bookId").equals(bookId).toArray();
  },
  async listSalaries(bookId) {
    return db.salaries.where("bookId").equals(bookId).toArray();
  },
  async paySalaryOrAdvance(input) {
    const emp = await db.employees.get(input.employeeId);
    if (!emp) throw new Error("Employee not found");
    const tx = await postAtomicTransaction({
      bookId: input.bookId,
      date: new Date().toISOString().slice(0, 10),
      type: input.type === "salary" ? "salary_payment" : "salary_advance",
      particulars: `${input.type === "salary" ? "Salary" : "Advance"} — ${emp.name} (${input.month})`,
      accountId: input.accountId,
      paymentMethod: "cash",
      totalAmount: input.amount,
      paidAmount: input.amount,
    });
    const record = {
      id: generateId("sal"),
      bookId: input.bookId,
      employeeId: emp.id,
      employeeName: emp.name,
      type: input.type,
      amount: input.amount,
      month: input.month,
      date: new Date().toISOString().slice(0, 10),
      transactionId: tx.id,
    };
    await db.salaries.put(record);
    if (input.type === "advance") {
      await db.employees.update(emp.id, {
        advanceBalance: addMoney(emp.advanceBalance, input.amount),
      });
    }
    return record;
  },
  async listAssets(bookId) {
    return db.assets.where("bookId").equals(bookId).toArray();
  },
  async createAsset(input) {
    const tx = await postAtomicTransaction({
      bookId: input.bookId,
      date: input.purchaseDate,
      type: "asset_purchase",
      particulars: `Asset Purchase: ${input.name}`,
      accountId: input.accountId,
      paymentMethod: "bank",
      totalAmount: input.purchaseValue,
      paidAmount: input.purchaseValue,
    });
    const asset = {
      id: generateId("asset"),
      bookId: input.bookId,
      name: input.name,
      category: input.category,
      purchaseValue: input.purchaseValue,
      currentValue: input.currentValue,
      purchaseDate: input.purchaseDate,
      transactionId: tx.id,
    };
    await db.assets.put(asset);
    return asset;
  },
};

export const mockReportsService: ReportsService = {
  async getFinancialSummary(bookId, dateRange) {
    const [txs, accounts, parties, products, assets, loans] = await Promise.all([
      db.transactions.where("bookId").equals(bookId).toArray(),
      db.accounts.where("bookId").equals(bookId).toArray(),
      db.parties.where("bookId").equals(bookId).toArray(),
      db.products.where("bookId").equals(bookId).toArray(),
      db.assets.where("bookId").equals(bookId).toArray(),
      db.loans.where("bookId").equals(bookId).toArray(),
    ]);

    const posted = txs.filter((t) => {
      if (t.status !== "posted") return false;
      if (dateRange?.from && t.date < dateRange.from) return false;
      if (dateRange?.to && t.date > dateRange.to) return false;
      return true;
    });

    const totalSales = posted
      .filter((t) => t.type === "cash_sale" || t.type === "credit_sale" || t.type === "partial_sale")
      .reduce((s, t) => addMoney(s, t.totalAmount), 0);
    const totalPurchases = posted
      .filter(
        (t) =>
          t.type === "cash_purchase" ||
          t.type === "credit_purchase" ||
          t.type === "partial_purchase"
      )
      .reduce((s, t) => addMoney(s, t.totalAmount), 0);
    const totalExpenses = posted
      .filter((t) => t.type === "expense" || t.type === "salary_payment")
      .reduce((s, t) => addMoney(s, t.totalAmount), 0);
    const cogs = posted
      .filter((t) => t.type === "cash_sale" || t.type === "credit_sale" || t.type === "partial_sale")
      .reduce((s, t) => addMoney(s, t.cogsAmount ?? Math.round(t.totalAmount * 0.75)), 0);

    const netProfit = subMoney(subMoney(totalSales, cogs), totalExpenses);

    const cashBalance = accounts
      .filter((a) => a.type === "cash")
      .reduce((s, a) => addMoney(s, a.currentBalance), 0);
    const bankBalance = accounts
      .filter((a) => a.type !== "cash")
      .reduce((s, a) => addMoney(s, a.currentBalance), 0);

    const totalReceivables = parties
      .filter((p) => p.currentBalance > 0)
      .reduce((s, p) => addMoney(s, p.currentBalance), 0);
    const totalPayables = parties
      .filter((p) => p.currentBalance < 0)
      .reduce((s, p) => addMoney(s, Math.abs(p.currentBalance)), 0);

    const inventoryValue = products
      .filter((p) => p.status === "active")
      .reduce((s, p) => addMoney(s, p.quantity * p.purchaseCost), 0);
    const assetsValue = assets.reduce((s, a) => addMoney(s, a.currentValue), 0);
    const loansPayable = loans
      .filter((l) => l.direction === "borrowed" && l.status === "active")
      .reduce((s, l) => addMoney(s, l.outstandingAmount), 0);
    const loansReceivable = loans
      .filter((l) => l.direction === "lent" && l.status === "active")
      .reduce((s, l) => addMoney(s, l.outstandingAmount), 0);

    return {
      totalSales,
      totalPurchases,
      totalExpenses,
      cogs,
      netProfit,
      cashBalance,
      bankBalance,
      totalReceivables,
      totalPayables,
      inventoryValue,
      assetsValue,
      loansPayable,
      loansReceivable,
    };
  },

  async getTrialBalance(bookId) {
    const entries = await db.journalEntries.where("bookId").equals(bookId).toArray();
    const map = new Map<string, { accountCode: string; accountName: string; debit: number; credit: number }>();
    for (const e of entries) {
      const existing = map.get(e.accountCode) ?? {
        accountCode: e.accountCode,
        accountName: e.accountName,
        debit: 0,
        credit: 0,
      };
      existing.debit = addMoney(existing.debit, e.debit);
      existing.credit = addMoney(existing.credit, e.credit);
      map.set(e.accountCode, existing);
    }
    return Array.from(map.values()).sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  },
};

export const mockDocumentsService: DocumentsService = {
  async listDocuments(bookId, category) {
    const all = await db.documents.where("bookId").equals(bookId).toArray();
    const filtered = category ? all.filter((d) => d.category === category) : all;
    return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async getDocument(documentId) {
    return db.documents.get(documentId);
  },
  async uploadDocument(input) {
    const doc = {
      ...input,
      id: generateId("doc"),
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };
    await db.documents.put(doc);
    return doc;
  },
  async deleteDocument(documentId) {
    await db.documents.delete(documentId);
  },
};

export const mockChatService: ChatService = {
  async getOrCreateConversation(bookId) {
    const existing = await db.conversations.where("bookId").equals(bookId).first();
    if (existing) return existing;
    const conv = {
      id: generateId("conv"),
      bookId,
      title: "AI Munshi Conversation",
      updatedAt: new Date().toISOString(),
    };
    await db.conversations.put(conv);
    await db.messages.put({
      id: generateId("msg"),
      conversationId: conv.id,
      bookId,
      clientMessageId: generateId("cm"),
      sender: "munshi",
      text: "Assalamualaikum! 👋\nAap ka AI Munshi yahan hai. Is book ka hisaab shuru karein?",
      timestamp: new Date().toISOString(),
      status: "sent",
      source: "web",
    });
    return conv;
  },
  async listMessages(conversationId) {
    const msgs = await db.messages.where("conversationId").equals(conversationId).toArray();
    return msgs.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  },
  async sendMessage(input) {
    // Idempotency by clientMessageId for retries
    const existing = await db.messages
      .where("clientMessageId")
      .equals(input.clientMessageId)
      .first();

    const userMessage = existing ?? {
      id: generateId("msg"),
      conversationId: input.conversationId,
      bookId: input.bookId,
      clientMessageId: input.clientMessageId,
      sender: "user" as const,
      text: input.text,
      timestamp: new Date().toISOString(),
      status: "sent" as const,
      source: input.source ?? ("web" as const),
      attachments: input.attachments,
    };

    if (!existing) {
      await db.messages.put(userMessage);
    }

    const munshiReply = await processSimulatedMunshiMessage({
      conversationId: input.conversationId,
      bookId: input.bookId,
      text: input.text,
      source: input.source,
      attachments: input.attachments,
    });

    await db.messages.put(munshiReply);
    await db.conversations.update(input.conversationId, {
      updatedAt: munshiReply.timestamp,
    });

    return { userMessage, munshiReply };
  },
  async triggerOption(input) {
    const orig = await db.messages.get(input.messageId);
    const option = orig?.options?.find((o) => o.id === input.optionId);
    if (!option) throw new Error("Option not found");
    const reply = await executeInteractiveOption({
      conversationId: input.conversationId,
      bookId: input.bookId,
      messageId: input.messageId,
      option,
    });
    await db.messages.put(reply);
    return reply;
  },
};

export const mockNotificationsService: NotificationsService = {
  async listNotifications(bookId) {
    const all = await db.notifications.where("bookId").equals(bookId).toArray();
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async markAsRead(notificationId) {
    await db.notifications.update(notificationId, { read: true });
  },
  async markAllRead(bookId) {
    const all = await db.notifications.where("bookId").equals(bookId).toArray();
    await Promise.all(all.map((n) => db.notifications.update(n.id, { read: true })));
  },
};

export const mockSettingsService: SettingsService = {
  async getBusiness() {
    const all = await db.businesses.toArray();
    return all[0];
  },
  async updateBusiness(patch) {
    const all = await db.businesses.toArray();
    const current = all[0];
    if (!current) throw new Error("Business not found");
    await db.businesses.update(current.id, patch);
    const updated = await db.businesses.get(current.id);
    if (!updated) throw new Error("Business not found");
    return updated;
  },
  async listUsers() {
    return db.users.toArray();
  },
  async inviteDemoUser(input) {
    const user = {
      ...input,
      id: generateId("user"),
      whatsappLinked: false,
      createdAt: new Date().toISOString(),
    };
    await db.users.put(user);
    return user;
  },
};

export const mockSubscriptionService: SubscriptionService = {
  async listPlans() {
    return DEMO_SUBSCRIPTION_PLANS;
  },
  async listBillingHistory() {
    const rows = await db.billingHistory.toArray();
    return rows.length > 0 ? rows : DEMO_BILLING_HISTORY;
  },
  async upgradePlan(planId) {
    const plan = DEMO_SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    const item = {
      id: generateId("bill"),
      date: new Date().toISOString().slice(0, 10),
      planName: plan?.name ?? "Karobar Pro (Demo)",
      amountPKR: plan?.pricePKR ?? 2500,
      status: "paid" as const,
      invoiceNo: `DEMO-INV-${Date.now().toString().slice(-6)}`,
    };
    await db.billingHistory.put(item);
    return item;
  },
};
