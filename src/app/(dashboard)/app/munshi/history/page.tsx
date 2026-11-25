"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/common/StatusStates";
import { Button, Card } from "@/components/ui/primitives";
import { formatShortDate } from "@/lib/utils";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";

export default function MunshiHistoryPage() {
  const activeBookId = useUIStore((s) => s.activeBookId);
  const { data: conversation } = useQuery({
    queryKey: ["conversation", activeBookId],
    queryFn: () => services.chat.getOrCreateConversation(activeBookId),
  });
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", conversation?.id],
    queryFn: () => services.chat.listMessages(conversation!.id),
    enabled: !!conversation?.id,
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="AI Munshi Conversation History"
        subtitle="Past conversational accounting sessions for the active book."
        actions={
          <Link href="/app/munshi">
            <Button size="sm">
              Resume Chat <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      {conversation && (
        <Card className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">{conversation.title}</p>
              <p className="text-xs text-[var(--text-secondary)]">
                {messages.length} messages • Updated {formatShortDate(conversation.updatedAt)}
              </p>
            </div>
          </div>
          <Link href="/app/munshi">
            <Button variant="outline" size="sm">
              Open
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
