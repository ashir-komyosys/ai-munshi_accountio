export type Locale = "en" | "ur";
export type ThemeMode = "light" | "dark" | "system";
export type UserRole = "owner" | "admin" | "accountant" | "staff" | "viewer";

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  whatsappLinked: boolean;
  whatsappNumber?: string;
  createdAt: string;
}

export interface Business {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  currency: "PKR";
  financialYear: string;
  ownerId: string;
}

export interface Book {
  id: string;
  businessId: string;
  name: string;
  businessType: string;
  currency: "PKR";
  status: "active" | "archived";
  openingCash: number;
  openingBank: number;
  lastActivityAt: string;
  createdAt: string;
}

export type PartyType = "customer" | "supplier" | "other";
export type BalanceDirection = "receivable" | "payable" | "settled";

export interface Party {
  id: string;
  bookId: string;
  name: string;
  type: PartyType;
  phone: string;
  address: string;
  openingBalance: number;
  openingDirection: "receivable" | "payable";
  currentBalance: number; // positive = receivable (Lena Hai), negative = payable (Dena Hai)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AccountType = "cash" | "bank" | "jazzcash" | "easypaisa" | "wallet";

export interface CashBankAccount {
  id: string;
  bookId: string;
  name: string;
  type: AccountType;
  accountNumber?: string;
  bankName?: string;
  openingBalance: number;
  currentBalance: number;
  isDefault?: boolean;
  createdAt: string;
}

export type TransactionType =
  | "cash_sale"
  | "credit_sale"
  | "partial_sale"
  | "cash_purchase"
  | "credit_purchase"
  | "partial_purchase"
  | "customer_receipt"
  | "supplier_payment"
  | "expense"
  | "sales_return"
  | "purchase_return"
  | "cash_transfer"
  | "bank_transfer"
  | "loan_received"
  | "loan_given"
  | "loan_repayment"
  | "capital_introduced"
  | "owner_withdrawal"
  | "salary_payment"
  | "salary_advance"
  | "asset_purchase"
  | "journal";

export type TransactionStatus = "posted" | "reversed" | "draft";
export type TransactionSource = "web" | "ai_munshi" | "whatsapp_demo" | "seed";

export interface TransactionLineItem {
  id: string;
  transactionId: string;
  productId?: string;
  productName: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  total: number;
}

export interface Transaction {
  id: string;
  bookId: string;
  serial: string; // e.g. NOV-000427
  date: string; // ISO date YYYY-MM-DD
  type: TransactionType;
  particulars: string;
  partyId?: string;
  partyName?: string;
  accountId?: string;
  toAccountId?: string; // for transfers
  paymentMethod: AccountType | "credit";
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  cogsAmount?: number; // Cost of goods sold for sales
  notes?: string;
  source: TransactionSource;
  status: TransactionStatus;
  reversedById?: string;
  reversesId?: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  bookId: string;
  transactionId: string;
  date: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export type StockUnit =
  | "kg"
  | "gram"
  | "meter"
  | "yard"
  | "piece"
  | "bag"
  | "carton"
  | "roll";

export interface InventoryProduct {
  id: string;
  bookId: string;
  name: string;
  sku: string;
  category: string;
  unit: StockUnit;
  quantity: number;
  lowStockThreshold: number;
  purchaseCost: number; // weighted average cost
  sellingPrice: number;
  status: "active" | "archived";
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  bookId: string;
  productId: string;
  productName: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  unitCost: number;
  reason: string;
  transactionId?: string;
  date: string;
}

export interface LoanRecord {
  id: string;
  bookId: string;
  direction: "borrowed" | "lent";
  counterpartyName: string;
  partyId?: string;
  principalAmount: number;
  repaidAmount: number;
  outstandingAmount: number;
  dueDate?: string;
  status: "active" | "settled";
  createdAt: string;
}

export interface Employee {
  id: string;
  bookId: string;
  name: string;
  role: string;
  phone: string;
  monthlySalary: number;
  advanceBalance: number;
  status: "active" | "inactive";
}

export interface SalaryRecord {
  id: string;
  bookId: string;
  employeeId: string;
  employeeName: string;
  type: "salary" | "advance";
  amount: number;
  month: string;
  date: string;
  transactionId: string;
}

export interface AssetRecord {
  id: string;
  bookId: string;
  name: string;
  category: string;
  purchaseValue: number;
  currentValue: number;
  purchaseDate: string;
  transactionId?: string;
}

export type DocumentCategory = "invoice" | "bill" | "receipt" | "voucher" | "report" | "other";

export interface DocumentRecord {
  id: string;
  bookId: string;
  title: string;
  category: DocumentCategory;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl?: string;
  transactionId?: string;
  transactionSerial?: string;
  date: string;
  createdAt: string;
}

export type ChatCardType =
  | "draft_transaction"
  | "saved_transaction"
  | "khata_statement"
  | "inventory_summary"
  | "business_summary"
  | "reversal_confirmation"
  | "subscription_plan"
  | "payment_instructions"
  | "downloadable_document"
  | "chhotu_placeholder"
  | "error_card";

export interface InteractiveOption {
  id: string;
  messageId: string;
  label: string;
  variant: "primary" | "secondary" | "danger";
  actionType: string;
  payload: Record<string, unknown>;
  consumed?: boolean;
}

export interface ChatAttachment {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl?: string;
  kind: "image" | "document" | "audio";
  durationSec?: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  bookId: string;
  clientMessageId: string;
  sender: "user" | "munshi";
  text: string;
  timestamp: string;
  status: "sending" | "sent" | "failed";
  source: "web" | "voice_simulated" | "ocr_simulated" | "whatsapp_demo";
  attachments?: ChatAttachment[];
  card?: {
    type: ChatCardType;
    data: Record<string, unknown>;
  };
  options?: InteractiveOption[];
}

export interface Conversation {
  id: string;
  bookId: string;
  title: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  bookId: string;
  title: string;
  message: string;
  type: "low_stock" | "khata_due" | "transaction" | "system";
  read: boolean;
  href?: string;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  pricePKR: number;
  interval: "monthly" | "yearly";
  features: string[];
  recommended?: boolean;
}

export interface BillingHistoryItem {
  id: string;
  date: string;
  planName: string;
  amountPKR: number;
  status: "paid" | "pending";
  invoiceNo: string;
}

export interface UserPreferences {
  id: string;
  locale: Locale;
  theme: ThemeMode;
  sidebarCollapsed: boolean;
  onboardingCompleted: boolean;
  activeBookId: string;
  notifications: {
    paymentReminders: boolean;
    lowStock: boolean;
    transactions: boolean;
    reports: boolean;
  };
}
