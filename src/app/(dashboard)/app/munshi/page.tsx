"use client";

import React from "react";
import Link from "next/link";
import { History } from "lucide-react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { PageHeader } from "@/components/common/StatusStates";
import { Button } from "@/components/ui/primitives";

export default function MunshiChatPage() {
  return (
    <div className="space-y-3">
      <PageHeader
        title="AI Munshi (Chat)"
        subtitle="Record sales, purchases, expenses, and check khatas in Roman Urdu or English."
        actions={
          <Link href="/app/munshi/history">
            <Button variant="outline" size="sm">
              <History className="h-4 w-4" /> Conversation History
            </Button>
          </Link>
        }
      />
      <ChatInterface />
    </div>
  );
}
