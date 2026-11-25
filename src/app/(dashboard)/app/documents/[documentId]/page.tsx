"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { LoadingSkeleton, PageHeader } from "@/components/common/StatusStates";
import { Badge, Button, Card } from "@/components/ui/primitives";
import { services } from "@/services";

export default function DocumentDetailPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const { data: doc, isLoading } = useQuery({
    queryKey: ["document", documentId],
    queryFn: () => services.documents.getDocument(documentId),
  });

  if (isLoading) return <LoadingSkeleton />;
  if (!doc) return <Card className="p-6">Document not found.</Card>;

  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader
        title={doc.title}
        subtitle={`${doc.fileName} • ${doc.date} • ${(doc.sizeBytes / 1024).toFixed(1)} KB`}
        actions={
          <Button
            size="sm"
            onClick={() => {
              const a = document.createElement("a");
              a.href =
                doc.dataUrl ||
                `data:text/plain;charset=utf-8,${encodeURIComponent(doc.title)}`;
              a.download = doc.fileName;
              a.click();
            }}
          >
            <Download className="h-4 w-4" /> Download
          </Button>
        }
      />

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Badge tone="brand">{doc.category}</Badge>
          {doc.transactionSerial && <Badge tone="neutral">{doc.transactionSerial}</Badge>}
        </div>
        {doc.dataUrl && doc.mimeType.startsWith("image/") ? (
          <img src={doc.dataUrl} alt={doc.title} className="max-h-[480px] rounded-xl border" />
        ) : (
          <div className="p-10 rounded-xl bg-[var(--bg-subtle)] flex flex-col items-center justify-center text-center">
            <FileText className="h-10 w-10 text-[var(--brand-primary)] mb-2" />
            <p className="text-sm font-semibold">{doc.fileName}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Preview ready for download in demo mode.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
