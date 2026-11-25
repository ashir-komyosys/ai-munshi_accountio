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
  SubscriptionPlan,
  Transaction,
  TransactionLineItem,
  User,
} from "@/types";

export const DEMO_USERS: User[] = [
  {
    id: "user_owner",
    name: "Haji Muhammad Ashir",
    phone: "+92 300 8664123",
    email: "owner@almadinayarn.pk",
    role: "owner",
    whatsappLinked: true,
    whatsappNumber: "+92 300 8664123",
    createdAt: "2026-01-01T08:00:00.000Z",
  },
  {
    id: "user_munshi",
    name: "Tariq Mahmood (Munshi)",
    phone: "+92 321 7742910",
    email: "tariq@almadinayarn.pk",
    role: "accountant",
    whatsappLinked: false,
    createdAt: "2026-02-15T09:00:00.000Z",
  },
  {
    id: "user_staff",
    name: "Hamza Raza",
    phone: "+92 333 6511204",
    email: "hamza@almadinayarn.pk",
    role: "staff",
    whatsappLinked: false,
    createdAt: "2026-03-10T10:00:00.000Z",
  },
];

export const DEMO_BUSINESS: Business = {
  id: "biz_al_madina",
  name: "Al Madina Yarn Traders",
  type: "Yarn & Cloth Trading",
  address: "Chiniot Bazar, Faisalabad, Pakistan",
  city: "Faisalabad",
  currency: "PKR",
  financialYear: "Jan – Dec",
  ownerId: "user_owner",
};

export const DEMO_BOOKS: Book[] = [
  {
    id: "book_al_madina",
    businessId: "biz_al_madina",
    name: "Al Madina Yarn Traders",
    businessType: "Yarn & Cloth Trading",
    currency: "PKR",
    status: "active",
    openingCash: 450000,
    openingBank: 1850000,
    lastActivityAt: "2026-11-24T17:30:00.000Z",
    createdAt: "2026-01-01T08:00:00.000Z",
  },
  {
    id: "book_madina_retail",
    businessId: "biz_al_madina",
    name: "Madina Retail Store",
    businessType: "Retail Sales",
    currency: "PKR",
    status: "active",
    openingCash: 120000,
    openingBank: 480000,
    lastActivityAt: "2026-11-20T15:10:00.000Z",
    createdAt: "2026-03-01T08:00:00.000Z",
  },
  {
    id: "book_personal",
    businessId: "biz_al_madina",
    name: "Personal Khata",
    businessType: "Personal / Other",
    currency: "PKR",
    status: "archived",
    openingCash: 50000,
    openingBank: 200000,
    lastActivityAt: "2026-11-10T12:00:00.000Z",
    createdAt: "2026-04-01T08:00:00.000Z",
  },
];

const CUSTOMER_NAMES = [
  "Ibrahim Traders",
  "Rehman & Sons",
  "Madina Fabrics",
  "Faisalabad Looms",
  "Chiniot Cloth House",
  "Sitara Weaving Mills",
  "Al-Noor Garments",
  "Lyallpur Textiles",
  "Bismillah Boutique",
  "Pakpattan Yarn Mart",
  "Jhang Cloth Center",
  "Sargodha Wholesale",
  "Multan Cotton House",
  "Gujranwala Fabrics",
  "Lahore Liberty Silks",
  "Karachi Saddar Traders",
];

const SUPPLIER_NAMES = [
  "Ali Traders",
  "Saeed Textiles",
  "Bilal Suppliers",
  "Chenab Spinning Mills",
  "Nishat Yarn Agency",
  "Crescent Fiber Co.",
  "Kohinoor Dyeing",
  "Ravi Packaging",
  "Indus Cotton Ginners",
  "Punjab Chemical Works",
  "Gohar Thread Mills",
];

const OTHER_PARTIES = ["FESCO Electricity", "Al-Fatah Transport"];

