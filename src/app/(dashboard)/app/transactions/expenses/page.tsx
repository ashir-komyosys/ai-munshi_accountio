import React from "react";
import { TransactionsView } from "@/components/transactions/TransactionsView";

export default function ExpensesTransactionsPage() {
  return <TransactionsView initialGroup="expenses" title="Expenses (Kharcha)" />;
}
