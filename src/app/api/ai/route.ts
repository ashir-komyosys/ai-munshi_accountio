import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Provider = "openrouter" | "groq";
type AiAction =
  | { type: "answer"; summary: string }
  | { type: "create_book"; summary: string; data: { name: string; businessType: string; openingCash: number; openingBank: number } }
  | { type: "update_book"; summary: string; data: { id: string; name?: string; businessType?: string } }
  | { type: "archive_book" | "restore_book"; summary: string; data: { id: string } }
  | { type: "create_khata"; summary: string; data: { name: string; type: "customer" | "supplier" | "other"; phone: string; openingBalance: number; openingDirection: "receivable" | "payable" } }
  | { type: "update_khata"; summary: string; data: { id: string; name?: string; phone?: string; address?: string; notes?: string } }
  | { type: "delete_khata"; summary: string; data: { id: string } }
  | { type: "create_expense"; summary: string; data: { particulars: string; totalAmount: number; accountId: string; date: string; notes?: string } }
  | { type: "create_transaction"; summary: string; data: { transactionType: string; particulars: string; totalAmount: number; paidAmount: number; paymentMethod: string; date: string; accountId?: string; partyId?: string; notes?: string } }
  | { type: "create_product"; summary: string; data: { name: string; sku: string; category: string; unit: string; quantity: number; lowStockThreshold: number; purchaseCost: number; sellingPrice: number } }
  | { type: "adjust_stock"; summary: string; data: { productId: string; movement: "in" | "out" | "adjustment"; quantity: number; unitCost: number; reason: string } }
  | { type: "archive_product"; summary: string; data: { productId: string } }
  | { type: "update_product"; summary: string; data: { productId: string; name?: string; sku?: string; category?: string; unit?: string; lowStockThreshold?: number; purchaseCost?: number; sellingPrice?: number } }
  | { type: "reverse_transaction"; summary: string; data: { transactionId: string; reason: string } };
  

const PROVIDERS: Record<Provider, { url: string; key: string | undefined }> = {
  openrouter: { url: "https://openrouter.ai/api/v1/chat/completions", key: process.env.OPENROUTER_API_KEY },
  groq: { url: "https://api.groq.com/openai/v1/chat/completions", key: process.env.GROQ_API_KEY },
};

function config(name: string, fallback: string): { provider: Provider; model: string } {
  const provider = (process.env[`${name}_PROVIDER`] ?? fallback) as Provider;
  const model = process.env[`${name}_MODEL`];
  if (!(provider in PROVIDERS) || !model) throw new Error(`Configure ${name}_PROVIDER and ${name}_MODEL in .env.local`);
  return { provider, model };
}

async function ask(provider: Provider, model: string, messages: Array<{ role: string; content: string }>, json = false): Promise<string> {
  const target = PROVIDERS[provider];
  if (!target.key) throw new Error(`Missing ${provider.toUpperCase()}_API_KEY in .env.local`);
  const headers = { Authorization: `Bearer ${target.key}`, "Content-Type": "application/json", ...(provider === "openrouter" ? { "HTTP-Referer": "http://localhost:3000", "X-Title": "Accountio AI" } : {}) };
  const candidates = provider === "openrouter"
    ? [...new Set([model, "openrouter/free", "nvidia/nemotron-3-ultra-550b-a55b:free", "baidu/ernie-5.5-flash-preview:free"])]
    : [model];
  let lastStatus = 0;
  for (const candidate of candidates) {
    const send = (useJsonMode: boolean) => fetch(target.url, {
      method: "POST",
      headers,
      body: JSON.stringify({ model: candidate, messages, max_tokens: json ? 700 : 350, temperature: 0.2, ...(useJsonMode ? { response_format: { type: "json_object" } } : {}) }),
      signal: AbortSignal.timeout(30000),
    });
    let response: Response;
    try {
      response = await send(json);
      // Some free models (including Nemotron 3 Ultra) don't accept response_format.
      if (json && (response.status === 400 || response.status === 422)) response = await send(false);
    } catch {
      lastStatus = 503;
      continue;
    }
    if (!response.ok) {
      lastStatus = response.status;
      if (response.status === 401 || response.status === 403) throw new Error("OpenRouter authentication failed. Check OPENROUTER_API_KEY in .env.local.");
      if ([400, 404, 408, 429, 502, 503, 504].includes(response.status) || response.status >= 500) continue;
      throw new Error(`${provider} request failed (${response.status}).`);
    }
    const body = await response.json();
    const content = body.choices?.[0]?.message?.content;
    if (typeof content === "string" && content.trim()) return content;
    lastStatus = 502;
  }
  if (provider === "openrouter" && (lastStatus === 429 || lastStatus >= 500)) {
    throw new Error("Free models are temporarily busy or rate-limited. The app tried its configured model and free fallbacks; please retry shortly.");
  }
  throw new Error("No configured model returned a usable response. Check that the model IDs are available on your provider.");
}