export function buildSeedParties(): Party[] {
  const parties: Party[] = [];
  CUSTOMER_NAMES.forEach((name, idx) => {
    const bal = idx === 0 ? 350000 : idx === 1 ? 220000 : 45000 + ((idx * 27500) % 280000);
    parties.push({
      id: `party_cust_${idx + 1}`,
      bookId: "book_al_madina",
      name,
      type: "customer",
      phone: `+92 30${idx % 9} ${4100000 + idx * 12345}`,
      address: `${idx + 12} Yarn Market, Faisalabad`,
      openingBalance: bal,
      openingDirection: "receivable",
      currentBalance: bal,
      notes: "Regular wholesale customer",
      createdAt: "2026-01-05T09:00:00.000Z",
      updatedAt: "2026-11-24T14:00:00.000Z",
    });
  });

  SUPPLIER_NAMES.forEach((name, idx) => {
    const bal = idx === 0 ? -100000 : idx === 1 ? -75000 : -(35000 + ((idx * 19500) % 190000));
    parties.push({
      id: `party_supp_${idx + 1}`,
      bookId: "book_al_madina",
      name,
      type: "supplier",
      phone: `+92 32${idx % 9} ${7100000 + idx * 11223}`,
      address: `Plot ${idx + 5}, Mill Area, Faisalabad`,
      openingBalance: Math.abs(bal),
      openingDirection: "payable",
      currentBalance: bal,
      notes: "Primary yarn & fabric supplier",
      createdAt: "2026-01-05T09:00:00.000Z",
      updatedAt: "2026-11-24T14:00:00.000Z",
    });
  });

  OTHER_PARTIES.forEach((name, idx) => {
    parties.push({
      id: `party_other_${idx + 1}`,
      bookId: "book_al_madina",
      name,
      type: "other",
      phone: `+92 41 854${100 + idx}`,
      address: "Faisalabad",
      openingBalance: 0,
      openingDirection: "payable",
      currentBalance: idx === 1 ? -12000 : 0,
      createdAt: "2026-01-10T09:00:00.000Z",
      updatedAt: "2026-11-20T09:00:00.000Z",
    });
  });

  // Isolated book 2 parties
  parties.push(
    {
      id: "party_r_1",
      bookId: "book_madina_retail",
      name: "Walk-in Retail Customers",
      type: "customer",
      phone: "+92 300 1112233",
      address: "D-Ground, Faisalabad",
      openingBalance: 45000,
      openingDirection: "receivable",
      currentBalance: 45000,
      createdAt: "2026-03-02T09:00:00.000Z",
      updatedAt: "2026-11-20T09:00:00.000Z",
    },
    {
      id: "party_r_2",
      bookId: "book_madina_retail",
      name: "Gulberg Garment Distributors",
      type: "supplier",
      phone: "+92 321 4455667",
      address: "Lahore",
      openingBalance: 65000,
      openingDirection: "payable",
      currentBalance: -65000,
      createdAt: "2026-03-02T09:00:00.000Z",
      updatedAt: "2026-11-20T09:00:00.000Z",
    }
  );

  return parties;
}

export const DEMO_ACCOUNTS: CashBankAccount[] = [
  {
    id: "acc_cash",
    bookId: "book_al_madina",
    name: "Cash in Hand (Galla)",
    type: "cash",
    openingBalance: 450000,
    currentBalance: 685000,
    isDefault: true,
    createdAt: "2026-01-01T08:00:00.000Z",
  },
  {
    id: "acc_meezan",
    bookId: "book_al_madina",
    name: "Meezan Bank - Chiniot Bazar",
    type: "bank",
    bankName: "Meezan Bank Limited",
    accountNumber: "0412-0105982311",
    openingBalance: 1850000,
    currentBalance: 2340000,
    createdAt: "2026-01-01T08:00:00.000Z",
  },
  {
    id: "acc_jazzcash",
    bookId: "book_al_madina",
    name: "JazzCash Business",
    type: "jazzcash",
    accountNumber: "0300-8664123",
    openingBalance: 85000,
    currentBalance: 142000,
    createdAt: "2026-01-15T08:00:00.000Z",
  },
  {
    id: "acc_easypaisa",
    bookId: "book_al_madina",
    name: "Easypaisa Merchant",
    type: "easypaisa",
    accountNumber: "0345-8664123",
    openingBalance: 60000,
    currentBalance: 98000,
    createdAt: "2026-02-01T08:00:00.000Z",
  },
  {
    id: "acc_retail_cash",
    bookId: "book_madina_retail",
    name: "Retail Counter Cash",
    type: "cash",
    openingBalance: 120000,
    currentBalance: 165000,
    isDefault: true,
    createdAt: "2026-03-01T08:00:00.000Z",
  },
  {
    id: "acc_retail_hbl",
    bookId: "book_madina_retail",
    name: "HBL Retail Account",
    type: "bank",
    bankName: "Habib Bank Limited",
    accountNumber: "1122-7901452201",
    openingBalance: 480000,
    currentBalance: 535000,
    createdAt: "2026-03-01T08:00:00.000Z",
  },
];

