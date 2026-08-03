import React, { useState } from "react";

import { motion } from "framer-motion";
import { useAccountTransfers } from "../../../hooks/useFinanceQueries";
import { TransferCard } from "../components/TransferCard";
import { AccountTransfer } from "../../../types";
import { EmptyState } from "../../../components/common/EmptyState";
import { ArrowRightLeft, Clock, Repeat, AlertCircle, Plus } from "lucide-react";

const TABS: Array<{ key: string; label: string; icon: React.ReactNode }> = [
  { key: "ALL", label: "All", icon: <ArrowRightLeft className="w-4 h-4" /> },
  { key: "COMPLETED", label: "Completed", icon: <ArrowRightLeft className="w-4 h-4" /> },
  { key: "SCHEDULED", label: "Scheduled", icon: <Clock className="w-4 h-4" /> },
  { key: "RECURRING", label: "Recurring", icon: <Repeat className="w-4 h-4" /> },
  { key: "FAILED", label: "Failed", icon: <AlertCircle className="w-4 h-4" /> },
];

interface TransfersViewProps {
  onNewTransfer?: () => void;
}

export const TransfersView: React.FC<TransfersViewProps> = ({ onNewTransfer }) => {
  const { data: transfers = [], isLoading, isError } = useAccountTransfers();
  const [activeTab, setActiveTab] = useState("ALL");

  const filtered = transfers.filter((t: AccountTransfer) =>
    activeTab === "ALL" || t.status === activeTab
  );

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {Array(3).fill(null).map((_, i) => <div key={i} className="h-24 bg-slate-900/60 rounded-2xl border border-slate-800" />)}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={<ArrowRightLeft className="w-10 h-10 text-slate-600 mx-auto" aria-hidden="true" />}
        title="Transfer Center Not Available"
        message="There is no backend endpoint for account-to-account transfers yet."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
            Transfer Center
          </h3>
          <p className="text-xs text-slate-400">Move money between your accounts with full auditability</p>
        </div>
        <button
          onClick={onNewTransfer}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Transfer</span>
        </button>
      </div>

      {/* Tab Selector */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/60 border border-slate-800 rounded-xl overflow-x-auto scrollbar-none text-xs font-semibold">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-emerald-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
            {tab.key !== "ALL" && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === tab.key ? "bg-slate-950/30 text-slate-950" : "bg-slate-800 text-slate-400"
              }`}>
                {transfers.filter((t: AccountTransfer) => t.status === tab.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Transfer List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((transfer: AccountTransfer, i) => (
            <motion.div key={transfer.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <TransferCard transfer={transfer} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-3">
          <ArrowRightLeft className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No {activeTab !== "ALL" ? activeTab.toLowerCase() : ""} transfers found</h3>
          <p className="text-sm text-slate-400">Initiate your first transfer between accounts.</p>
        </div>
      )}
    </div>
  );
};
