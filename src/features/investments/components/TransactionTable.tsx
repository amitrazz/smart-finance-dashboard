import React, { useState } from "react";
import { Trade, InvestmentTradeType } from "../../../types";
import { formatCurrency } from "../../../utils/formatters";
import { Filter, Search } from "lucide-react";
import { NAV_TAB_L2 } from "../../../styles/navTabTokens";

interface TransactionTableProps {
  transactions: Trade[];
}

const TYPE_FILTERS: Array<"ALL" | InvestmentTradeType> = [
  "ALL",
  "BUY",
  "SELL",
  "BONUS",
  "SPLIT",
  "DIVIDEND_REINVEST",
  "SIP_INSTALLMENT",
];

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | InvestmentTradeType>("ALL");

  const filteredTxns = transactions.filter((tx) => {
    const name = tx.security?.name || "";
    const symbol = tx.security?.symbol || "";
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) || symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "ALL" || tx.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type: InvestmentTradeType) => {
    switch (type) {
      case "BUY":
        return <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/20">BUY</span>;
      case "SELL":
        return <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 font-bold text-xs border border-rose-500/20">SELL</span>;
      case "DIVIDEND_REINVEST":
        return <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold text-xs border border-indigo-500/20">DIVIDEND REINVEST</span>;
      case "SIP_INSTALLMENT":
        return <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 font-bold text-xs border border-sky-500/20">SIP</span>;
      default:
        return <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs border border-slate-700">{type}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions by asset/symbol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {TYPE_FILTERS.map((tf) => (
            <button
              key={tf}
              onClick={() => setTypeFilter(tf)}
              className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                typeFilter === tf
                  ? `${NAV_TAB_L2}`
                  : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {tf.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl bg-slate-900/70 border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Security / Asset</th>
                <th className="p-4">Trade Type</th>
                <th className="p-4 text-right">Quantity</th>
                <th className="p-4 text-right">Price / Unit</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-right">Fees</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTxns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                    No transactions match your search filters.
                  </td>
                </tr>
              ) : (
                filteredTxns.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 text-xs font-mono text-slate-400">{tx.tradeDate}</td>
                    <td className="p-4 font-bold text-slate-100">
                      <div>
                        <span>{tx.security?.name || "Unknown Security"}</span>
                        <p className="text-xs font-mono text-slate-400">{tx.security?.symbol || "—"}</p>
                      </div>
                    </td>
                    <td className="p-4">{getTypeBadge(tx.type)}</td>
                    <td className="p-4 text-right font-medium text-slate-200">{tx.quantity}</td>
                    <td className="p-4 text-right text-xs font-mono text-slate-400">
                      {formatCurrency({ amount: tx.price, currency: tx.amount?.currency || "INR" })}
                    </td>
                    <td className="p-4 text-right font-extrabold text-slate-100 font-mono">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="p-4 text-right text-xs font-mono text-slate-400">{formatCurrency(tx.fees)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
