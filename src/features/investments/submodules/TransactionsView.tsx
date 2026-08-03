import React from "react";
import { useInvestmentTransactions } from "../hooks/useInvestmentQueries";
import { TransactionTable } from "../components/TransactionTable";

export const TransactionsView: React.FC = () => {
  const { data: transactions = [], isLoading } = useInvestmentTransactions();

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse p-4">
        <div className="h-12 bg-slate-900 rounded-2xl" />
        <div className="h-64 bg-slate-900 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TransactionTable transactions={transactions} />
    </div>
  );
};
