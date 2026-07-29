import { useTransactions } from "../../hooks/useFinanceQueries";
import { formatCurrency } from "../../utils/formatters";

export default function TransactionList() {
  const { data: response, isLoading, isError } = useTransactions();
  const transactions = response?.data || [];

  if (isLoading) {
    return (
      <section className="mt-8 animate-pulse">
        <h2 className="text-xl font-semibold mb-4 text-slate-100">Recent Transactions</h2>
        <div className="space-y-2">
          <div className="h-12 bg-slate-900/60 rounded-xl border border-slate-800" />
          <div className="h-12 bg-slate-900/60 rounded-xl border border-slate-800" />
        </div>
      </section>
    );
  }

  if (isError) {
    return null;
  }

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold mb-4 text-slate-100">Recent Transactions</h2>
      {transactions.length === 0 ? (
        <p className="text-xs text-slate-400 p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center">
          No recent transactions found.
        </p>
      ) : (
        <ul className="space-y-2">
          {transactions.slice(0, 5).map((txn) => (
            <li
              key={txn.id}
              className="flex justify-between items-center p-3 rounded-xl bg-slate-900/60 border border-slate-800 shadow-sm"
            >
              <div>
                <span className="font-medium text-slate-100 text-sm">{txn.description}</span>
                {txn.categoryName && (
                  <p className="text-xs text-slate-400">{txn.categoryName}</p>
                )}
              </div>
              <span
                className={`font-bold text-sm ${
                  txn.direction === "INFLOW" ? "text-emerald-400" : "text-slate-100"
                }`}
              >
                {txn.direction === "INFLOW" ? "+" : "-"}{formatCurrency(txn.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
