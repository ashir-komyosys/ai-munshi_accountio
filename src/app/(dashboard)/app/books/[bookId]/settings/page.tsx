"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LoadingSkeleton, PageHeader } from "@/components/common/StatusStates";
import { Button, Card, Input } from "@/components/ui/primitives";
import { services } from "@/services";

export default function BookSettingsPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: book, isLoading } = useQuery({
    queryKey: ["book", bookId],
    queryFn: () => services.books.getBook(bookId),
  });

  const [name, setName] = useState<string | null>(null);
  const [businessType, setBusinessType] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      services.books.updateBook(bookId, {
        name: name ?? book?.name ?? "",
        businessType: businessType ?? book?.businessType ?? "",
      }),
    onSuccess: () => {
      toast.success("Book settings updated");
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["book", bookId] });
      router.push(`/app/books/${bookId}`);
    },
  });

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="max-w-xl space-y-4">
      <PageHeader title="Book Settings" subtitle="Update book name and business category." />
      <Card className="p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium mb-1">Book Name</label>
            <Input
              value={name ?? book?.name ?? ""}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Business Type</label>
            <Input
              value={businessType ?? book?.businessType ?? ""}
              onChange={(e) => setBusinessType(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
