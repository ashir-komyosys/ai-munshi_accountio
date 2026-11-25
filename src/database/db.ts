import Dexie, { type Table } from "dexie";
import type {
  AppNotification,
  AssetRecord,
  BillingHistoryItem,
  Book,
  Business,
  CashBankAccount,
  ChatMessage,
  Conversation,
  DocumentRecord,
  Employee,
  InventoryProduct,
  JournalEntry,
  LoanRecord,
  Party,
  SalaryRecord,
  StockMovement,
  Transaction,
  TransactionLineItem,
  User,
} from "@/types";

export class AccountioDatabase extends Dexie {
  users!: Table<User, string>;
  businesses!: Table<Business, string>;
  books!: Table<Book, string>;
  parties!: Table<Party, string>;
  accounts!: Table<CashBankAccount, string>;
  transactions!: Table<Transaction, string>;
  lineItems!: Table<TransactionLineItem, string>;
  journalEntries!: Table<JournalEntry, string>;
  products!: Table<InventoryProduct, string>;
  stockMovements!: Table<StockMovement, string>;
  loans!: Table<LoanRecord, string>;
  employees!: Table<Employee, string>;
  salaries!: Table<SalaryRecord, string>;
  assets!: Table<AssetRecord, string>;
  documents!: Table<DocumentRecord, string>;
  conversations!: Table<Conversation, string>;
  messages!: Table<ChatMessage, string>;
  notifications!: Table<AppNotification, string>;
  billingHistory!: Table<BillingHistoryItem, string>;

  constructor() {
    super("AccountioAIDemoDB");
    this.version(1).stores({
      users: "id, phone, email",
      businesses: "id, ownerId",
      books: "id, businessId, status",
      parties: "id, bookId, type, name",
      accounts: "id, bookId, type",
      transactions: "id, bookId, serial, date, type, partyId, accountId, status",
      lineItems: "id, transactionId, productId",
      journalEntries: "id, bookId, transactionId, date, accountCode",
      products: "id, bookId, sku, category, status",
      stockMovements: "id, bookId, productId, date, transactionId",
      loans: "id, bookId, direction, status",
      employees: "id, bookId, status",
      salaries: "id, bookId, employeeId, date",
      assets: "id, bookId, category",
      documents: "id, bookId, category, date, transactionId",
      conversations: "id, bookId, updatedAt",
      messages: "id, conversationId, bookId, clientMessageId, timestamp",
      notifications: "id, bookId, read, type, createdAt",
      billingHistory: "id, date, status",
    });
  }
}

export const db = new AccountioDatabase();
