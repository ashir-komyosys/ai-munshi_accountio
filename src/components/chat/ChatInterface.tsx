"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  History,
  Image as ImageIcon,
  Mic,
  Paperclip,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AiMunshiMascot } from "@/components/common/BrandAssets";
import { AnimatedSkeleton } from "@/components/motion/AnimatedSkeleton";
import { AnimatedSuccess } from "@/components/motion/AnimatedSuccess";
import { RecordingWaveform } from "@/components/motion/RecordingWaveform";
import { TypingIndicator } from "@/components/motion/TypingIndicator";
import { Badge, Button, Card } from "@/components/ui/primitives";
import { useDictionary } from "@/hooks/useDictionary";
import { messageVariants } from "@/lib/motion/variants";
import { formatPKR } from "@/lib/money";
import { cn, formatTime, generateId } from "@/lib/utils";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";
import type { Book, ChatAttachment, ChatMessage, InteractiveOption } from "@/types";

const QUICK_ACTIONS = [
  { label: "New Sale", prompt: "Ibrahim Traders ko 90,000 ka maal udhaar becha" },
  {
    label: "New Purchase",
    prompt: "Ali Traders se 150,000 ka yarn khareeda, 50,000 cash diya, baqi udhaar",
  },
  { label: "Receive Payment", prompt: "Receive payment 50,000 from Ibrahim Traders" },
  { label: "Pay Supplier", prompt: "Pay supplier Ali Traders 50,000" },
  { label: "Check Khata", prompt: "Aaj ka khata summary dikhao" },
  { label: "Today's Summary", prompt: "Aaj ka hisaab dikhao" },
] as const;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ChatInterface({
  compact = false,
  initialPrompt,
}: {
  compact?: boolean;
  initialPrompt?: string | null;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useDictionary();
  const activeBookId = useUIStore((s) => s.activeBookId);
  const closeMunshiDrawer = useUIStore((s) => s.closeMunshiDrawer);

  const [input, setInput] = useState(initialPrompt ?? "");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [chipsExpandedMobile, setChipsExpandedMobile] = useState(false);
  const [failedDraft, setFailedDraft] = useState<{
    text: string;
    clientMessageId: string;
    source?: ChatMessage["source"];
    attachments?: ChatAttachment[];
  } | null>(null);

  // Voice recording state (MediaRecorder API)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSec, setRecordingSec] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);

  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mountedAt] = useState(() => Date.now());
  const reduced = useReducedMotion();

  const { data: conversation } = useQuery({
    queryKey: ["conversation", activeBookId],
    queryFn: () => services.chat.getOrCreateConversation(activeBookId),
  });

  const { data: aiBooks = [] } = useQuery({
    queryKey: ["books"],
    queryFn: () => services.books.listBooks(),
  });
  const { data: aiParties = [] } = useQuery({
    queryKey: ["parties", activeBookId],
    queryFn: () => services.khatas.listParties(activeBookId),
  });
  const { data: aiProducts = [] } = useQuery({ queryKey: ["products", activeBookId], queryFn: () => services.inventory.listProducts(activeBookId) });
  const { data: aiAccounts = [] } = useQuery({ queryKey: ["accounts", activeBookId], queryFn: () => services.cashBank.listAccounts(activeBookId) });
  const { data: aiTransactions = [] } = useQuery({ queryKey: ["transactions", activeBookId], queryFn: () => services.transactions.listTransactions(activeBookId) });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", conversation?.id],
    queryFn: () => services.chat.listMessages(conversation!.id),
    enabled: !!conversation?.id,
  });

  const scrollToBottom = (smooth = false) => {
    const el = listRef.current;
    if (!el) return;
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const invalidateAccounting = () => {
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["parties"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: ["summary"] });
    queryClient.invalidateQueries({ queryKey: ["messages", conversation?.id] });
  };

  const sendMutation = useMutation({
    mutationFn: async (vars: {
      text: string;
      clientMessageId: string;
      source?: ChatMessage["source"];
      attachments?: ChatAttachment[];
    }) => {
      if (!conversation) throw new Error("Conversation not ready");
      if (vars.attachments?.length) {
        return services.chat.sendMessage({ conversationId: conversation.id, bookId: activeBookId, text: vars.text, clientMessageId: vars.clientMessageId, source: vars.source, attachments: vars.attachments });
      }
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: vars.text,
          bookId: activeBookId,
          books: aiBooks.slice(0, 20).map(({ id, name, businessType, status }) => ({ id, name, businessType, status })),
          parties: aiParties.slice(0, 50).map(({ id, name, type }) => ({ id, name, type })),
          products: aiProducts.slice(0, 50).map(({ id, name, sku, unit, quantity }) => ({ id, name, sku, unit, quantity })),
          accounts: aiAccounts.slice(0, 20).map(({ id, name, type }) => ({ id, name, type })),
          transactions: aiTransactions.slice(0, 50).map(({ id, particulars, type, status }) => ({ id, particulars, type, status })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "AI request failed");
      return services.chat.saveAiExchange({ conversationId: conversation.id, bookId: activeBookId, text: vars.text, clientMessageId: vars.clientMessageId, reply: result.summary, action: result.action });
    },
    onSuccess: () => {
      setFailedDraft(null);
      invalidateAccounting();
    },
    onError: (err: Error, vars) => {
      setFailedDraft(vars);
      toast.error(err.message || "Failed to send message");
    },
  });

  const optionMutation = useMutation({
    mutationFn: async (vars: { messageId: string; option: InteractiveOption }) => {
      if (!conversation) throw new Error("Conversation not ready");
      if (vars.option.actionType === "AI_CANCEL") {
        await services.chat.consumeAiOption(vars.messageId, vars.option.id);
        return null;
      }
      if (vars.option.actionType.startsWith("AI_")) {
        const data = vars.option.payload;
        const action = vars.option.actionType.slice(3).toLowerCase();
        if (action === "create_book") await services.books.createBook({ name: String(data.name), businessType: String(data.businessType), openingCash: Number(data.openingCash), openingBank: Number(data.openingBank) });
        else if (action === "update_book") {
          const patch: Partial<Book> = {};
          if (typeof data.name === "string") patch.name = data.name;
          if (typeof data.businessType === "string") patch.businessType = data.businessType;
          await services.books.updateBook(String(data.id), patch);
        } else if (action === "archive_book") await services.books.archiveBook(String(data.id));
        else if (action === "restore_book") await services.books.restoreBook(String(data.id));
        else if (action === "create_khata") await services.khatas.createParty({ bookId: activeBookId, name: String(data.name), type: data.type as "customer" | "supplier" | "other", phone: String(data.phone), openingBalance: Number(data.openingBalance), openingDirection: data.openingDirection as "receivable" | "payable" });
        else if (action === "update_khata") {
          const patch: Record<string, string> = {};
          for (const field of ["name", "phone", "address", "notes"] as const) {
            if (typeof data[field] === "string") patch[field] = data[field] as string;
          }
          await services.khatas.updateParty(String(data.id), patch);
        }
        else if (action === "delete_khata") await services.khatas.deleteParty(String(data.id));
        else if (action === "create_expense") {
          const account = aiAccounts.find((item) => item.id === String(data.accountId));
          if (!account) throw new Error("The selected account is no longer available.");
          await services.transactions.createTransaction({ bookId: activeBookId, date: String(data.date || new Date().toISOString().slice(0, 10)), type: "expense", particulars: String(data.particulars), accountId: account.id, paymentMethod: account.type, totalAmount: Number(data.totalAmount), paidAmount: Number(data.totalAmount), notes: data.notes ? String(data.notes) : undefined, source: "ai_munshi" });
        }
        else if (action === "create_transaction") await services.transactions.createTransaction({ bookId: activeBookId, date: String(data.date), type: data.transactionType as import("@/types").TransactionType, particulars: String(data.particulars), accountId: data.accountId ? String(data.accountId) : undefined, partyId: data.partyId ? String(data.partyId) : undefined, paymentMethod: data.paymentMethod as import("@/types").AccountType | "credit", totalAmount: Number(data.totalAmount), paidAmount: Number(data.paidAmount), notes: data.notes ? String(data.notes) : undefined, source: "ai_munshi" });
        else if (action === "create_product") await services.inventory.createProduct({ bookId: activeBookId, name: String(data.name), sku: String(data.sku || ""), category: String(data.category || "General"), unit: data.unit as "kg" | "gram" | "meter" | "yard" | "piece" | "bag" | "carton" | "roll", quantity: Number(data.quantity), lowStockThreshold: Number(data.lowStockThreshold || 0), purchaseCost: Number(data.purchaseCost), sellingPrice: Number(data.sellingPrice) });
        else if (action === "adjust_stock") await services.inventory.recordStockMovement({ bookId: activeBookId, productId: String(data.productId), type: data.movement as "in" | "out" | "adjustment", quantity: Number(data.quantity), unitCost: Number(data.unitCost), reason: String(data.reason), date: new Date().toISOString().slice(0, 10) });
        else if (action === "archive_product") await services.inventory.archiveProduct(String(data.productId));
        else if (action === "update_product") {
          const patch: Record<string, string | number> = {};
          for (const field of ["name", "sku", "category", "unit", "lowStockThreshold", "purchaseCost", "sellingPrice"] as const) {
            if (typeof data[field] === "string" || typeof data[field] === "number") patch[field] = data[field] as string | number;
          }
          const productId = data.productId;
          await services.inventory.updateProduct(String(productId), patch);
        }
        else if (action === "reverse_transaction") await services.transactions.reverseTransaction(String(data.transactionId), String(data.reason));
        await services.chat.consumeAiOption(vars.messageId, vars.option.id);
        return null;
      }
      if (vars.option.actionType === "OPEN_TRANSACTION") {
        const txId = String(vars.option.payload.transactionId);
        if (compact) closeMunshiDrawer();
        router.push(`/app/transactions/${txId}`);
        return null;
      }
      if (vars.option.actionType === "OPEN_KHATA") {
        const partyId = String(vars.option.payload.partyId);
        if (compact) closeMunshiDrawer();
        router.push(`/app/khatas/${partyId}`);
        return null;
      }
      if (vars.option.actionType === "NAVIGATE") {
        const href = String(vars.option.payload.href);
        if (compact) closeMunshiDrawer();
        router.push(href);
        return null;
      }
      return services.chat.triggerOption({
        conversationId: conversation.id,
        bookId: activeBookId,
        messageId: vars.messageId,
        optionId: vars.option.id,
      });
    },
    onSuccess: () => {
      invalidateAccounting();
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["parties", activeBookId] });
      queryClient.invalidateQueries({ queryKey: ["products", activeBookId] });
      queryClient.invalidateQueries({ queryKey: ["accounts", activeBookId] });
      queryClient.invalidateQueries({ queryKey: ["transactions", activeBookId] });
      queryClient.invalidateQueries({ queryKey: ["messages", conversation?.id] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Action failed. Please try again.");
    },
  });

  const handleSend = (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text && attachments.length === 0) return;
    if (sendMutation.isPending) return;
    const clientMessageId = generateId("cm");
    const currentAttachments = [...attachments];
    if (!overrideText) {
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
    setAttachments([]);
    setFailedDraft(null);
    sendMutation.mutate({
      text:
        text ||
        (currentAttachments[0]?.kind === "audio" ? "Voice note" : "Uploaded bill/image"),
      clientMessageId,
      source: currentAttachments.some((a) => a.kind === "audio") ? "voice_simulated" : "web",
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
    });
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const isImg = file.type.startsWith("image/");
        setAttachments((prev) => [
          ...prev,
          {
            id: generateId("att"),
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
            dataUrl: typeof reader.result === "string" ? reader.result : undefined,
            kind: isImg ? "image" : "document",
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const startVoiceRecording = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("Voice recording is not supported in this browser");
      return;
    }
    try {
      cancelledRef.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      let secondsSnapshot = 0;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        if (cancelledRef.current) return;
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAttachments((prev) => [
          ...prev,
          {
            id: generateId("aud"),
            name: `Voice-Note-${secondsSnapshot}s.webm`,
            mimeType: "audio/webm",
            sizeBytes: blob.size,
            dataUrl: url,
            kind: "audio",
            durationSec: secondsSnapshot,
          },
        ]);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSec(0);
      timerRef.current = setInterval(() => {
        secondsSnapshot += 1;
        setRecordingSec(secondsSnapshot);
      }, 1000);
    } catch {
      toast.error("Microphone permission denied or unavailable");
    }
  };

  const stopVoiceRecording = () => {
    cancelledRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const cancelVoiceRecording = () => {
    cancelledRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingSec(0);
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div
      className={cn(
        "flex flex-col flex-1 min-h-0 min-w-0 bg-[var(--bg-app)] rounded-2xl border border-[var(--border-default)] overflow-hidden shadow-[var(--shadow-xs)]"
      )}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleFileSelect(e.dataTransfer.files);
      }}
    >
      {/* Unified Compact Header */}
      {compact ? (
        <div className="px-3 py-1.5 bg-[var(--brand-cream)] border-b border-[var(--border-default)] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <AiMunshiMascot size={22} />
            <p className="text-[11px] text-[var(--text-secondary)] truncate">
              {t.chat.simulatedNotice}
            </p>
          </div>
          <Link
            href="/app/munshi"
            onClick={() => closeMunshiDrawer()}
            className="text-[11px] font-medium text-[var(--brand-primary)] hover:underline whitespace-nowrap shrink-0"
          >
            Full View
          </Link>
        </div>
      ) : (
        <div className="px-3.5 py-2.5 bg-[var(--brand-cream)] border-b border-[var(--border-default)] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <AiMunshiMascot size={30} className="shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-sm sm:text-base font-bold text-[var(--text-primary)] truncate">
                  AI Munshi
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-primary-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--brand-primary)] whitespace-nowrap">
                  <Sparkles className="h-2.5 w-2.5" />
                  Simulated
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] truncate">
                {t.chat.simulatedNotice}
              </p>
            </div>
          </div>
          <Link href="/app/munshi/history" className="shrink-0">
            <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs whitespace-nowrap">
              <History className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">History</span>
            </Button>
          </Link>
        </div>
      )}

      {/* Messages Area (only this container scrolls vertically) */}
      <div
        ref={listRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          setShowScrollBottom(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
        }}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-3 sm:px-4 sm:py-3.5 space-y-3 relative"
      >
        {isLoading && (
          <div className="space-y-3 py-2" aria-label="Loading conversation">
            <div className="flex gap-2 items-start">
              <AnimatedSkeleton className="h-7 w-7 rounded-full shrink-0" />
              <AnimatedSkeleton className="h-14 w-56 sm:w-72 rounded-2xl border border-[var(--border-default)]" />
            </div>
            <div className="flex justify-end">
              <AnimatedSkeleton className="h-10 w-44 sm:w-64 rounded-2xl" />
            </div>
            <div className="flex gap-2 items-start">
              <AnimatedSkeleton className="h-7 w-7 rounded-full shrink-0" />
              <AnimatedSkeleton className="h-28 w-64 sm:w-80 rounded-2xl border border-[var(--border-default)]" />
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          const isNew = !reduced && Date.parse(msg.timestamp) >= mountedAt;
          const Wrapper = isNew ? motion.div : "div";
          const wrapperProps = isNew
            ? { variants: messageVariants, initial: "initial", animate: "animate" }
            : {};
          return (
            <Wrapper
              key={msg.id}
              {...wrapperProps}
              className={cn("flex gap-2 min-w-0", isUser ? "justify-end" : "justify-start")}
            >
              {!isUser && <AiMunshiMascot size={28} className="mt-0.5 hidden sm:block shrink-0" />}
              <div className={cn("max-w-[90%] sm:max-w-[76%] lg:max-w-[68%] min-w-0 space-y-1.5")}>
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2 text-[13.5px] shadow-[var(--shadow-xs)] border group relative break-words",
                    isUser
                      ? "bg-[var(--chat-user-bubble)] text-[var(--chat-user-text)] border-transparent rounded-tr-sm"
                      : "bg-[var(--chat-ai-bubble)] text-[var(--text-primary)] border-[var(--border-default)] rounded-tl-sm"
                  )}
                >
                  <p className="whitespace-pre-line leading-snug">{msg.text}</p>

                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {msg.attachments.map((att) =>
                        att.kind === "audio" && att.dataUrl ? (
                          <div key={att.id} className="bg-black/5 dark:bg-white/5 rounded-xl p-2">
                            <audio controls src={att.dataUrl} className="h-8 w-full max-w-[230px]" />
                            <p className="text-[10px] opacity-75 mt-1">{t.chat.voiceNotice}</p>
                          </div>
                        ) : att.kind === "image" && att.dataUrl ? (
                          <img
                            key={att.id}
                            src={att.dataUrl}
                            alt={att.name}
                            className="max-h-40 rounded-xl border border-[var(--border-default)] object-cover"
                          />
                        ) : (
                          <div
                            key={att.id}
                            className="flex items-center gap-2 text-xs bg-black/5 dark:bg-white/5 px-2.5 py-1.5 rounded-lg"
                          >
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{att.name}</span>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Embedded Structured Card */}
                  {msg.card && <ChatStructuredCard card={msg.card} options={msg.options} />}

                  <div className="mt-1 flex items-center justify-end gap-2 text-[10px] opacity-70">
                    <button
                      type="button"
                      aria-label="Copy message"
                      onClick={() => copyMessage(msg.id, msg.text)}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                    >
                      {copiedId === msg.id ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                    <span>{formatTime(msg.timestamp)}</span>
                    {isUser && msg.status === "sent" && (
                      <CheckCheck className="h-3 w-3 text-[var(--status-success)]" />
                    )}
                    {msg.status === "failed" && (
                      <button
                        type="button"
                        onClick={() =>
                          sendMutation.mutate({
                            text: msg.text,
                            clientMessageId: msg.clientMessageId,
                            source: msg.source,
                            attachments: msg.attachments,
                          })
                        }
                        className="text-[var(--status-danger)] flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <RefreshCw className="h-3 w-3" /> Retry
                      </button>
                    )}
                  </div>
                </div>

                {/* Interactive Option Buttons */}
                {msg.options && msg.options.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {msg.options.map((opt) => (
                      <Button
                        key={opt.id}
                        size="sm"
                        variant={
                          opt.variant === "primary"
                            ? "primary"
                            : opt.variant === "danger"
                            ? "danger"
                            : "outline"
                        }
                        disabled={opt.consumed || optionMutation.isPending}
                        onClick={() =>
                          optionMutation.mutate({ messageId: msg.id, option: opt })
                        }
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </Wrapper>
          );
        })}

        <AnimatePresence>
          {sendMutation.isPending && <TypingIndicator />}
        </AnimatePresence>

        {failedDraft && !sendMutation.isPending && (
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[var(--status-danger-bg)] border border-[var(--status-danger)]/30 text-xs text-[var(--status-danger)]">
            <span className="truncate">Message failed to send: &ldquo;{failedDraft.text}&rdquo;</span>
            <Button
              size="sm"
              variant="danger"
              onClick={() => sendMutation.mutate(failedDraft)}
              className="h-7 px-2.5 text-xs shrink-0"
            >
              <RefreshCw className="h-3 w-3" /> Retry
            </Button>
          </div>
        )}
      </div>

      {/* Scroll to bottom */}
      {showScrollBottom && (
        <div className="relative h-0 shrink-0">
          <button
            type="button"
            aria-label="Scroll to bottom"
            onClick={() => scrollToBottom(true)}
            className="absolute end-3 bottom-2 z-10 h-8 w-8 rounded-full bg-[var(--bg-card)] border border-[var(--border-default)] shadow-[var(--shadow-sm)] flex items-center justify-center hover:border-[var(--brand-primary)] cursor-pointer"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Short Quick-Action Chips (wrapping cleanly, zero horizontal scroll) */}
      <div className="px-2.5 sm:px-3 py-1.5 border-t border-[var(--border-default)] bg-[var(--bg-subtle)]/60 shrink-0">
        <div className="flex flex-wrap items-center gap-1.5">
          {QUICK_ACTIONS.map((action, idx) => (
            <button
              key={action.label}
              type="button"
              disabled={sendMutation.isPending}
              onClick={() => handleSend(action.prompt)}
              className={cn(
                "text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50",
                idx >= 3 && !chipsExpandedMobile && "hidden sm:inline-flex"
              )}
            >
              {action.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setChipsExpandedMobile((v) => !v)}
            className="sm:hidden text-[11px] font-medium px-2 py-1 rounded-full text-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)] inline-flex items-center gap-0.5 cursor-pointer"
          >
            {chipsExpandedMobile ? (
              <>
                Less <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                +3 more <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="px-3 py-2 border-t border-[var(--border-default)] bg-[var(--bg-card)] flex flex-wrap gap-2 shrink-0">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 px-2 py-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-default)] text-xs max-w-[220px]"
            >
              {att.kind === "image" && att.dataUrl ? (
                <img
                  src={att.dataUrl}
                  alt={att.name}
                  className="h-7 w-7 rounded-lg object-cover shrink-0 border border-[var(--border-default)]"
                />
              ) : att.kind === "audio" ? (
                <Mic className="h-3.5 w-3.5 text-[var(--brand-primary)] shrink-0" />
              ) : att.kind === "image" ? (
                <ImageIcon className="h-3.5 w-3.5 text-[var(--status-info)] shrink-0" />
              ) : (
                <FileText className="h-3.5 w-3.5 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-[11px]">{att.name}</p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {att.kind === "audio" && att.durationSec != null
                    ? formatDuration(att.durationSec)
                    : formatFileSize(att.sizeBytes)}
                </p>
              </div>
              <button
                type="button"
                aria-label="Remove attachment"
                onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== att.id))}
                className="text-[var(--text-muted)] hover:text-[var(--status-danger)] cursor-pointer shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Composer (always pinned at bottom of chat container) */}
      <div className="p-2 sm:p-2.5 border-t border-[var(--border-default)] bg-[var(--bg-card)] flex items-end gap-1.5 sm:gap-2 shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.xlsx,.csv"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFileSelect(e.target.files);
            e.target.value = "";
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Upload file or bill"
          onClick={() => fileInputRef.current?.click()}
          className="h-9 w-9 shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Attach image"
          onClick={() => fileInputRef.current?.click()}
          className="hidden sm:inline-flex h-9 w-9 shrink-0"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {isRecording ? (
          <div className="flex-1 min-w-0 flex items-center justify-between gap-2 px-3 h-9 rounded-xl bg-[var(--status-danger-bg)] text-[var(--status-danger)] text-xs font-medium">
            <span className="flex items-center gap-2 min-w-0 truncate">
              <RecordingWaveform />
              <span className="tabular-nums font-semibold">{formatDuration(recordingSec)}</span>
              <span className="hidden sm:inline truncate">— Simulated Voice Demo</span>
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={stopVoiceRecording}
                className="px-2.5 py-1 rounded-lg bg-[var(--status-danger)] text-white flex items-center gap-1 cursor-pointer text-[11px]"
              >
                <Square className="h-3 w-3" /> Stop
              </button>
              <button
                type="button"
                aria-label="Cancel recording"
                onClick={cancelVoiceRecording}
                className="p-1 rounded-lg hover:bg-black/5 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Record voice note"
              onClick={startVoiceRecording}
              className="h-9 w-9 shrink-0"
            >
              <Mic className="h-4 w-4" />
            </Button>
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onFocus={() => {
                setTimeout(() => scrollToBottom(true), 150);
              }}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={t.chat.placeholder}
              className="flex-1 min-w-0 resize-none rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)] px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none max-h-24 leading-snug"
            />
            <Button
              size="icon"
              aria-label="Send message"
              onClick={() => handleSend()}
              disabled={sendMutation.isPending || (!input.trim() && attachments.length === 0)}
              className="h-9 w-9 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function ChatStructuredCard({
  card,
  options,
}: {
  card: NonNullable<ChatMessage["card"]>;
  options?: InteractiveOption[];
}) {
  const d = card.data;

  if (card.type === "saved_transaction" || card.type === "draft_transaction") {
    const isSaved = card.type === "saved_transaction";
    const isReversed = d.status === "reversed";
    const hasPendingConfirm =
      card.type === "draft_transaction" &&
      Boolean(options?.some((o) => !o.consumed && o.actionType === "CONFIRM_DRAFT_TRANSACTION"));

    const badgeTone = isReversed
      ? "danger"
      : isSaved
      ? "success"
      : hasPendingConfirm
      ? "warning"
      : "neutral";

    const badgeLabel = isReversed
      ? "Reversed"
      : isSaved
      ? "Saved"
      : hasPendingConfirm
      ? "Pending Confirmation"
      : "Draft";

    return (
      <Card
        className={cn(
          "mt-2 p-2.5 sm:p-3 border-[var(--border-default)]",
          isReversed ? "bg-[var(--status-danger-bg)]/50" : "bg-[var(--brand-cream)]"
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 mb-2 border-b border-[var(--border-default)]">
          <span className="text-xs font-semibold text-[var(--text-primary)] truncate inline-flex items-center gap-1.5">
            {isSaved && !isReversed && <AnimatedSuccess size={18} />}
            {String(d.title ?? "Transaction")}
          </span>
          <Badge tone={badgeTone}>{badgeLabel}</Badge>
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[var(--text-secondary)] shrink-0">Party</span>
            <span className="font-medium text-end truncate">{String(d.partyName ?? "-")}</span>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[var(--text-secondary)] shrink-0">Items</span>
            <span className="font-medium text-end truncate">{String(d.itemsSummary ?? "-")}</span>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[var(--text-secondary)] shrink-0">Total Amount</span>
            <span className="font-semibold tabular-nums whitespace-nowrap">
              {formatPKR(Number(d.totalAmount ?? 0))}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[var(--text-secondary)] shrink-0">Paid (Cash)</span>
            <span className="font-semibold tabular-nums whitespace-nowrap text-[var(--status-success)]">
              {formatPKR(Number(d.paidAmount ?? 0))}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[var(--text-secondary)] shrink-0">Udhaar (Balance)</span>
            <span className="font-semibold tabular-nums whitespace-nowrap text-[var(--brand-primary)]">
              {formatPKR(Number(d.outstandingAmount ?? 0))}
            </span>
          </div>
        </div>

        {Boolean(d.serial) && (
          <div className="mt-2 pt-1.5 border-t border-[var(--border-default)] flex flex-wrap items-center justify-between gap-2 text-[10px]">
            <span className="font-bold text-[var(--brand-primary)] bg-[var(--bg-card)] border border-[var(--brand-primary)]/30 rounded-md px-2 py-0.5 whitespace-nowrap">
              {String(d.serial)}
            </span>
            <span className="text-[var(--text-secondary)] truncate">
              {[d.transactionType, d.date].filter(Boolean).map(String).join(" • ")}
            </span>
          </div>
        )}
      </Card>
    );
  }

  if (card.type === "khata_statement") {
    return (
      <Card className="mt-2 p-2.5 bg-[var(--bg-subtle)] text-xs space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-sm truncate">{String(d.partyName)}</p>
          <Badge tone="neutral" className="capitalize">
            {String(d.partyType)}
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-[var(--text-secondary)]">{String(d.direction)}</span>
          <span className="font-bold text-sm tabular-nums whitespace-nowrap">
            {formatPKR(Number(d.balance ?? 0))}
          </span>
        </div>
      </Card>
    );
  }

  if (card.type === "business_summary") {
    return (
      <Card className="mt-2 p-2.5 bg-[var(--bg-subtle)] grid grid-cols-2 gap-2.5 text-xs">
        <div className="min-w-0">
          <p className="text-[var(--text-secondary)] text-[11px]">Sales</p>
          <p className="font-bold tabular-nums whitespace-nowrap">
            {formatPKR(Number(d.sales ?? 0))}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[var(--text-secondary)] text-[11px]">Purchases</p>
          <p className="font-bold tabular-nums whitespace-nowrap">
            {formatPKR(Number(d.purchases ?? 0))}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[var(--text-secondary)] text-[11px]">Expenses</p>
          <p className="font-bold tabular-nums whitespace-nowrap">
            {formatPKR(Number(d.expenses ?? 0))}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[var(--text-secondary)] text-[11px]">Net Profit</p>
          <p className="font-bold tabular-nums whitespace-nowrap text-[var(--status-success)]">
            {formatPKR(Number(d.netProfit ?? 0))}
          </p>
        </div>
      </Card>
    );
  }

  if (card.type === "inventory_summary") {
    const topLow = Array.isArray(d.topLowStock) ? (d.topLowStock as string[]) : [];
    return (
      <Card className="mt-2 p-2.5 bg-[var(--bg-subtle)] text-xs space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <span>Total Items: {String(d.totalItems)}</span>
          <span className="font-bold tabular-nums whitespace-nowrap">
            {formatPKR(Number(d.totalValue ?? 0))}
          </span>
        </div>
        {topLow.length > 0 && (
          <p className="text-[var(--status-warning)]">Low Stock: {topLow.join(", ")}</p>
        )}
      </Card>
    );
  }

  if (card.type === "reversal_confirmation") {
    return (
      <Card className="mt-2 p-2.5 bg-[var(--status-danger-bg)] border-[var(--status-danger)]/30 text-xs space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-[var(--status-danger)] inline-flex items-center gap-1">
            <RotateCcw className="h-3 w-3" /> Reversal Entry
          </span>
          <Badge tone="danger">Reversed</Badge>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[var(--text-secondary)] truncate">{String(d.particulars)}</span>
          {d.amount != null && (
            <span className="font-semibold tabular-nums whitespace-nowrap text-[var(--status-danger)]">
              {formatPKR(Number(d.amount))}
            </span>
          )}
        </div>
        <p className="text-[10px] font-semibold text-[var(--status-danger)]">
          Serial: {String(d.serial)}
        </p>
      </Card>
    );
  }

  return null;
}
