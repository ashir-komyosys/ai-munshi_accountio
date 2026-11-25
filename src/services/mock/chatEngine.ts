import { db } from "@/database/db";
import { formatPKR } from "@/lib/money";
import { generateId } from "@/lib/utils";
import type { ChatAttachment, ChatMessage, InteractiveOption } from "@/types";
import { postAtomicTransaction, reverseAtomicTransaction } from "./accountingEngine";

function parseAmount(text: string): number | null {
  const cleaned = text.replace(/,/g, "");
  const match = cleaned.match(/\b(\d{3,9})(?:\s*(?:rs|pkr|rupees|ka|ki))?\b/i);
  return match ? Number(match[1]) : null;
}

export async function processSimulatedMunshiMessage(params: {
  conversationId: string;
  bookId: string;
  text: string;
  source?: ChatMessage["source"];
  attachments?: ChatAttachment[];
}): Promise<ChatMessage> {
  const { conversationId, bookId, text, source = "web", attachments } = params;
  const lower = text.toLowerCase();
  const msgId = generateId("msg");
  const now = new Date().toISOString();

  // Handle simulated OCR / image bill upload
  if (attachments && attachments.some((a) => a.kind === "image" || a.kind === "document")) {
    const file = attachments[0];
    return {
      id: msgId,
      conversationId,
      bookId,
      clientMessageId: generateId("cm"),
      sender: "munshi",
      text: `Maine aap ki file "${file.name}" scan kar li hai (Simulated OCR Demo). Yeh purchase bill lagta hai. Kya main isay record kar loon?`,
      timestamp: now,
      status: "sent",
      source: "ocr_simulated",
      card: {
        type: "draft_transaction",
        data: {
          title: "Purchase Draft (Simulated OCR)",
          txType: "partial_purchase",
          partyName: "Saeed Textiles",
          itemsSummary: "Cotton Yarn 30s (40 kg)",
          totalAmount: 104000,
          paidAmount: 40000,
          outstandingAmount: 64000,
        },
      },
      options: [
        {
          id: generateId("opt"),
          messageId: msgId,
          label: "Confirm & Save Entry",
          variant: "primary",
          actionType: "CONFIRM_DRAFT_TRANSACTION",
          payload: {
            txType: "partial_purchase",
            partyName: "Saeed Textiles",
            particulars: `OCR Bill Purchase — ${file.name}`,
            totalAmount: 104000,
            paidAmount: 40000,
          },
        },
        {
          id: generateId("opt"),
          messageId: msgId,
          label: "Cancel",
          variant: "secondary",
          actionType: "DISMISS_PROMPT",
          payload: {},
        },
      ],
    };
  }

  // Handle simulated Voice note
  if (source === "voice_simulated" || attachments?.some((a) => a.kind === "audio")) {
    return {
      id: msgId,
      conversationId,
      bookId,
      clientMessageId: generateId("cm"),
      sender: "munshi",
      text: `Voice note sun liya (Simulated Transcription Demo): "Ibrahim Traders ko 75,000 ka maal udhaar becha". Kya main yeh sale entry save kar doon?`,
      timestamp: now,
      status: "sent",
      source: "voice_simulated",
      card: {
        type: "draft_transaction",
        data: {
          title: "Credit Sale Draft (Simulated Voice)",
          txType: "credit_sale",
          partyName: "Ibrahim Traders",
          itemsSummary: "Cotton Yarn 40s",
          totalAmount: 75000,
          paidAmount: 0,
          outstandingAmount: 75000,
        },
      },
      options: [
        {
          id: generateId("opt"),
          messageId: msgId,
          label: "Haan, Save Kar Dein",
          variant: "primary",
          actionType: "CONFIRM_DRAFT_TRANSACTION",
          payload: {
            txType: "credit_sale",
            partyName: "Ibrahim Traders",
            particulars: "Voice Sale to Ibrahim Traders (Udhaar)",
            totalAmount: 75000,
            paidAmount: 0,
          },
        },
        {
          id: generateId("opt"),
          messageId: msgId,
          label: "Nahin",
          variant: "secondary",
          actionType: "DISMISS_PROMPT",
          payload: {},
        },
      ],
    };
  }

  // 1. Purchase pattern (Roman Urdu / English)
  if (lower.includes("khareed") || lower.includes("purchase") || lower.includes("kharid")) {
    const numbers = text.replace(/,/g, "").match(/\d{3,9}/g)?.map(Number) ?? [];
    const total = numbers[0] ?? 150000;
    const paid = numbers[1] ?? (lower.includes("udhaar") && !lower.includes("cash") ? 0 : Math.round(total * 0.35));
    const outstanding = Math.max(0, total - paid);
    const parties = await db.parties.where("bookId").equals(bookId).toArray();
    const matchedParty = parties.find((p) => lower.includes(p.name.toLowerCase().split(" ")[0])) ??
      parties.find((p) => p.type === "supplier");

    const draftPartyName = matchedParty?.name ?? "Ali Traders";

    return {
      id: msgId,
      conversationId,
      bookId,
      clientMessageId: generateId("cm"),
      sender: "munshi",
      text: "Zaroor! Maine aap ki purchase entry tayyar kar li hai. Confirm karne par khata aur cash update ho jayega:",
      timestamp: now,
      status: "sent",
      source: "web",
      card: {
        type: "draft_transaction",
        data: {
          title: "Purchase (Kharid) — Draft",
          txType: outstanding === 0 ? "cash_purchase" : paid === 0 ? "credit_purchase" : "partial_purchase",
          partyName: draftPartyName,
          itemsSummary: "Yarn / Cloth Stock",
          totalAmount: total,
          paidAmount: paid,
          outstandingAmount: outstanding,
        },
      },
      options: [
        {
          id: generateId("opt"),
          messageId: msgId,
          label: "Confirm & Save Purchase",
          variant: "primary",
          actionType: "CONFIRM_DRAFT_TRANSACTION",
          payload: {
            txType: outstanding === 0 ? "cash_purchase" : paid === 0 ? "credit_purchase" : "partial_purchase",
            partyId: matchedParty?.id,
            partyName: draftPartyName,
            particulars: `Purchase from ${draftPartyName}`,
            totalAmount: total,
            paidAmount: paid,
          },
        },
        {
          id: generateId("opt"),
          messageId: msgId,
          label: "Cancel",
          variant: "secondary",
          actionType: "DISMISS_PROMPT",
          payload: {},
        },
      ],
    };
  }

  // 2. Sale pattern
  if (lower.includes("bech") || lower.includes("sale") || lower.includes("sold")) {
    const numbers = text.replace(/,/g, "").match(/\d{3,9}/g)?.map(Number) ?? [];
    const total = numbers[0] ?? 120000;
    const paid = numbers[1] ?? (lower.includes("udhaar") ? 0 : total);
    const outstanding = Math.max(0, total - paid);
    const parties = await db.parties.where("bookId").equals(bookId).toArray();
    const matchedParty = parties.find((p) => lower.includes(p.name.toLowerCase().split(" ")[0])) ??
      parties.find((p) => p.type === "customer");
    const partyName = matchedParty?.name ?? "Ibrahim Traders";

    return {
      id: msgId,
      conversationId,
      bookId,
      clientMessageId: generateId("cm"),
      sender: "munshi",
      text: "Bilkul! Maine sale entry ka draft tayyar kar diya hai:",
      timestamp: now,
      status: "sent",
      source: "web",
      card: {
        type: "draft_transaction",
        data: {
          title: "Sale (Bechna) — Draft",
          txType: outstanding === 0 ? "cash_sale" : paid === 0 ? "credit_sale" : "partial_sale",
          partyName,
          itemsSummary: "Cotton Yarn / Cloth",
          totalAmount: total,
          paidAmount: paid,
          outstandingAmount: outstanding,
        },
      },
      options: [
        {
          id: generateId("opt"),
          messageId: msgId,
          label: "Confirm & Save Sale",
          variant: "primary",
          actionType: "CONFIRM_DRAFT_TRANSACTION",
          payload: {
            txType: outstanding === 0 ? "cash_sale" : paid === 0 ? "credit_sale" : "partial_sale",
            partyId: matchedParty?.id,
            partyName,
            particulars: `Sale to ${partyName}`,
            totalAmount: total,
            paidAmount: paid,
          },
        },
        {
          id: generateId("opt"),
          messageId: msgId,
          label: "Cancel",
          variant: "secondary",
          actionType: "DISMISS_PROMPT",
          payload: {},
        },
      ],
    };
  }

  // 3. Expense pattern
  if (lower.includes("kharcha") || lower.includes("expense") || lower.includes("bill") || lower.includes("rent")) {
    const total = parseAmount(text) ?? 5000;
    return {
      id: msgId,
      conversationId,
      bookId,
      clientMessageId: generateId("cm"),
      sender: "munshi",
      text: `Theek hai, ${formatPKR(total)} ka kharcha (Expense) record karne ke liye tayyar hai:`,
      timestamp: now,
      status: "sent",
      source: "web",
      card: {
        type: "draft_transaction",
        data: {
          title: "Expense (Kharcha) — Draft",
          txType: "expense",
          partyName: "Cash Expense",
          itemsSummary: text.slice(0, 60),
          totalAmount: total,
          paidAmount: total,
          outstandingAmount: 0,
        },
      },
      options: [
        {
          id: generateId("opt"),
          messageId: msgId,
          label: "Save Expense",
          variant: "primary",
          actionType: "CONFIRM_DRAFT_TRANSACTION",
          payload: {
            txType: "expense",
            particulars: `Expense: ${text.slice(0, 50)}`,
            totalAmount: total,
            paidAmount: total,
          },
        },
      ],
    };
  }

  // 4. Khata / Receivable / Payable inquiry
  if (lower.includes("khata") || lower.includes("lene") || lower.includes("dene") || lower.includes("lena") || lower.includes("dena")) {
    const parties = await db.parties.where("bookId").equals(bookId).toArray();
    const matched = parties.find((p) => lower.includes(p.name.toLowerCase().split(" ")[0]));
    if (matched) {
      const dir =
        matched.currentBalance > 0
          ? "Lena Hai (Receivable)"
          : matched.currentBalance < 0
          ? "Dena Hai (Payable)"
          : "Hisaab Barabar";
      return {
        id: msgId,
        conversationId,
        bookId,
        clientMessageId: generateId("cm"),
        sender: "munshi",
        text: `${matched.name} ka mojooda khata summary:`,
        timestamp: now,
        status: "sent",
        source: "web",
        card: {
          type: "khata_statement",
          data: {
            partyId: matched.id,
            partyName: matched.name,
            partyType: matched.type,
            balance: Math.abs(matched.currentBalance),
            direction: dir,
          },
        },
        options: [
          {
            id: generateId("opt"),
            messageId: msgId,
            label: "Open Full Khata",
            variant: "primary",
            actionType: "OPEN_KHATA",
            payload: { partyId: matched.id },
          },
        ],
      };
    }

    const totalReceivable = parties
      .filter((p) => p.currentBalance > 0)
      .reduce((s, p) => s + p.currentBalance, 0);
    const totalPayable = parties
      .filter((p) => p.currentBalance < 0)
      .reduce((s, p) => s + Math.abs(p.currentBalance), 0);

    return {
      id: msgId,
      conversationId,
      bookId,
      clientMessageId: generateId("cm"),
      sender: "munshi",
      text: `Aaj ka Khata Summary:\n• Kul Lena Hai (Receivables): ${formatPKR(totalReceivable)}\n• Kul Dena Hai (Payables): ${formatPKR(totalPayable)}`,
      timestamp: now,
      status: "sent",
      source: "web",
      options: [
        {
          id: generateId("opt"),
          messageId: msgId,
          label: "View All Khatas",
          variant: "primary",
          actionType: "NAVIGATE",
          payload: { href: "/app/khatas" },
        },
      ],
    };
  }

  // 5. Stock / Inventory inquiry
  if (lower.includes("stock") || lower.includes("inventory") || lower.includes("maal")) {
    const products = await db.products.where("bookId").equals(bookId).toArray();
    const totalVal = products.reduce((s, p) => s + p.quantity * p.purchaseCost, 0);
    const lowStock = products.filter((p) => p.quantity <= p.lowStockThreshold);

    return {
      id: msgId,
      conversationId,
      bookId,
      clientMessageId: generateId("cm"),
      sender: "munshi",
      text: `Inventory Summary: Aap ke godown mein ${products.length} items hain jin ki kul qeemat ${formatPKR(totalVal)} hai. ${lowStock.length} items low-stock hain.`,
      timestamp: now,
      status: "sent",
      source: "web",
      card: {
        type: "inventory_summary",
        data: {
          totalItems: products.length,
          totalValue: totalVal,
          lowStockCount: lowStock.length,
          topLowStock: lowStock.slice(0, 3).map((p) => `${p.name} (${p.quantity} ${p.unit})`),
        },
      },
      options: [
        {
          id: generateId("opt"),
          messageId: msgId,
          label: "Open Inventory",
          variant: "primary",
          actionType: "NAVIGATE",
          payload: { href: "/app/inventory" },
        },
      ],
    };
  }

  // 6. Business summary / Hisaab / Profit & Loss
  if (
    lower.includes("hisaab") ||
    lower.includes("profit") ||
    lower.includes("loss") ||
    lower.includes("munafa") ||
    lower.includes("report")
  ) {
    const txs = await db.transactions
      .where("bookId")
      .equals(bookId)
      .filter((t) => t.status === "posted")
      .toArray();
    const sales = txs.filter((t) => t.type.includes("sale")).reduce((s, t) => s + t.totalAmount, 0);
    const purchases = txs
      .filter((t) => t.type.includes("purchase"))
      .reduce((s, t) => s + t.totalAmount, 0);
    const expenses = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.totalAmount, 0);
    const cogs = txs
      .filter((t) => t.type.includes("sale"))
      .reduce((s, t) => s + (t.cogsAmount ?? Math.round(t.totalAmount * 0.75)), 0);
    const netProfit = sales - cogs - expenses;

    return {
      id: msgId,
      conversationId,
      bookId,
      clientMessageId: generateId("cm"),
      sender: "munshi",
      text: "Yeh raha aap ke business ka mojooda Hisaab aur Profit & Loss summary:",
      timestamp: now,
      status: "sent",
      source: "web",
      card: {
        type: "business_summary",
        data: {
          sales,
          purchases,
          expenses,
          netProfit,
        },
      },
      options: [
        {
          id: generateId("opt"),
          messageId: msgId,
          label: "Open Full P&L Report",
          variant: "primary",
          actionType: "NAVIGATE",
          payload: { href: "/app/reports/profit-loss" },
        },
      ],
    };
  }

  // Fallback helpful demo message
  return {
    id: msgId,
    conversationId,
    bookId,
    clientMessageId: generateId("cm"),
    sender: "munshi",
    text: `Assalamualaikum! Main Demo Mode mein chal raha hoon (no external AI API connected). Aap mujh se yeh kaam karwa sakte hain:\n• "Ali Traders se 150,000 ka yarn khareeda, 50,000 cash diya"\n• "Ibrahim Traders ko 120,000 ka maal udhaar becha"\n• "5,000 transport kharcha likh do"\n• "Aaj ka hisaab dikhao" ya "Stock kitna baqi hai?"`,
    timestamp: now,
    status: "sent",
    source: "web",
  };
}

