import React, { useState } from "react";
import { InvestmentTransaction } from "../types/investmentTypes";
import { formatCurrency } from "../../../utils/formatters";
import { Filter, Search } from "lucide-react";

interface TransactionTableProps {
  transactions: InvestmentTransaction[];
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const filteredTxns = transactions.filter((tx) => {
    const matchesSearch =
      tx.securityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "ALL" || tx.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type: InvestmentTransaction["type"]) => {
    switch (type) {
      case "BUY":
        return <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/20">BUY</span>;
      case "SELL":
        return <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 font-bold text-xs border border-rose-500/20">SELL</span>;
      case "DIVIDEND":
      case "INTEREST":
        return <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold text-xs border border-indigo-500/20">{type}</span>;
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
          {(["ALL", "BUY", "SELL", "DIVIDEND", "INTEREST"] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTypeFilter(tf)}
              className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                typeFilter === tf
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {tf}
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
                <th className="p-4">Action Type</th>
                <th className="p-4 text-right">Quantity</th>
                <th className="p-4 text-right">Unit Price</th>
                <th className="p-4 text-right">Total Amount</th>
                <th className="p-4">Broker / Account</th>
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
                    <td className="p-4 text-xs font-mono text-slate-400">{tx.date}</td>
                    <td className="p-4 font-bold text-slate-100">
                      <div>
                        <span>{tx.securityName}</span>
                        <p className="text-xs font-mono text-slate-400">{tx.symbol}</p>
                      </div>
                    </td>
                    <td className="p-4">{getTypeBadge(tx.type)}</td>
                    <td className="p-4 text-right font-medium text-slate-200">
                      {tx.quantity ? tx.quantity.toLocaleString() : "—"}
                    </td>
                    <td className="p-4 text-right text-xs font-mono text-slate-400">
                      {tx.pricePerUnit ? formatCurrency(tx.pricePerUnit) : "—"}
                    </td>
                    <td className="p-4 text-right font-extrabold text-slate-100 font-mono">
                      {formatCurrency(tx.totalAmount)}
                    </td>
                    <td className="p-4 text-xs text-slate-400">
                      <span>{tx.brokerName || "Demat"}</span>
                      {tx.accountName && <p className="text-[10px] text-slate-500">{tx.accountName}</p>}
                    </td>
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