function parseAction(raw: string, context: { bookIds: Set<string>; partyIds: Set<string>; productIds: Set<string>; transactionIds: Set<string>; accountIds: Set<string>; accountTypes: Map<string, string> }): AiAction {
  const candidate = JSON.parse(raw) as { type: string; summary: string; data?: Record<string, unknown> };
  const d = candidate?.data;
  const text = (value: unknown) => typeof value === "string" && value.trim().length > 0;
  const number = (value: unknown, min = 0, max = 1_000_000_000) => typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
  if (!candidate || typeof candidate !== "object" || !text(candidate.summary) || (candidate.type !== "answer" && !d)) throw new Error("Model returned an invalid action.");
  if (candidate.type === "create_book" && (!text(d?.name) || !text(d?.businessType) || !number(d?.openingCash) || !number(d?.openingBank))) throw new Error("Book proposal is missing valid fields.");
  if (candidate.type === "update_book" && (!text(d?.id) || !context.bookIds.has(String(d?.id)) || (!text(d?.name) && !text(d?.businessType)))) throw new Error("Book update target or fields are invalid.");
  if ((candidate.type === "archive_book" || candidate.type === "restore_book") && (!text(d?.id) || !context.bookIds.has(String(d?.id)))) throw new Error("Book target is invalid.");
  if (candidate.type === "create_khata" && (!text(d?.name) || !["customer", "supplier", "other"].includes(String(d?.type)) || typeof d?.phone !== "string" || !number(d?.openingBalance) || !["receivable", "payable"].includes(String(d?.openingDirection)))) throw new Error("Khata proposal is missing valid fields.");
  if (candidate.type === "update_khata" && (!text(d?.id) || !context.partyIds.has(String(d?.id)) || !Object.keys(d ?? {}).some((key) => key !== "id"))) throw new Error("Khata update target or fields are invalid.");
  if (candidate.type === "delete_khata" && (!text(d?.id) || !context.partyIds.has(String(d?.id)))) throw new Error("Khata deletion target is invalid.");
  if (candidate.type === "create_expense" && (!text(d?.particulars) || !number(d?.totalAmount, 0.01) || !text(d?.accountId) || !context.accountIds.has(String(d?.accountId)) || !/^\d{4}-\d{2}-\d{2}$/.test(String(d?.date)))) throw new Error("Expense proposal or account selection is invalid.");
  const transactionTypes = ["cash_sale", "credit_sale", "partial_sale", "cash_purchase", "credit_purchase", "partial_purchase", "customer_receipt", "supplier_payment", "expense", "sales_return", "purchase_return", "cash_transfer", "bank_transfer", "loan_received", "loan_given", "loan_repayment", "capital_introduced", "owner_withdrawal", "salary_payment", "salary_advance", "asset_purchase", "journal"];
  const paymentMethods = ["cash", "bank", "jazzcash", "easypaisa", "wallet", "credit"];
  if (candidate.type === "create_transaction" && (!d || !transactionTypes.includes(String(d.transactionType)) || !text(d.particulars) || !number(d.totalAmount, 0.01) || !number(d.paidAmount) || Number(d.paidAmount) > Number(d.totalAmount) || !paymentMethods.includes(String(d.paymentMethod)) || !/^\d{4}-\d{2}-\d{2}$/.test(String(d.date)) || (d.paymentMethod !== "credit" && (!text(d.accountId) || !context.accountIds.has(String(d.accountId)) || context.accountTypes.get(String(d.accountId)) !== d.paymentMethod)) || (d.paymentMethod === "credit" && d.accountId) || (d.partyId && !context.partyIds.has(String(d.partyId))))) throw new Error("Transaction proposal has invalid types, amounts, date, account, or party.");
  if (candidate.type === "create_product" && (!text(d?.name) || !["kg", "gram", "meter", "yard", "piece", "bag", "carton", "roll"].includes(String(d?.unit)) || !number(d?.quantity) || !number(d?.purchaseCost) || !number(d?.sellingPrice))) throw new Error("Product proposal is invalid.");
  if (candidate.type === "adjust_stock" && (!text(d?.productId) || !context.productIds.has(String(d?.productId)) || !["in", "out", "adjustment"].includes(String(d?.movement)) || !number(d?.quantity, 0.01) || !number(d?.unitCost) || !text(d?.reason))) throw new Error("Stock adjustment proposal is invalid.");
  if (candidate.type === "archive_product" && (!text(d?.productId) || !context.productIds.has(String(d?.productId)))) throw new Error("Product archive target is invalid.");
  if (candidate.type === "update_product" && (!text(d?.productId) || !context.productIds.has(String(d?.productId)) || !Object.keys(d ?? {}).some((key) => key !== "productId"))) throw new Error("Product update target or fields are invalid.");
  if (candidate.type === "reverse_transaction" && (!text(d?.transactionId) || !context.transactionIds.has(String(d?.transactionId)) || !text(d?.reason))) throw new Error("Transaction reversal target or reason is invalid.");
  if (!["answer", "create_book", "update_book", "archive_book", "restore_book", "create_khata", "update_khata", "delete_khata", "create_expense", "create_transaction", "create_product", "adjust_stock", "archive_product", "update_product", "reverse_transaction"].includes(candidate.type)) throw new Error("Unsupported action.");
  return candidate as AiAction;
}

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "AI endpoint is disabled in production until server-side user authentication is configured." }, { status: 503 });
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Cross-origin AI requests are not allowed." }, { status: 403 });
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 32_000) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    const rawBody = await request.text();
    if (rawBody.length > 32_000) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    const body = JSON.parse(rawBody);
    if (typeof body.text !== "string" || !body.text.trim() || body.text.length > 4000 || !Array.isArray(body.books) || !Array.isArray(body.parties) || !Array.isArray(body.products) || !Array.isArray(body.accounts) || !Array.isArray(body.transactions)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    if (typeof body.bookId !== "string" || !body.books.some((book: { id?: unknown }) => book?.id === body.bookId)) return NextResponse.json({ error: "Unknown active book." }, { status: 400 });
    const context = {
      bookIds: new Set<string>(body.books.slice(0, 50).map((item: { id?: unknown }) => String(item?.id ?? ""))),
      partyIds: new Set<string>(body.parties.slice(0, 100).map((item: { id?: unknown }) => String(item?.id ?? ""))),
      productIds: new Set<string>(body.products.slice(0, 100).map((item: { id?: unknown }) => String(item?.id ?? ""))),
      transactionIds: new Set<string>(body.transactions.slice(0, 100).map((item: { id?: unknown }) => String(item?.id ?? ""))),
      accountIds: new Set<string>(body.accounts.slice(0, 30).map((item: { id?: unknown }) => String(item?.id ?? ""))),
      accountTypes: new Map<string, string>(body.accounts.slice(0, 30).map((item: { id?: unknown; type?: unknown }) => [String(item?.id ?? ""), String(item?.type ?? "")])),
    };
    // Only send fields the model needs; omit phone, address, notes, account numbers and customer balances.
    const safeContext = JSON.stringify({
      books: body.books.slice(0, 50).map((item: Record<string, unknown>) => ({ id: item.id, name: item.name, businessType: item.businessType, status: item.status })),
      parties: body.parties.slice(0, 100).map((item: Record<string, unknown>) => ({ id: item.id, name: item.name, type: item.type })),
      products: body.products.slice(0, 100).map((item: Record<string, unknown>) => ({ id: item.id, name: item.name, sku: item.sku, unit: item.unit, quantity: item.quantity })),
      accounts: body.accounts.slice(0, 30).map((item: Record<string, unknown>) => ({ id: item.id, name: item.name, type: item.type })),
      transactions: body.transactions.slice(0, 100).map((item: Record<string, unknown>) => ({ id: item.id, particulars: item.particulars, type: item.type, status: item.status })),
    }).slice(0, 12000);
    const task = `User request: ${body.text}\nCurrent book ID: ${body.bookId}\nCurrent local data: ${safeContext}\nReturn JSON only, exactly {"type":"...","summary":"...","data":{...}}. Allowed types: answer (data omitted), create_book {name,businessType,openingCash,openingBank}, update_book {id,name?,businessType?}, archive_book {id}, restore_book {id}, create_khata {name,type,phone,openingBalance,openingDirection}, update_khata {id,name?,phone?,address?,notes?}, delete_khata {id}, create_expense {particulars,totalAmount,accountId,date,notes?}, create_transaction {transactionType,particulars,totalAmount,paidAmount,paymentMethod,date,accountId?,partyId?,notes?}, create_product {name,sku,category,unit,quantity,lowStockThreshold,purchaseCost,sellingPrice}, adjust_stock {productId,movement,quantity,unitCost,reason}, archive_product {productId}, update_product {productId,name?,sku?,category?,unit?,lowStockThreshold?,purchaseCost?,sellingPrice?}, reverse_transaction {transactionId,reason}. Never invent IDs: use IDs from provided context. Match payment method to the selected account type; do not guess account or party IDs. For missing fields, return answer and ask a concise question. Never claim an action has executed.`;
    const interpreter = config("AI_INTERPRETER", "openrouter");
    const actionModel = config("AI_ACTION", "openrouter");
    const reviewer = config("AI_REVIEW", "openrouter");
    const interpreted = await ask(interpreter.provider, interpreter.model, [{ role: "system", content: "You interpret user requests for a small-business accounting app. Return a concise intent summary and preserve all facts." }, { role: "user", content: task }]);
    let action = parseAction(await ask(actionModel.provider, actionModel.model, [{ role: "system", content: "You are the action planner. Return only a valid JSON object matching the user's supplied schema. Do not execute actions." }, { role: "user", content: `${task}\nInterpreter summary: ${interpreted}` }], true), context);
    if (action.type !== "answer") {
      const reviewed = await ask(reviewer.provider, reviewer.model, [{ role: "system", content: "Review the proposed JSON action against the request and supplied data. Return JSON only: {\"approved\":boolean,\"reason\":string,\"action\":<corrected action or null}. Reject invented IDs, missing required fields, or mismatched intent." }, { role: "user", content: `${task}\nProposed action: ${JSON.stringify(action)}` }], true);
      const review = JSON.parse(reviewed);
      if (review.approved !== true || !review.action) return NextResponse.json({ summary: review.reason || "I need clarification before making that change.", action: { type: "answer", summary: review.reason || "Please clarify the requested change." } satisfies AiAction });
      action = parseAction(JSON.stringify(review.action), context);
    }
    return NextResponse.json({ summary: action.summary, action });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
