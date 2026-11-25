import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, "Enter a valid Pakistani phone number (+92...) or email"),
});

export const otpSchema = z.object({
  code: z
    .string()
    .length(6, "Enter the 6-digit verification code")
    .regex(/^\d{6}$/, "OTP must contain 6 digits"),
});

export const bookSchema = z.object({
  name: z.string().min(2, "Book name is required"),
  businessType: z.string().min(2, "Business type is required"),
  openingCash: z.coerce.number().min(0, "Opening cash cannot be negative"),
  openingBank: z.coerce.number().min(0, "Opening bank cannot be negative"),
});

export const khataSchema = z.object({
  name: z.string().min(2, "Party name is required"),
  type: z.enum(["customer", "supplier", "other"]),
  phone: z.string().min(7, "Valid phone number is required"),
  address: z.string().optional().default(""),
  openingBalance: z.coerce.number().min(0, "Opening balance cannot be negative"),
  openingDirection: z.enum(["receivable", "payable"]),
  notes: z.string().optional().default(""),
});

export const transactionLineItemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1, "Item name is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unit: z.string().min(1),
  rate: z.coerce.number().min(0, "Rate cannot be negative"),
  discount: z.coerce.number().min(0).default(0),
});

export const transactionSchema = z.object({
  date: z.string().min(1, "Date is required"),
  type: z.string().min(1, "Transaction type is required"),
  particulars: z.string().min(2, "Description is required"),
  partyId: z.string().optional(),
  accountId: z.string().optional(),
  toAccountId: z.string().optional(),
  paymentMethod: z.enum(["cash", "bank", "jazzcash", "easypaisa", "wallet", "credit"]),
  totalAmount: z.coerce.number().positive("Amount must be greater than 0"),
  paidAmount: z.coerce.number().min(0),
  notes: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  sku: z.string().min(2, "SKU is required"),
  category: z.string().min(2, "Category is required"),
  unit: z.enum(["kg", "gram", "meter", "yard", "piece", "bag", "carton", "roll"]),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  lowStockThreshold: z.coerce.number().min(0),
  purchaseCost: z.coerce.number().min(0, "Cost cannot be negative"),
  sellingPrice: z.coerce.number().min(0, "Selling price cannot be negative"),
});

export const accountSchema = z.object({
  name: z.string().min(2, "Account name is required"),
  type: z.enum(["cash", "bank", "jazzcash", "easypaisa", "wallet"]),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  openingBalance: z.coerce.number().min(0),
});

export const loanSchema = z.object({
  direction: z.enum(["borrowed", "lent"]),
  counterpartyName: z.string().min(2, "Counterparty name is required"),
  principalAmount: z.coerce.number().positive("Amount must be greater than 0"),
  dueDate: z.string().optional(),
});
