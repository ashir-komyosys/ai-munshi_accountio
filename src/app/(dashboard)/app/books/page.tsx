"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, BookOpen, Check, Plus, RotateCcw, Search, Settings } from "lucide-react";
import { toast } from "sonner";
import { LoadingSkeleton, PageHeader } from "@/components/common/StatusStates";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import { formatShortDate } from "@/lib/utils";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";

export default function MyBooksPage() {
  const queryClient = useQueryClient();
  const { activeBookId, setActiveBookId } = useUIStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all");

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: () => services.books.listBooks(),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => services.books.archiveBook(id),
    onSuccess: () => {
      toast.success("Book archived");
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => services.books.restoreBook(id),
    onSuccess: () => {
      toast.success("Book restored");
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });

  if (isLoading) return <LoadingSkeleton />;

  const filtered = books.filter((b) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (
      search &&
      !b.name.toLowerCase().includes(search.toLowerCase()) &&
      !b.businessType.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="My Books"
        subtitle="Apne business ke alag alag books (accounts) manage karein."
        actions={
          <Link href="/app/books/new">
            <Button size="sm">
              <Plus className="h-4 w-4" /> New Book
            </Button>
          </Link>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search books..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "active", "archived"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "primary" : "outline"}
              onClick={() => setStatusFilter(s)}
              className="capitalize"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((book) => {
          const isCurrent = book.id === activeBookId;
          return (
            <Card
              key={book.id}
              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isCurrent ? "border-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)]/20" : ""
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] flex items-center justify-center shrink-0">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/app/books/${book.id}`}
                      className="font-heading font-bold text-base hover:text-[var(--brand-primary)]"
                    >
                      {book.name}
                    </Link>
                    <Badge tone={book.status === "active" ? "success" : "neutral"}>
                      {book.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                    {isCurrent && <Badge tone="brand">Selected</Badge>}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {book.businessType} • {book.currency} • Last Entry{" "}
                    {formatShortDate(book.lastActivityAt)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!isCurrent && book.status === "active" && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setActiveBookId(book.id);
                      queryClient.invalidateQueries();
                      toast.success(`Switched to ${book.name}`);
                    }}
                  >
                    <Check className="h-3.5 w-3.5" /> Switch Book
                  </Button>
                )}
                <Link href={`/app/books/${book.id}/settings`}>
                  <Button variant="outline" size="sm">
                    <Settings className="h-3.5 w-3.5" /> Settings
                  </Button>
                </Link>
                {book.status === "active" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isCurrent}
                    onClick={() => archiveMutation.mutate(book.id)}
                    title={isCurrent ? "Switch away before archiving" : "Archive book"}
                  >
                    <Archive className="h-3.5 w-3.5" /> Archive
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => restoreMutation.mutate(book.id)}
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Restore
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
