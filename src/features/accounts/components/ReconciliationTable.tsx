import React, { useState } from "react";

import { ReconciliationItem } from "../../../types";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { StatusBadge } from "./StatusBadge";
import { CheckCircle2, AlertTriangle, Check, X } from "lucide-react";

interface ReconciliationTableProps {
  items: ReconciliationItem[];
  onBulkAction?: (ids: string[], action: "MATCH" | "DISMISS") => void;
  onReconcileSingle?: (item: ReconciliationItem) => void;
}

export const ReconciliationTable: React.FC<ReconciliationTableProps> = ({
  items,
  onBulkAction,
  onReconcileSingle,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("ALL");

  const filteredItems = items.filter((item) => {
    if (activeTab === "ALL") return true;
    return item.status === activeTab;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Reconciliation Audit Queue</span>
          </h3>
          <p className="text-xs text-slate-400">Audit imported bank statement lines against internal ledger records</p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/60 rounded-xl border border-slate-800 text-xs font-semibold overflow-x-auto scrollbar-none">
          {["ALL", "MATCHED", "PENDING", "EXCEPTIONS", "UNMATCHED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? "bg-emerald-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between animate-fadeIn">
          <span className="text-xs font-semibold text-emerald-300">
            {selectedIds.length} item{selectedIds.length > 1 ? "s" : ""} selected for bulk action
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onBulkAction?.(selectedIds, "MATCH");
                setSelectedIds([]);
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Bulk Match</span>
            </button>

            <button
              onClick={() => {
                onBulkAction?.(selectedIds, "DISMISS");
                setSelectedIds([]);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Dismiss</span>
            </button>
          </div>
        </div>
      )}

      {/* Reconciliation Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300 border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
              <th className="py-3 px-3 w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.length > 0 && selectedIds.length === filteredItems.length}
                  onChange={toggleSelectAll}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
              </th>
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3">Account</th>
              <th className="py-3 px-3">Imported Description</th>
              <th className="py-3 px-3 text-right">Amount</th>
              <th className="py-3 px-3 text-center">Confidence</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const amt = parseFloat(item.importedTransaction.amount?.amount || "0");
              return (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    isSelected ? "bg-emerald-500/5" : ""
                  }`}
                >
                  <td className="py-3 px-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(item.id)}
                      className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-200">{formatDate(item.importedTransaction.date)}</td>
                  <td className="py-3 px-3 font-semibold text-slate-300">{item.accountName}</td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-100">{item.importedTransaction.description}</p>
                    {item.discrepancyNote && (
                      <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        {item.discrepancyNote}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-slate-100">
                    {formatCurrency(amt, item.importedTransaction.amount?.currency || "INR")}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        (item.confidenceScore || 0) >= 80
                          ? "bg-emerald-500/10 text-emerald-400"
                          : (item.confidenceScore || 0) >= 50
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      {item.confidenceScore || 50}% Match
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <StatusBadge status={item.status} size="sm" />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onReconcileSingle?.(item)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold transition-colors"
                    >
                      Reconcile
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
