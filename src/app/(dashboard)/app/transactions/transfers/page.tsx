import React from "react";
import { TransactionsView } from "@/components/transactions/TransactionsView";

export default function TransfersTransactionsPage() {
  return <TransactionsView initialGroup="transfers" title="Cash & Bank Transfers" />;
}