const PRODUCT_CATALOG: Array<{
  name: string;
  sku: string;
  category: string;
  unit: InventoryProduct["unit"];
  qty: number;
  threshold: number;
  cost: number;
  price: number;
}> = [
  { name: "Cotton Yarn 40s", sku: "YRN-C40", category: "Yarn", unit: "kg", qty: 1250, threshold: 200, cost: 2800, price: 3250 },
  { name: "Polyester Yarn 30s", sku: "YRN-P30", category: "Yarn", unit: "kg", qty: 850, threshold: 150, cost: 2350, price: 2750 },
  { name: "Linen Cloth", sku: "CLT-LIN", category: "Cloth", unit: "meter", qty: 320, threshold: 100, cost: 3800, price: 4400 },
  { name: "Cotton Yarn 30s", sku: "YRN-C30", category: "Yarn", unit: "kg", qty: 920, threshold: 200, cost: 2600, price: 3000 },
  { name: "Cotton Fabric Unbleached", sku: "FAB-CTN", category: "Fabric", unit: "meter", qty: 1400, threshold: 250, cost: 420, price: 510 },
  { name: "Denim Fabric 12oz", sku: "FAB-DNM", category: "Fabric", unit: "meter", qty: 480, threshold: 120, cost: 890, price: 1080 },
  { name: "Packing Bags (PP Woven)", sku: "PKG-BAG", category: "Packaging", unit: "bag", qty: 45, threshold: 100, cost: 180, price: 230 },
  { name: "Combed Cotton 60s", sku: "YRN-CC60", category: "Yarn", unit: "kg", qty: 340, threshold: 100, cost: 3400, price: 3950 },
  { name: "Viscose Yarn 30s", sku: "YRN-V30", category: "Yarn", unit: "kg", qty: 610, threshold: 150, cost: 2450, price: 2850 },
  { name: "PC Yarn 20s", sku: "YRN-PC20", category: "Yarn", unit: "kg", qty: 780, threshold: 150, cost: 2150, price: 2550 },
  { name: "Lawn Fabric Printed", sku: "FAB-LWN", category: "Fabric", unit: "meter", qty: 950, threshold: 200, cost: 540, price: 680 },
  { name: "Karandi Winter Cloth", sku: "CLT-KRN", category: "Cloth", unit: "meter", qty: 290, threshold: 80, cost: 1250, price: 1550 },
  { name: "Khaddar Unstitched", sku: "CLT-KHD", category: "Cloth", unit: "meter", qty: 540, threshold: 120, cost: 980, price: 1220 },
  { name: "Boski Silk Roll", sku: "CLT-BSK", category: "Cloth", unit: "roll", qty: 18, threshold: 25, cost: 18500, price: 22000 },
  { name: "Washing & Bleaching Roll", sku: "FAB-WSH", category: "Fabric", unit: "roll", qty: 64, threshold: 20, cost: 14200, price: 16800 },
  { name: "Cone Packing Cartons", sku: "PKG-CTN", category: "Packaging", unit: "carton", qty: 210, threshold: 50, cost: 420, price: 520 },
  { name: "Polyester Thread Cones", sku: "THR-PLY", category: "Thread", unit: "piece", qty: 1800, threshold: 400, cost: 190, price: 240 },
  { name: "Mercerized Cotton 50s", sku: "YRN-MC50", category: "Yarn", unit: "kg", qty: 190, threshold: 100, cost: 3650, price: 4200 },
  { name: "Slub Yarn 16s", sku: "YRN-SL16", category: "Yarn", unit: "kg", qty: 410, threshold: 100, cost: 2250, price: 2650 },
  { name: "Lycra Stretch Yarn", sku: "YRN-LYC", category: "Yarn", unit: "kg", qty: 22, threshold: 50, cost: 4900, price: 5600 },
  { name: "Twill Cotton Fabric", sku: "FAB-TWL", category: "Fabric", unit: "meter", qty: 620, threshold: 150, cost: 680, price: 820 },
  { name: "Poplin Shirting", sku: "FAB-POP", category: "Fabric", unit: "meter", qty: 740, threshold: 150, cost: 510, price: 620 },
  { name: "Canvas Heavy 16oz", sku: "FAB-CNV", category: "Fabric", unit: "yard", qty: 380, threshold: 80, cost: 920, price: 1120 },
  { name: "Stretch Tape & Baling", sku: "PKG-STR", category: "Packaging", unit: "roll", qty: 95, threshold: 30, cost: 650, price: 800 },
  { name: "Dyed Cotton Yarn 24s", sku: "YRN-DC24", category: "Yarn", unit: "kg", qty: 530, threshold: 120, cost: 2950, price: 3450 },
  { name: "Terry Towel Cloth", sku: "CLT-TRY", category: "Cloth", unit: "kg", qty: 0, threshold: 50, cost: 1950, price: 2350 },
];

export function buildSeedProducts(): InventoryProduct[] {
  const list: InventoryProduct[] = PRODUCT_CATALOG.map((p, idx) => ({
    id: `prod_${idx + 1}`,
    bookId: "book_al_madina",
    name: p.name,
    sku: p.sku,
    category: p.category,
    unit: p.unit,
    quantity: p.qty,
    lowStockThreshold: p.threshold,
    purchaseCost: p.cost,
    sellingPrice: p.price,
    status: "active",
    updatedAt: "2026-11-24T12:00:00.000Z",
  }));

  list.push(
    {
      id: "prod_r_1",
      bookId: "book_madina_retail",
      name: "Stitched Cotton Suit (3-Piece)",
      sku: "RTL-ST3",
      category: "Apparel",
      unit: "piece",
      quantity: 115,
      lowStockThreshold: 25,
      purchaseCost: 2400,
      sellingPrice: 3400,
      status: "active",
      updatedAt: "2026-11-20T12:00:00.000Z",
    },
    {
      id: "prod_r_2",
      bookId: "book_madina_retail",
      name: "Unstitched Lawn Suit",
      sku: "RTL-LWN",
      category: "Apparel",
      unit: "piece",
      quantity: 190,
      lowStockThreshold: 30,
      purchaseCost: 1850,
      sellingPrice: 2650,
      status: "active",
      updatedAt: "2026-11-20T12:00:00.000Z",
    }
  );
  return list;
}

