import type {
  AccountType,
  AppNotification,
  AssetRecord,
  BillingHistoryItem,
  Book,
  Business,
  CashBankAccount,
  ChatAttachment,
  ChatMessage,
  Conversation,
  DocumentCategory,
  DocumentRecord,
  Employee,
  InventoryProduct,
  JournalEntry,
  LoanRecord,
  Party,
  PartyType,
  SalaryRecord,
  StockMovement,
  SubscriptionPlan,
  Transaction,
  TransactionLineItem,
  TransactionSource,
  TransactionType,
  User,
} from "@/types";

export interface AuthService {
  loginWithIdentifier(identifier: string): Promise<{ otpSent: boolean; demoOtp: string }>;
  verifyOtp(identifier: string, code: string): Promise<{ user: User }>;
  logout(): Promise<void>;
}

export interface BooksService {
  listBooks(): Promise<Book[]>;
  getBook(bookId: string): Promise<Book | undefined>;
  createBook(input: {
    name: string;
    businessType: string;
    openingCash: number;
    openingBank: number;
  }): Promise<Book>;
  updateBook(bookId: string, patch: Partial<Book>): Promise<Book>;
  archiveBook(bookId: string): Promise<Book>;
  restoreBook(bookId: string): Promise<Book>;
}

export interface KhatasService {
  listParties(bookId: string, type?: PartyType): Promise<Party[]>;
  getParty(partyId: string): Promise<Party | undefined>;
  createParty(input: {
    bookId: string;
    name: string;
    type: PartyType;
    phone: string;
    address?: string;
    openingBalance: number;
    openingDirection: "receivable" | "payable";
    notes?: string;
  }): Promise<Party>;
  updateParty(partyId: string, patch: Partial<Party>): Promise<Party>;
  getPartyTransactions(partyId: string): Promise<Transaction[]>;
}

export interface CreateTransactionInput {
  bookId: string;
  date: string;
  type: TransactionType;
  particulars: string;
  partyId?: string;
  accountId?: string;
  toAccountId?: string;
  paymentMethod: AccountType | "credit";
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  source?: TransactionSource;
  lineItems?: Array<Omit<TransactionLineItem, "id" | "transactionId">>;
}

export interface TransactionsService {
  listTransactions(bookId: string): Promise<Transaction[]>;
  getTransaction(transactionId: string): Promise<{
    transaction: Transaction;
    lineItems: TransactionLineItem[];
    journalEntries: JournalEntry[];
  } | null>;
  createTransaction(input: CreateTransactionInput): Promise<Transaction>;
  reverseTransaction(transactionId: string, reason?: string): Promise<Transaction>;
}

export interface InventoryService {
  listProducts(bookId: string): Promise<InventoryProduct[]>;
  getProduct(productId: string): Promise<InventoryProduct | undefined>;
  createProduct(
    input: Omit<InventoryProduct, "id" | "status" | "updatedAt">
  ): Promise<InventoryProduct>;
  updateProduct(productId: string, patch: Partial<InventoryProduct>): Promise<InventoryProduct>;
  archiveProduct(productId: string): Promise<void>;
  recordStockMovement(input: {
    bookId: string;
    productId: string;
    type: "in" | "out" | "adjustment";
    quantity: number;
    unitCost: number;
    reason: string;
    date: string;
  }): Promise<StockMovement>;
  listMovements(bookId: string, productId?: string): Promise<StockMovement[]>;
}

export interface CashBankService {
  listAccounts(bookId: string): Promise<CashBankAccount[]>;
  getAccount(accountId: string): Promise<CashBankAccount | undefined>;
  createAccount(
    input: Omit<CashBankAccount, "id" | "currentBalance" | "createdAt">
  ): Promise<CashBankAccount>;
  updateAccount(accountId: string, patch: Partial<CashBankAccount>): Promise<CashBankAccount>;
  transferFunds(input: {
    bookId: string;
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    date: string;
    notes?: string;
  }): Promise<Transaction>;
}

export interface LoansService {
  listLoans(bookId: string): Promise<LoanRecord[]>;
  createLoan(input: {
    bookId: string;
    direction: "borrowed" | "lent";
    counterpartyName: string;
    principalAmount: number;
    dueDate?: string;
    accountId: string;
  }): Promise<LoanRecord>;
  recordRepayment(loanId: string, amount: number, accountId: string): Promise<LoanRecord>;
  listEmployees(bookId: string): Promise<Employee[]>;
  listSalaries(bookId: string): Promise<SalaryRecord[]>;
  paySalaryOrAdvance(input: {
    bookId: string;
    employeeId: string;
    type: "salary" | "advance";
    amount: number;
    month: string;
    accountId: string;
  }): Promise<SalaryRecord>;
  listAssets(bookId: string): Promise<AssetRecord[]>;
  createAsset(input: Omit<AssetRecord, "id"> & { accountId: string }): Promise<AssetRecord>;
}

export interface FinancialSummary {
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  cogs: number;
  netProfit: number;
  cashBalance: number;
  bankBalance: number;
  totalReceivables: number;
  totalPayables: number;
  inventoryValue: number;
  assetsValue: number;
  loansPayable: number;
  loansReceivable: number;
}

export interface ReportsService {
  getFinancialSummary(
    bookId: string,
    dateRange?: { from?: string; to?: string }
  ): Promise<FinancialSummary>;
  getTrialBalance(bookId: string): Promise<
    Array<{ accountCode: string; accountName: string; debit: number; credit: number }>
  >;
}

export interface DocumentsService {
  listDocuments(bookId: string, category?: DocumentCategory): Promise<DocumentRecord[]>;
  getDocument(documentId: string): Promise<DocumentRecord | undefined>;
  uploadDocument(input: {
    bookId: string;
    title: string;
    category: DocumentCategory;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    dataUrl?: string;
    transactionId?: string;
    transactionSerial?: string;
  }): Promise<DocumentRecord>;
  deleteDocument(documentId: string): Promise<void>;
}

export interface ChatService {
  getOrCreateConversation(bookId: string): Promise<Conversation>;
  listMessages(conversationId: string): Promise<ChatMessage[]>;
  sendMessage(input: {
    conversationId: string;
    bookId: string;
    text: string;
    clientMessageId: string;
    source?: ChatMessage["source"];
    attachments?: ChatAttachment[];
  }): Promise<{ userMessage: ChatMessage; munshiReply: ChatMessage }>;
  triggerOption(input: {
    conversationId: string;
    bookId: string;
    messageId: string;
    optionId: string;
  }): Promise<ChatMessage>;
}

export interface NotificationsService {
  listNotifications(bookId: string): Promise<AppNotification[]>;
  markAsRead(notificationId: string): Promise<void>;
  markAllRead(bookId: string): Promise<void>;
}

export interface SettingsService {
  getBusiness(): Promise<Business | undefined>;
  updateBusiness(patch: Partial<Business>): Promise<Business>;
  listUsers(): Promise<User[]>;
  inviteDemoUser(input: Omit<User, "id" | "createdAt" | "whatsappLinked">): Promise<User>;
}

export interface SubscriptionService {
  listPlans(): Promise<SubscriptionPlan[]>;
  listBillingHistory(): Promise<BillingHistoryItem[]>;
  upgradePlan(planId: string): Promise<BillingHistoryItem>;
}
