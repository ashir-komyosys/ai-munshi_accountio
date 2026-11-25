import React from "react";
import { TransactionsView } from "@/components/transactions/TransactionsView";

export default function PurchasesTransactionsPage() {
  return <TransactionsView initialGroup="purchases" title="Purchases (Maal Khareedna)" />;
}