export function buildSeedTransactions(parties: Party[], products: InventoryProduct[]): {
  transactions: Transaction[];
  lineItems: TransactionLineItem[];
  journalEntries: JournalEntry[];
} {
  const transactions: Transaction[] = [];
  const lineItems: TransactionLineItem[] = [];
  const journalEntries: JournalEntry[] = [];

  const customers = parties.filter((p) => p.bookId === "book_al_madina" && p.type === "customer");
  const suppliers = parties.filter((p) => p.bookId === "book_al_madina" && p.type === "supplier");
  const book1Products = products.filter((p) => p.bookId === "book_al_madina");

  // Highlighted top recent entries matching reference screenshot
  const featured: Transaction[] = [
    {
      id: "tx_feat_1",
      bookId: "book_al_madina",
      serial: "NOV-000428",
      date: "2026-11-24",
      type: "credit_sale",
      particulars: "Sale to Ibrahim Traders (Udhaar)",
      partyId: "party_cust_1",
      partyName: "Ibrahim Traders",
      accountId: "acc_cash",
      paymentMethod: "credit",
      totalAmount: 350000,
      paidAmount: 0,
      outstandingAmount: 350000,
      cogsAmount: 270000,
      source: "web",
      status: "posted",
      createdAt: "2026-11-24T16:20:00.000Z",
    },
    {
      id: "tx_feat_2",
      bookId: "book_al_madina",
      serial: "NOV-000427",
      date: "2026-11-24",
      type: "partial_purchase",
      particulars: "Purchase from Ali Traders (Yarn Mixed)",
      partyId: "party_supp_1",
      partyName: "Ali Traders",
      accountId: "acc_cash",
      paymentMethod: "cash",
      totalAmount: 150000,
      paidAmount: 50000,
      outstandingAmount: 100000,
      source: "ai_munshi",
      status: "posted",
      createdAt: "2026-11-24T11:22:00.000Z",
    },
    {
      id: "tx_feat_3",
      bookId: "book_al_madina",
      serial: "NOV-000426",
      date: "2026-11-23",
      type: "expense",
      particulars: "Transport Expense (Bilty & Freight)",
      accountId: "acc_cash",
      paymentMethod: "cash",
      totalAmount: 5000,
      paidAmount: 5000,
      outstandingAmount: 0,
      source: "web",
      status: "posted",
      createdAt: "2026-11-23T15:10:00.000Z",
    },
    {
      id: "tx_feat_4",
      bookId: "book_al_madina",
      serial: "NOV-000425",
      date: "2026-11-23",
      type: "customer_receipt",
      particulars: "Received from Rehman & Sons",
      partyId: "party_cust_2",
      partyName: "Rehman & Sons",
      accountId: "acc_meezan",
      paymentMethod: "bank",
      totalAmount: 200000,
      paidAmount: 200000,
      outstandingAmount: 0,
      source: "whatsapp_demo",
      status: "posted",
      createdAt: "2026-11-23T11:45:00.000Z",
    },
  ];

  transactions.push(...featured);

  // Generate 152 additional realistic transactions (total 156+ for book_al_madina) across Sep-Nov 2026
  const expenseLabels = [
    "Shop Rent — Chiniot Bazar",
    "FESCO Electricity Bill",
    "Tea, Hospitality & Bazaar Misc",
    "Loader & Mazdoori Charges",
    "Packaging & Baling Material",
    "Generator Diesel",
  ];

  for (let i = 1; i <= 152; i++) {
    const dayOffset = i % 80;
    const d = new Date("2026-11-22T10:00:00.000Z");
    d.setDate(d.getDate() - dayOffset);
    const isoDate = d.toISOString().slice(0, 10);
    const serial = `NOV-${String(424 - i).padStart(6, "0")}`;
    const id = `tx_seed_${i}`;

    const mod = i % 6;
    if (mod === 0 || mod === 1) {
      // Sale
      const cust = customers[i % customers.length];
      const prod = book1Products[i % book1Products.length];
      const qty = 20 + (i % 45);
      const total = qty * prod.sellingPrice;
      const cogs = qty * prod.purchaseCost;
      const isCash = mod === 0;
      const paid = isCash ? total : Math.round(total * 0.5);
      transactions.push({
        id,
        bookId: "book_al_madina",
        serial,
        date: isoDate,
        type: isCash ? "cash_sale" : "partial_sale",
        particulars: `${isCash ? "Cash Sale" : "Sale"} — ${cust.name} (${prod.name})`,
        partyId: cust.id,
        partyName: cust.name,
        accountId: i % 3 === 0 ? "acc_meezan" : "acc_cash",
        paymentMethod: i % 3 === 0 ? "bank" : "cash",
        totalAmount: total,
        paidAmount: paid,
        outstandingAmount: total - paid,
        cogsAmount: cogs,
        source: "seed",
        status: "posted",
        createdAt: d.toISOString(),
      });
      lineItems.push({
        id: `li_${i}`,
        transactionId: id,
        productId: prod.id,
        productName: prod.name,
        quantity: qty,
        unit: prod.unit,
        rate: prod.sellingPrice,
        discount: 0,
        total,
      });
    } else if (mod === 2) {
      // Purchase
      const supp = suppliers[i % suppliers.length];
      const prod = book1Products[(i + 3) % book1Products.length];
      const qty = 25 + (i % 35);
      const total = qty * prod.purchaseCost;
      const paid = Math.round(total * 0.4);
      transactions.push({
        id,
        bookId: "book_al_madina",
        serial,
        date: isoDate,
        type: "partial_purchase",
        particulars: `Purchase — ${supp.name} (${prod.name})`,
        partyId: supp.id,
        partyName: supp.name,
        accountId: "acc_meezan",
        paymentMethod: "bank",
        totalAmount: total,
        paidAmount: paid,
        outstandingAmount: total - paid,
        source: "seed",
        status: "posted",
        createdAt: d.toISOString(),
      });
      lineItems.push({
        id: `li_${i}`,
        transactionId: id,
        productId: prod.id,
        productName: prod.name,
        quantity: qty,
        unit: prod.unit,
        rate: prod.purchaseCost,
        discount: 0,
        total,
      });
    } else if (mod === 3) {
      // Customer Receipt
      const cust = customers[(i + 2) % customers.length];
      const amount = 25000 + (i % 8) * 10000;
      transactions.push({
        id,
        bookId: "book_al_madina",
        serial,
        date: isoDate,
        type: "customer_receipt",
        particulars: `Raqam Wasool — ${cust.name}`,
        partyId: cust.id,
        partyName: cust.name,
        accountId: i % 2 === 0 ? "acc_jazzcash" : "acc_cash",
        paymentMethod: i % 2 === 0 ? "jazzcash" : "cash",
        totalAmount: amount,
        paidAmount: amount,
        outstandingAmount: 0,
        source: "seed",
        status: "posted",
        createdAt: d.toISOString(),
      });
    } else if (mod === 4) {
      // Supplier Payment
      const supp = suppliers[(i + 1) % suppliers.length];
      const amount = 20000 + (i % 6) * 12000;
      transactions.push({
        id,
        bookId: "book_al_madina",
        serial,
        date: isoDate,
        type: "supplier_payment",
        particulars: `Payment to ${supp.name}`,
        partyId: supp.id,
        partyName: supp.name,
        accountId: "acc_meezan",
        paymentMethod: "bank",
        totalAmount: amount,
        paidAmount: amount,
        outstandingAmount: 0,
        source: "seed",
        status: "posted",
        createdAt: d.toISOString(),
      });
    } else {
      // Expense
      const label = expenseLabels[i % expenseLabels.length];
      const amount = 3500 + (i % 10) * 1500;
      transactions.push({
        id,
        bookId: "book_al_madina",
        serial,
        date: isoDate,
        type: "expense",
        particulars: label,
        accountId: "acc_cash",
        paymentMethod: "cash",
        totalAmount: amount,
        paidAmount: amount,
        outstandingAmount: 0,
        source: "seed",
        status: "posted",
        createdAt: d.toISOString(),
      });
    }
  }

  // Book 2 sample transactions
  transactions.push(
    {
      id: "tx_r_1",
      bookId: "book_madina_retail",
      serial: "RTL-000101",
      date: "2026-11-20",
      type: "cash_sale",
      particulars: "Retail Counter Daily Sales (18 Suits)",
      partyId: "party_r_1",
      partyName: "Walk-in Retail Customers",
      accountId: "acc_retail_cash",
      paymentMethod: "cash",
      totalAmount: 61200,
      paidAmount: 61200,
      outstandingAmount: 0,
      cogsAmount: 43200,
      source: "web",
      status: "posted",
      createdAt: "2026-11-20T18:00:00.000Z",
    },
    {
      id: "tx_r_2",
      bookId: "book_madina_retail",
      serial: "RTL-000102",
      date: "2026-11-18",
      type: "expense",
      particulars: "Showroom Electricity & AC",
      accountId: "acc_retail_hbl",
      paymentMethod: "bank",
      totalAmount: 14500,
      paidAmount: 14500,
      outstandingAmount: 0,
      source: "web",
      status: "posted",
      createdAt: "2026-11-18T14:00:00.000Z",
    }
  );

  // Build balanced double-entry journal lines for every transaction
  for (const tx of transactions) {
    if (tx.type.includes("sale")) {
      if (tx.paidAmount > 0) {
        journalEntries.push({
          id: `je_${tx.id}_1`,
          bookId: tx.bookId,
          transactionId: tx.id,
          date: tx.date,
          accountCode: "1010",
          accountName: "Cash & Bank",
          debit: tx.paidAmount,
          credit: 0,
        });
      }
      if (tx.outstandingAmount > 0) {
        journalEntries.push({
          id: `je_${tx.id}_2`,
          bookId: tx.bookId,
          transactionId: tx.id,
          date: tx.date,
          accountCode: "1100",
          accountName: "Accounts Receivable",
          debit: tx.outstandingAmount,
          credit: 0,
        });
      }
      journalEntries.push({
        id: `je_${tx.id}_3`,
        bookId: tx.bookId,
        transactionId: tx.id,
        date: tx.date,
        accountCode: "4000",
        accountName: "Sales Revenue",
        debit: 0,
        credit: tx.totalAmount,
      });
      if (tx.cogsAmount && tx.cogsAmount > 0) {
        journalEntries.push(
          {
            id: `je_${tx.id}_4`,
            bookId: tx.bookId,
            transactionId: tx.id,
            date: tx.date,
            accountCode: "5000",
            accountName: "Cost of Goods Sold",
            debit: tx.cogsAmount,
            credit: 0,
          },
          {
            id: `je_${tx.id}_5`,
            bookId: tx.bookId,
            transactionId: tx.id,
            date: tx.date,
            accountCode: "1200",
            accountName: "Inventory Stock",
            debit: 0,
            credit: tx.cogsAmount,
          }
        );
      }
    } else if (tx.type.includes("purchase")) {
      journalEntries.push({
        id: `je_${tx.id}_1`,
        bookId: tx.bookId,
        transactionId: tx.id,
        date: tx.date,
        accountCode: "1200",
        accountName: "Inventory Stock",
        debit: tx.totalAmount,
        credit: 0,
      });
      if (tx.paidAmount > 0) {
        journalEntries.push({
          id: `je_${tx.id}_2`,
          bookId: tx.bookId,
          transactionId: tx.id,
          date: tx.date,
          accountCode: "1010",
          accountName: "Cash & Bank",
          debit: 0,
          credit: tx.paidAmount,
        });
      }
      if (tx.outstandingAmount > 0) {
        journalEntries.push({
          id: `je_${tx.id}_3`,
          bookId: tx.bookId,
          transactionId: tx.id,
          date: tx.date,
          accountCode: "2000",
          accountName: "Accounts Payable",
          debit: 0,
          credit: tx.outstandingAmount,
        });
      }
    } else if (tx.type === "expense") {
      journalEntries.push(
        {
          id: `je_${tx.id}_1`,
          bookId: tx.bookId,
          transactionId: tx.id,
          date: tx.date,
          accountCode: "5200",
          accountName: "Operating Expenses",
          debit: tx.totalAmount,
          credit: 0,
        },
        {
          id: `je_${tx.id}_2`,
          bookId: tx.bookId,
          transactionId: tx.id,
          date: tx.date,
          accountCode: "1010",
          accountName: "Cash & Bank",
          debit: 0,
          credit: tx.totalAmount,
        }
      );
    } else if (tx.type === "customer_receipt") {
      journalEntries.push(
        {
          id: `je_${tx.id}_1`,
          bookId: tx.bookId,
          transactionId: tx.id,
          date: tx.date,
          accountCode: "1010",
          accountName: "Cash & Bank",
          debit: tx.totalAmount,
          credit: 0,
        },
        {
          id: `je_${tx.id}_2`,
          bookId: tx.bookId,
          transactionId: tx.id,
          date: tx.date,
          accountCode: "1100",
          accountName: "Accounts Receivable",
          debit: 0,
          credit: tx.totalAmount,
        }
      );
    } else if (tx.type === "supplier_payment") {
      journalEntries.push(
        {
          id: `je_${tx.id}_1`,
          bookId: tx.bookId,
          transactionId: tx.id,
          date: tx.date,
          accountCode: "2000",
          accountName: "Accounts Payable",
          debit: tx.totalAmount,
          credit: 0,
        },
        {
          id: `je_${tx.id}_2`,
          bookId: tx.bookId,
          transactionId: tx.id,
          date: tx.date,
          accountCode: "1010",
          accountName: "Cash & Bank",
          debit: 0,
          credit: tx.totalAmount,
        }
      );
    }
  }

  return { transactions, lineItems, journalEntries };
}

