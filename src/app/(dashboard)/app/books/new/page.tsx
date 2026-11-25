"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/StatusStates";
import { Button, Card, Input, Select } from "@/components/ui/primitives";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";

export default function NewBookPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setActiveBookId = useUIStore((s) => s.setActiveBookId);

  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("Yarn & Cloth Trading");
  const [openingCash, setOpeningCash] = useState("50000");
  const [openingBank, setOpeningBank] = useState("100000");

  const mutation = useMutation({
    mutationFn: () =>
      services.books.createBook({
        name,
        businessType,
        openingCash: Number(openingCash) || 0,
        openingBank: Number(openingBank) || 0,
      }),
    onSuccess: (book) => {
      toast.success(`Created book "${book.name}"`);
      setActiveBookId(book.id);
      queryClient.invalidateQueries({ queryKey: ["books"] });
      router.push("/app/books");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="max-w-xl space-y-4">
      <PageHeader title="Create New Book" subtitle="Start an isolated accounting ledger." />
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Faisalabad Wholesale Branch"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Business Type</label>
            <Select value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
              <option value="Yarn & Cloth Trading">Yarn & Cloth Trading</option>
              <option value="Retail Sales">Retail Sales</option>
              <option value="Wholesale Distribution">Wholesale Distribution</option>
              <option value="Personal / Other">Personal / Other</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Opening Cash (PKR)</label>
              <Input
                type="number"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Opening Bank (PKR)</label>
              <Input
                type="number"
                value={openingBank}
                onChange={(e) => setOpeningBank(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create Book"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
