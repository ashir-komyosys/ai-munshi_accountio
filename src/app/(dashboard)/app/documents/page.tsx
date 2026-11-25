"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Grid,
  List,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState, LoadingSkeleton, PageHeader } from "@/components/common/StatusStates";
import { Badge, Button, Card, Input, Select } from "@/components/ui/primitives";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";
import type { DocumentCategory, DocumentRecord } from "@/types";

const CATEGORIES: Array<{ key: DocumentCategory | "all"; label: string }> = [
  { key: "all", label: "All Documents" },
  { key: "invoice", label: "Invoices" },
  { key: "bill", label: "Bills" },
  { key: "receipt", label: "Receipts" },
  { key: "voucher", label: "Vouchers" },
  { key: "report", label: "Reports" },
  { key: "other", label: "Others" },
];

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const activeBookId = useUIStore((s) => s.activeBookId);
  const [cat, setCat] = useState<DocumentCategory | "all">("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [uploadCat, setUploadCat] = useState<DocumentCategory>("bill");
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["documents", activeBookId],
    queryFn: () => services.documents.listDocuments(activeBookId),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 5 * 1024 * 1024) throw new Error("Max file size is 5MB");
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.readAsDataURL(file);
      });
      return services.documents.uploadDocument({
        bookId: activeBookId,
        title: file.name.replace(/\.[^.]+$/, ""),
        category: uploadCat,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        dataUrl,
      });
    },
    onSuccess: () => {
      toast.success("Document saved to local IndexedDB");
      queryClient.invalidateQueries({ queryKey: ["documents", activeBookId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => services.documents.deleteDocument(id),
    onSuccess: () => {
      toast.success("Document removed");
      queryClient.invalidateQueries({ queryKey: ["documents", activeBookId] });
    },
  });

  const handleDownload = (doc: DocumentRecord) => {
    const content = doc.dataUrl
      ? doc.dataUrl
      : `data:text/plain;charset=utf-8,${encodeURIComponent(
          `Accountio AI Demo Document\nTitle: ${doc.title}\nFile: ${doc.fileName}\nDate: ${doc.date}`
        )}`;
    const a = document.createElement("a");
    a.href = content;
    a.download = doc.fileName;
    a.click();
    toast.success(`Downloading ${doc.fileName}`);
  };

  if (isLoading) return <LoadingSkeleton />;

  const filtered = docs.filter((d) => {
    if (cat !== "all" && d.category !== cat) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Documents"
        subtitle="Bills, receipts, vouchers aur reports ka record."
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={uploadCat}
              onChange={(e) => setUploadCat(e.target.value as DocumentCategory)}
              className="w-28 h-8.5 text-xs"
            >
              <option value="bill">Bill</option>
              <option value="invoice">Invoice</option>
              <option value="receipt">Receipt</option>
              <option value="voucher">Voucher</option>
              <option value="other">Other</option>
            </Select>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf,.xlsx,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadMutation.mutate(file);
              }}
            />
            <Button size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Upload Document
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <Button
            key={c.key}
            size="sm"
            variant={cat === c.key ? "primary" : "outline"}
            onClick={() => setCat(c.key)}
          >
            {c.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          <Button
            variant={view === "grid" ? "primary" : "outline"}
            size="icon"
            aria-label="Grid view"
            onClick={() => setView("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "primary" : "outline"}
            size="icon"
            aria-label="List view"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No Documents"
          description="Upload a bill, receipt, or invoice to store it in local demo storage."
          actionLabel="Upload Document"
          onAction={() => fileRef.current?.click()}
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((doc) => {
            const isExcel = doc.fileName.endsWith(".xlsx") || doc.fileName.endsWith(".csv");
            return (
              <Card key={doc.id} className="p-4 flex items-center justify-between gap-3">
                <Link href={`/app/documents/${doc.id}`} className="flex items-center gap-3 min-w-0">
                  <div
                    className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                      isExcel
                        ? "bg-[var(--status-success-bg)] text-[var(--status-success)]"
                        : "bg-[var(--status-danger-bg)] text-[var(--status-danger)]"
                    }`}
                  >
                    {isExcel ? <FileSpreadsheet className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{doc.title}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {doc.date} • {(doc.sizeBytes / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Download"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete"
                    onClick={() => deleteMutation.mutate(doc.id)}
                  >
                    <Trash2 className="h-4 w-4 text-[var(--status-danger)]" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)] text-left text-xs text-[var(--text-secondary)]">
                <th className="py-2.5 px-4">Title</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id} className="border-b border-[var(--border-default)]/60">
                  <td className="py-2.5 px-4 font-semibold">
                    <Link href={`/app/documents/${doc.id}`} className="hover:text-[var(--brand-primary)]">
                      {doc.title}
                    </Link>
                  </td>
                  <td className="py-2.5 px-4">
                    <Badge tone="neutral">{doc.category}</Badge>
                  </td>
                  <td className="py-2.5 px-4">{doc.date}</td>
                  <td className="py-2.5 px-4 text-end">
                    <Button size="sm" variant="ghost" onClick={() => handleDownload(doc)}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