export const DEMO_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: "sm_1",
    bookId: "book_al_madina",
    productId: "prod_1",
    productName: "Cotton Yarn 40s",
    type: "in",
    quantity: 300,
    unitCost: 2800,
    reason: "Purchase from Ali Traders (NOV-000427)",
    transactionId: "tx_feat_2",
    date: "2026-11-24",
  },
  {
    id: "sm_2",
    bookId: "book_al_madina",
    productId: "prod_3",
    productName: "Linen Cloth",
    type: "out",
    quantity: 80,
    unitCost: 3800,
    reason: "Sale to Ibrahim Traders (NOV-000428)",
    transactionId: "tx_feat_1",
    date: "2026-11-24",
  },
];

export const DEMO_LOANS: LoanRecord[] = [
  {
    id: "loan_1",
    bookId: "book_al_madina",
    direction: "borrowed",
    counterpartyName: "Haji Kareem Financing",
    principalAmount: 500000,
    repaidAmount: 200000,
    outstandingAmount: 300000,
    dueDate: "2026-12-30",
    status: "active",
    createdAt: "2026-08-01T10:00:00.000Z",
  },
  {
    id: "loan_2",
    bookId: "book_al_madina",
    direction: "lent",
    counterpartyName: "Chiniot Looms Partner",
    principalAmount: 150000,
    repaidAmount: 50000,
    outstandingAmount: 100000,
    dueDate: "2026-12-15",
    status: "active",
    createdAt: "2026-09-12T10:00:00.000Z",
  },
];

