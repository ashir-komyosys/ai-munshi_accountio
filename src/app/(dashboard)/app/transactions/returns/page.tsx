import React from "react";
import { TransactionsView } from "@/components/transactions/TransactionsView";

export default function ReturnsTransactionsPage() {
  return <TransactionsView initialGroup="returns" title="Sales & Purchase Returns" />;
}
