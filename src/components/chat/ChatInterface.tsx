"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  Check,
  CheckCheck,
  Copy,
  FileText,
  Image as ImageIcon,
  Mic,
  Paperclip,
  Plus,
  RefreshCw,
  Send,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AiMunshiMascot } from "@/components/common/BrandAssets";
import { Badge, Button, Card } from "@/components/ui/primitives";
import { useDictionary } from "@/hooks/useDictionary";
import { formatPKR } from "@/lib/money";
import { cn, formatTime, generateId } from "@/lib/utils";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";
import type { ChatAttachment, ChatMessage, InteractiveOption } from "@/types";

const SUGGESTED_PROMPTS = [
  "Aaj ka hisaab dikhao",
  "Ali Traders se 150,000 ka yarn khareeda, 50,000 cash diya, baqi udhaar",
  "Ibrahim Traders ko 90,000 ka maal udhaar becha",
  "5,000 transport kharcha likh do",
  "Stock kitna baqi hai?",
  "Profit aur loss report dikhao",
];

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

  // Voice recording state (MediaRecorder API)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSec, setRecordingSec] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: conversation } = useQuery({
    queryKey: ["conversation", activeBookId],
    queryFn: () => services.chat.getOrCreateConversation(activeBookId),
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", conversation?.id],
    queryFn: () => services.chat.listMessages(conversation!.id),
    enabled: !!conversation?.id,
  });

  useEffect(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length]);

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
      return services.chat.sendMessage({
        conversationId: conversation.id,
        bookId: activeBookId,
        text: vars.text,
        clientMessageId: vars.clientMessageId,
        source: vars.source,
        attachments: vars.attachments,
      });
    },
    onSuccess: () => {
      invalidateAccounting();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to send message");
    },
  });

  const optionMutation = useMutation({
    mutationFn: async (vars: { messageId: string; option: InteractiveOption }) => {
      if (!conversation) throw new Error("Conversation not ready");
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
    },
  });

  const handleSend = (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text && attachments.length === 0) return;
    const clientMessageId = generateId("cm");
    const currentAttachments = [...attachments];
    if (!overrideText) setInput("");
    setAttachments([]);
    sendMutation.mutate({
      text: text || (currentAttachments[0]?.kind === "audio" ? "Voice note" : "Uploaded bill/image"),
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAttachments((prev) => [
          ...prev,
          {
            id: generateId("aud"),
            name: `Voice-Note-${recordingSec}s.webm`,
            mimeType: "audio/webm",
            sizeBytes: blob.size,
            dataUrl: url,
            kind: "audio",
            durationSec: recordingSec,
          },
        ]);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSec(0);
      timerRef.current = setInterval(() => {
        setRecordingSec((s) => s + 1);
      }, 1000);
    } catch {
      toast.error("Microphone permission denied or unavailable");
    }
  };

  const stopVoiceRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-[var(--bg-app)] rounded-2xl border border-[var(--border-default)] overflow-hidden",
        compact ? "h-full" : "h-[calc(100vh-8.5rem)] min-h-[520px]"
      )}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleFileSelect(e.dataTransfer.files);
      }}
    >
      {/* Top Demo Banner */}
      <div className="px-4 py-2 bg-[var(--brand-cream)] border-b border-[var(--border-default)] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AiMunshiMascot size={26} />
          <div>
            <p className="text-xs font-semibold text-[var(--text-primary)]">AI Munshi</p>
            <p className="text-[11px] text-[var(--text-secondary)]">{t.chat.simulatedNotice}</p>
          </div>
        </div>
        <Badge tone="brand">Demo Mode</Badge>
      </div>

      {/* Messages Area */}
      <div
        ref={listRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          setShowScrollBottom(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
        }}
        className="flex-1 overflow-y-auto p-4 space-y-4 relative"
      >
        {isLoading && (
          <p className="text-xs text-[var(--text-secondary)] text-center py-6">
            Loading conversation...
          </p>
        )}

        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={cn("flex gap-2.5", isUser ? "justify-end" : "justify-start")}
            >
              {!isUser && <AiMunshiMascot size={32} className="mt-1 hidden sm:block" />}
              <div className={cn("max-w-[88%] sm:max-w-[75%] space-y-2")}>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm shadow-[var(--shadow-xs)] border group relative",
                    isUser
                      ? "bg-[var(--chat-user-bubble)] text-[var(--chat-user-text)] border-transparent rounded-tr-sm"
                      : "bg-[var(--chat-ai-bubble)] text-[var(--text-primary)] border-[var(--border-default)] rounded-tl-sm"
                  )}
                >
                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {msg.attachments.map((att) =>
                        att.kind === "audio" && att.dataUrl ? (
                          <div key={att.id} className="bg-black/5 rounded-xl p-2">
                            <audio controls src={att.dataUrl} className="h-8 w-full max-w-[240px]" />
                            <p className="text-[10px] opacity-75 mt-1">{t.chat.voiceNotice}</p>
                          </div>
                        ) : att.kind === "image" && att.dataUrl ? (
                          <img
                            key={att.id}
                            src={att.dataUrl}
                            alt={att.name}
                            className="max-h-44 rounded-xl border border-[var(--border-default)] object-cover"
                          />
                        ) : (
                          <div
                            key={att.id}
                            className="flex items-center gap-2 text-xs bg-black/5 px-2.5 py-1.5 rounded-lg"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span className="truncate">{att.name}</span>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Embedded Structured Card */}
                  {msg.card && <ChatStructuredCard card={msg.card} />}

                  <div className="mt-1.5 flex items-center justify-end gap-2 text-[10px] opacity-70">
                    <button
                      type="button"
                      aria-label="Copy message"
                      onClick={() => copyMessage(msg.id, msg.text)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      {copiedId === msg.id ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                    <span>{formatTime(msg.timestamp)}</span>
                    {isUser && <CheckCheck className="h-3 w-3 text-[var(--status-success)]" />}
                    {msg.status === "failed" && (
                      <button
                        type="button"
                        onClick={() =>
                          sendMutation.mutate({
                            text: msg.text,
                            clientMessageId: msg.clientMessageId,
                          })
                        }
                        className="text-[var(--status-danger)] flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="h-3 w-3" /> Retry
                      </button>
                    )}
                  </div>
                </div>

                {/* Interactive Option Buttons */}
                {msg.options && msg.options.length > 0 && (
                  <div className="flex flex-wrap gap-2">
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
            </div>
          );
        })}

        {sendMutation.isPending && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <AiMunshiMascot size={24} />
            <span className="px-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-default)]">
              AI Munshi likh raha hai...
            </span>
          </div>
        )}
      </div>

      {/* Scroll to bottom */}
      {showScrollBottom && (
        <div className="relative">
          <button
            type="button"
            aria-label="Scroll to bottom"
            onClick={() => {
              if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
            }}
            className="absolute right-4 bottom-2 h-8 w-8 rounded-full bg-[var(--bg-card)] border border-[var(--border-default)] shadow-sm flex items-center justify-center cursor-pointer"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Suggested Prompts */}
      <div className="px-3 py-2 border-t border-[var(--border-default)] bg-[var(--bg-subtle)]/50 flex items-center gap-1.5 overflow-x-auto">
        {SUGGESTED_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => handleSend(p)}
            className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-default)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition-colors cursor-pointer"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-[var(--border-default)] bg-[var(--bg-card)] flex flex-wrap gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-default)] text-xs"
            >
              {att.kind === "audio" ? (
                <Mic className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
              ) : att.kind === "image" ? (
                <ImageIcon className="h-3.5 w-3.5 text-[var(--status-info)]" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              <span className="max-w-[160px] truncate">{att.name}</span>
              <button
                type="button"
                aria-label="Remove attachment"
                onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== att.id))}
                className="text-[var(--text-muted)] hover:text-[var(--status-danger)] cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="p-3 border-t border-[var(--border-default)] bg-[var(--bg-card)] flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.xlsx,.csv"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Upload file or bill"
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Attach image"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {isRecording ? (
          <div className="flex-1 flex items-center justify-between px-3 h-9.5 rounded-xl bg-[var(--status-danger-bg)] text-[var(--status-danger)] text-xs font-medium">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--status-danger)] animate-pulse" />
              Recording ({recordingSec}s) — Simulated Voice Demo
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={stopVoiceRecording}
                className="px-2 py-1 rounded-lg bg-[var(--status-danger)] text-white flex items-center gap-1 cursor-pointer"
              >
                <Square className="h-3 w-3" /> Stop
              </button>
              <button
                type="button"
                aria-label="Cancel recording"
                onClick={() => {
                  if (timerRef.current) clearInterval(timerRef.current);
                  mediaRecorderRef.current?.stop();
                  setIsRecording(false);
                  setAttachments([]);
                }}
                className="p-1 cursor-pointer"
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
            >
              <Mic className="h-4 w-4" />
            </Button>
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={t.chat.placeholder}
              className="flex-1 resize-none rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)] px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none max-h-28"
            />
            <Button
              size="icon"
              aria-label="Send message"
              onClick={() => handleSend()}
              disabled={sendMutation.isPending}
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
}: {
  card: NonNullable<ChatMessage["card"]>;
}) {
  const d = card.data;
  if (card.type === "saved_transaction" || card.type === "draft_transaction") {
    return (
      <Card className="mt-2.5 p-3 bg-[var(--brand-cream)] border-[var(--border-default)]">
        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-[var(--border-default)]">
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            {String(d.title ?? "Transaction")}
          </span>
          <Badge tone={card.type === "saved_transaction" ? "success" : "warning"}>
            {card.type === "saved_transaction" ? "Saved" : "Draft"}
          </Badge>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 text-xs flex-1">
            <div className="flex justify-between gap-4">
              <span className="text-[var(--text-secondary)]">Party:</span>
              <span className="font-medium">{String(d.partyName ?? "-")}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[var(--text-secondary)]">Items:</span>
              <span className="font-medium">{String(d.itemsSummary ?? "-")}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[var(--text-secondary)]">Total Amount:</span>
              <span className="font-semibold tabular-nums">
                {formatPKR(Number(d.totalAmount ?? 0))}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[var(--text-secondary)]">Paid (Cash):</span>
              <span className="font-semibold tabular-nums text-[var(--status-success)]">
                {formatPKR(Number(d.paidAmount ?? 0))}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[var(--text-secondary)]">Udhaar (Balance):</span>
              <span className="font-semibold tabular-nums text-[var(--brand-primary)]">
                {formatPKR(Number(d.outstandingAmount ?? 0))}
              </span>
            </div>
          </div>
          {Boolean(d.serial) && (
            <div className="shrink-0 rounded-xl border border-[var(--brand-primary)]/40 bg-[var(--bg-card)] px-2.5 py-2 text-center">
              <p className="text-[10px] font-bold text-[var(--brand-primary)]">
                {String(d.serial)}
              </p>
              <p className="text-[9px] text-[var(--text-secondary)]">
                {String(d.transactionType ?? "")}
              </p>
              <p className="text-[9px] text-[var(--text-muted)] mt-0.5">{String(d.date ?? "")}</p>
            </div>
          )}
        </div>
      </Card>
    );
  }

  if (card.type === "khata_statement") {
    return (
      <Card className="mt-2.5 p-3 bg-[var(--bg-subtle)] text-xs space-y-1">
        <p className="font-semibold text-sm">{String(d.partyName)}</p>
        <p className="text-[var(--text-secondary)] capitalize">{String(d.partyType)}</p>
        <div className="flex items-center justify-between pt-1">
          <span>{String(d.direction)}</span>
          <span className="font-bold text-sm tabular-nums">
            {formatPKR(Number(d.balance ?? 0))}
          </span>
        </div>
      </Card>
    );
  }

  if (card.type === "business_summary") {
    return (
      <Card className="mt-2.5 p-3 bg-[var(--bg-subtle)] grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-[var(--text-secondary)]">Sales</p>
          <p className="font-bold tabular-nums">{formatPKR(Number(d.sales ?? 0))}</p>
        </div>
        <div>
          <p className="text-[var(--text-secondary)]">Purchases</p>
          <p className="font-bold tabular-nums">{formatPKR(Number(d.purchases ?? 0))}</p>
        </div>
        <div>
          <p className="text-[var(--text-secondary)]">Expenses</p>
          <p className="font-bold tabular-nums">{formatPKR(Number(d.expenses ?? 0))}</p>
        </div>
        <div>
          <p className="text-[var(--text-secondary)]">Net Profit</p>
          <p className="font-bold tabular-nums text-[var(--status-success)]">
            {formatPKR(Number(d.netProfit ?? 0))}
          </p>
        </div>
      </Card>
    );
  }

  if (card.type === "inventory_summary") {
    const topLow = Array.isArray(d.topLowStock) ? (d.topLowStock as string[]) : [];
    return (
      <Card className="mt-2.5 p-3 bg-[var(--bg-subtle)] text-xs space-y-1.5">
        <div className="flex justify-between">
          <span>Total Items: {String(d.totalItems)}</span>
          <span className="font-bold tabular-nums">{formatPKR(Number(d.totalValue ?? 0))}</span>
        </div>
        {topLow.length > 0 && (
          <p className="text-[var(--status-warning)]">Low Stock: {topLow.join(", ")}</p>
        )}
      </Card>
    );
  }

  if (card.type === "reversal_confirmation") {
    return (
      <Card className="mt-2.5 p-3 bg-[var(--status-danger-bg)] text-xs">
        <p className="font-semibold text-[var(--status-danger)]">
          Reversed ({String(d.serial)})
        </p>
        <p className="mt-0.5">{String(d.particulars)}</p>
      </Card>
    );
  }

  return null;
}