export const DEMO_EMPLOYEES: Employee[] = [
  {
    id: "emp_1",
    bookId: "book_al_madina",
    name: "Tariq Mahmood",
    role: "Senior Munshi",
    phone: "+92 321 7742910",
    monthlySalary: 65000,
    advanceBalance: 10000,
    status: "active",
  },
  {
    id: "emp_2",
    bookId: "book_al_madina",
    name: "Hamza Raza",
    role: "Godown Supervisor",
    phone: "+92 333 6511204",
    monthlySalary: 42000,
    advanceBalance: 0,
    status: "active",
  },
  {
    id: "emp_3",
    bookId: "book_al_madina",
    name: "Bilal Ahmed",
    role: "Delivery & Recovery Rider",
    phone: "+92 301 5522889",
    monthlySalary: 32000,
    advanceBalance: 5000,
    status: "active",
  },
];

export const DEMO_SALARIES: SalaryRecord[] = [
  {
    id: "sal_1",
    bookId: "book_al_madina",
    employeeId: "emp_1",
    employeeName: "Tariq Mahmood",
    type: "salary",
    amount: 65000,
    month: "Oct 2026",
    date: "2026-11-01",
    transactionId: "tx_seed_10",
  },
];

export const DEMO_ASSETS: AssetRecord[] = [
  {
    id: "asset_1",
    bookId: "book_al_madina",
    name: "Godown Forklift & Weighing Scale",
    category: "Warehouse Equipment",
    purchaseValue: 480000,
    currentValue: 440000,
    purchaseDate: "2026-02-15",
  },
  {
    id: "asset_2",
    bookId: "book_al_madina",
    name: "Suzuki Pickup (Delivery Van)",
    category: "Vehicles",
    purchaseValue: 1650000,
    currentValue: 1520000,
    purchaseDate: "2026-01-20",
  },
];

