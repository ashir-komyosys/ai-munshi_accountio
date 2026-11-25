import React from "react";
import { TransactionsView } from "@/components/transactions/TransactionsView";

export default function JournalsTransactionsPage() {
  return <TransactionsView initialGroup="journals" title="Journal & Reversal Entries" />;
}