export async function executeInteractiveOption(params: {
  conversationId: string;
  bookId: string;
  messageId: string;
  option: InteractiveOption;
}): Promise<ChatMessage> {
  const { conversationId, bookId, messageId, option } = params;
  const replyId = generateId("msg");
  const now = new Date().toISOString();

  // Mark option as consumed on original message
  const origMsg = await db.messages.get(messageId);
  if (origMsg?.options) {
    await db.messages.update(messageId, {
      options: origMsg.options.map((o) =>
        o.id === option.id ? { ...o, consumed: true } : o
      ),
    });
  }

  if (option.actionType === "CONFIRM_DRAFT_TRANSACTION") {
    const p = option.payload;
    const accounts = await db.accounts.where("bookId").equals(bookId).toArray();
    const defaultAcc = accounts.find((a) => a.isDefault) ?? accounts[0];

    const tx = await postAtomicTransaction({
      bookId,
      date: new Date().toISOString().slice(0, 10),
      type: p.txType as never,
      particulars: String(p.particulars ?? "AI Munshi Entry"),
      partyId: p.partyId ? String(p.partyId) : undefined,
      accountId: defaultAcc?.id,
      paymentMethod: Number(p.paidAmount ?? 0) > 0 ? "cash" : "credit",
      totalAmount: Number(p.totalAmount ?? 0),
      paidAmount: Number(p.paidAmount ?? 0),
      source: "ai_munshi",
    });

    return {
      id: replyId,
      conversationId,
      bookId,
      clientMessageId: generateId("cm"),
      sender: "munshi",
      text: `Shukriya! Entry ${tx.serial} save ho gayi hai aur mutaliqa khata aur balance update kar diya gaya hai.`,
      timestamp: now,
      status: "sent",
      source: "web",
      card: {
        type: "saved_transaction",
        data: {
          transactionId: tx.id,
          serial: tx.serial,
          date: tx.date,
          title: "Entry Saved",
          partyName: tx.partyName ?? "Cash",
          itemsSummary: tx.particulars,
          totalAmount: tx.totalAmount,
          paidAmount: tx.paidAmount,
          outstandingAmount: tx.outstandingAmount,
          transactionType: tx.type,
        },
      },
      options: [
        {
          id: generateId("opt"),
          messageId: replyId,
          label: "Undo / Reverse Entry",
          variant: "danger",
          actionType: "REVERSE_TRANSACTION",
          payload: { transactionId: tx.id },
        },
        {
          id: generateId("opt"),
          messageId: replyId,
          label: "Tafseel Dekhein",
          variant: "secondary",
          actionType: "OPEN_TRANSACTION",
          payload: { transactionId: tx.id },
        },
      ],
    };
  }

  if (option.actionType === "ADD_PURCHASE_TO_STOCK") {
    const products = await db.products.where("bookId").equals(bookId).toArray();
    const target = products[0];
    if (target) {
      await db.products.update(target.id, {
        quantity: target.quantity + Number(option.payload.qty ?? 50),
        updatedAt: now,
      });
    }
    return {
      id: replyId,
      conversationId,
      bookId,
      clientMessageId: generateId("cm"),
      sender: "munshi",
      text: `Stock update ho gaya! ${target?.name ?? "Yarn"} mein +${option.payload.qty ?? 50} ${target?.unit ?? "kg"} shamil kar diye gaye hain.`,
      timestamp: now,
      status: "sent",
      source: "web",
    };
  }

  if (option.actionType === "REVERSE_TRANSACTION") {
    const txId = String(option.payload.transactionId);
    const rev = await reverseAtomicTransaction(txId, "Reversed from AI Munshi");
    return {
      id: replyId,
      conversationId,
      bookId,
      clientMessageId: generateId("cm"),
      sender: "munshi",
      text: `Entry reverse kar di gayi hai (Reversal Serial: ${rev.serial}). Sabhi balances wapas pehle jaise ho gaye hain.`,
      timestamp: now,
      status: "sent",
      source: "web",
      card: {
        type: "reversal_confirmation",
        data: {
          serial: rev.serial,
          particulars: rev.particulars,
          amount: rev.totalAmount,
        },
      },
    };
  }

  return {
    id: replyId,
    conversationId,
    bookId,
    clientMessageId: generateId("cm"),
    sender: "munshi",
    text: "Theek hai, koi baat nahin. Aap jab chahein naya kaam bata sakte hain!",
    timestamp: now,
    status: "sent",
    source: "web",
  };
}