export const DEMO_DOCUMENTS: DocumentRecord[] = [
  {
    id: "doc_1",
    bookId: "book_al_madina",
    title: "NOV-000427",
    category: "bill",
    fileName: "NOV-000427-Purchase-Entry.pdf",
    mimeType: "application/pdf",
    sizeBytes: 184200,
    transactionId: "tx_feat_2",
    transactionSerial: "NOV-000427",
    date: "2026-11-24",
    createdAt: "2026-11-24T11:25:00.000Z",
  },
  {
    id: "doc_2",
    bookId: "book_al_madina",
    title: "Sales Report",
    category: "report",
    fileName: "Sales-Report-Nov-2026.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    sizeBytes: 94500,
    date: "2026-11-24",
    createdAt: "2026-11-24T10:00:00.000Z",
  },
  {
    id: "doc_3",
    bookId: "book_al_madina",
    title: "Profit & Loss",
    category: "report",
    fileName: "Profit-Loss-Nov-2026.pdf",
    mimeType: "application/pdf",
    sizeBytes: 122000,
    date: "2026-11-24",
    createdAt: "2026-11-24T09:30:00.000Z",
  },
  {
    id: "doc_4",
    bookId: "book_al_madina",
    title: "Supplier Khata — Ali Traders",
    category: "invoice",
    fileName: "Supplier-Khata-Ali-Traders.pdf",
    mimeType: "application/pdf",
    sizeBytes: 145000,
    date: "2026-11-24",
    createdAt: "2026-11-24T09:15:00.000Z",
  },
  {
    id: "doc_5",
    bookId: "book_al_madina",
    title: "Stock Report",
    category: "report",
    fileName: "Stock-Report-Nov-2026.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    sizeBytes: 88300,
    date: "2026-11-24",
    createdAt: "2026-11-24T09:00:00.000Z",
  },
  {
    id: "doc_6",
    bookId: "book_al_madina",
    title: "Roznamcha",
    category: "voucher",
    fileName: "Roznamcha-23-Nov-2026.pdf",
    mimeType: "application/pdf",
    sizeBytes: 210400,
    date: "2026-11-23",
    createdAt: "2026-11-23T18:00:00.000Z",
  },
];

export const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: "conv_default",
    bookId: "book_al_madina",
    title: "Aaj ka Hisaab — Al Madina Yarn Traders",
    updatedAt: "2026-11-24T11:22:00.000Z",
  },
];

