"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FinancialAmount } from "@/components/common/FinancialAmount";
import { LoadingSkeleton, PageHeader } from "@/components/common/StatusStates";
import { Badge, Button, Card } from "@/components/ui/primitives";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";

export default function BookDetailPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const setActiveBookId = useUIStore((s) => s.setActiveBookId);

  const { data: book, isLoading } = useQuery({
    queryKey: ["book", bookId],
    queryFn: () => services.books.getBook(bookId),
  });

  const { data: summary } = useQuery({
    queryKey: ["summary", bookId],
    queryFn: () => services.reports.getFinancialSummary(bookId),
  });

  if (isLoading) return <LoadingSkeleton />;
  if (!book) return <Card className="p-6">Book not found.</Card>;

  return (
    <div className="space-y-4">
      <PageHeader
        title={book.name}
        subtitle={`${book.businessType} • ${book.currency}`}
        actions={
          <>
            <Button size="sm" onClick={() => setActiveBookId(book.id)}>
              Set as Active Book
            </Button>
            <Link href={`/app/books/${book.id}/settings`}>
              <Button variant="outline" size="sm">
                Book Settings
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs text-[var(--text-secondary)]">Status</p>
          <Badge tone={book.status === "active" ? "success" : "neutral"} className="mt-2">
            {book.status}
          </Badge>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-secondary)]">Opening Cash</p>
          <p className="text-lg font-bold mt-1">
            <FinancialAmount amount={book.openingCash} />
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-secondary)]">Opening Bank</p>
          <p className="text-lg font-bold mt-1">
            <FinancialAmount amount={book.openingBank} />
          </p>
        </Card>
      </div>

      {summary && (
        <Card className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Total Sales</p>
            <FinancialAmount amount={summary.totalSales} className="text-base" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Total Purchases</p>
            <FinancialAmount amount={summary.totalPurchases} className="text-base" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Receivables</p>
            <FinancialAmount amount={summary.totalReceivables} className="text-base" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Payables</p>
            <FinancialAmount amount={summary.totalPayables} className="text-base" />
          </div>
        </Card>
      )}
    </div>
  );
}