export const DEMO_MESSAGES: ChatMessage[] = [
  {
    id: "msg_1",
    conversationId: "conv_default",
    bookId: "book_al_madina",
    clientMessageId: "cm_seed_1",
    sender: "munshi",
    text: "Assalamualaikum! 👋\nAap ka AI Munshi yahan hai. Kya kaam karna hai?",
    timestamp: "2026-11-24T11:20:00.000Z",
    status: "sent",
    source: "web",
  },
  {
    id: "msg_2",
    conversationId: "conv_default",
    bookId: "book_al_madina",
    clientMessageId: "cm_seed_2",
    sender: "user",
    text: "Ali Traders se 150,000 ka yarn khareeda, 50,000 cash diya, baqi udhaar.",
    timestamp: "2026-11-24T11:21:00.000Z",
    status: "sent",
    source: "web",
  },
  {
    id: "msg_3",
    conversationId: "conv_default",
    bookId: "book_al_madina",
    clientMessageId: "cm_seed_3",
    sender: "munshi",
    text: "Zaroor! Maine purchase tayyar kar diya hai:\nKya main is ke items stock mein bhi daal doon?",
    timestamp: "2026-11-24T11:22:00.000Z",
    status: "sent",
    source: "web",
    card: {
      type: "saved_transaction",
      data: {
        transactionId: "tx_feat_2",
        serial: "NOV-000427",
        date: "24 Nov 2026",
        title: "Purchase (Kharid) — Saved",
        partyName: "Ali Traders",
        itemsSummary: "Yarn (Mixed)",
        totalAmount: 150000,
        paidAmount: 50000,
        outstandingAmount: 100000,
        transactionType: "Purchase Entry",
      },
    },
    options: [
      {
        id: "opt_stock_add_427",
        messageId: "msg_3",
        label: "Haan, Stock mein Daal Do",
        variant: "primary",
        actionType: "ADD_PURCHASE_TO_STOCK",
        payload: { transactionId: "tx_feat_2", productName: "Cotton Yarn 40s", qty: 50 },
      },
      {
        id: "opt_stock_skip_427",
        messageId: "msg_3",
        label: "Nahin, Abhi Nahin",
        variant: "secondary",
        actionType: "DISMISS_PROMPT",
        payload: {},
      },
      {
        id: "opt_view_tx_427",
        messageId: "msg_3",
        label: "Tafseel Dekhein",
        variant: "secondary",
        actionType: "OPEN_TRANSACTION",
        payload: { transactionId: "tx_feat_2" },
      },
    ],
  },
];

export const DEMO_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif_1",
    bookId: "book_al_madina",
    title: "Low Stock Alert: Packing Bags (PP Woven)",
    message: "Only 45 bags remaining (threshold: 100 bags).",
    type: "low_stock",
    read: false,
    href: "/app/inventory",
    createdAt: "2026-11-24T14:00:00.000Z",
  },
  {
    id: "notif_2",
    bookId: "book_al_madina",
    title: "Out of Stock: Terry Towel Cloth",
    message: "Stock reached 0 kg. Consider reordering from supplier.",
    type: "low_stock",
    read: false,
    href: "/app/inventory",
    createdAt: "2026-11-24T12:30:00.000Z",
  },
  {
    id: "notif_3",
    bookId: "book_al_madina",
    title: "Khata Due: Ibrahim Traders",
    message: "PKR 350,000 receivable pending from 24 Nov credit sale.",
    type: "khata_due",
    read: false,
    href: "/app/khatas/party_cust_1",
    createdAt: "2026-11-24T16:25:00.000Z",
  },
  {
    id: "notif_4",
    bookId: "book_al_madina",
    title: "AI Munshi Entry Saved",
    message: "Purchase entry NOV-000427 (Ali Traders) recorded.",
    type: "transaction",
    read: true,
    href: "/app/transactions/tx_feat_2",
    createdAt: "2026-11-24T11:22:00.000Z",
  },
];

export const DEMO_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "plan_starter",
    name: "Starter Munshi (Demo)",
    pricePKR: 0,
    interval: "monthly",
    features: [
      "1 Business Book",
      "Up to 100 Transactions / month",
      "Basic Khata & Roznamcha",
      "Demo Web Access",
    ],
  },
  {
    id: "plan_business",
    name: "Karobar Pro (Demo)",
    pricePKR: 2500,
    interval: "monthly",
    recommended: true,
    features: [
      "Unlimited Business Books",
      "AI Munshi Conversational Entry (Urdu + English)",
      "Full Inventory & Weighted Average Costing",
      "PDF, Excel & CSV Financial Reports",
      "Up to 5 Team Members",
    ],
  },
  {
    id: "plan_enterprise",
    name: "Wholesale & Mills (Demo)",
    pricePKR: 6500,
    interval: "monthly",
    features: [
      "Multi-Branch & Godown Management",
      "Priority WhatsApp AI Munshi Sync (Future)",
      "Unlimited Users & Role Permissions",
      "Dedicated Onboarding Support",
    ],
  },
];

export const DEMO_BILLING_HISTORY: BillingHistoryItem[] = [
  {
    id: "bill_1",
    date: "2026-11-01",
    planName: "Karobar Pro (Demo)",
    amountPKR: 2500,
    status: "paid",
    invoiceNo: "DEMO-INV-2026-11",
  },
  {
    id: "bill_2",
    date: "2026-10-01",
    planName: "Karobar Pro (Demo)",
    amountPKR: 2500,
    status: "paid",
    invoiceNo: "DEMO-INV-2026-10",
  },
];
