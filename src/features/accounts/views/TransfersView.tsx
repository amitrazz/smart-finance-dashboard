import React, { useMemo, useState } from "react";

import { motion } from "framer-motion";
import { useAccounts, useTransfers, useReverseTransfer } from "../../../hooks/useFinanceQueries";
import { TransferCard } from "../components/TransferCard";
import { Transfer, TransferStatus } from "../../../types";
import { EmptyState } from "../../../components/common/EmptyState";
import { ConfirmModal } from "../../../components/common/ConfirmModal";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { ArrowRightLeft, Clock, AlertCircle, Plus, X, Undo2 } from "lucide-react";

const TABS: Array<{ key: TransferStatus | "ALL"; label: string; icon: React.ReactNode }> = [
  { key: "ALL", label: "All", icon: <ArrowRightLeft className="w-4 h-4" /> },
  { key: "COMPLETED", label: "Completed", icon: <ArrowRightLeft className="w-4 h-4" /> },
  { key: "PENDING", label: "Pending", icon: <Clock className="w-4 h-4" /> },
  { key: "REVERSED", label: "Reversed", icon: <Undo2 className="w-4 h-4" /> },
  { key: "FAILED", label: "Failed", icon: <AlertCircle className="w-4 h-4" /> },
];

interface TransfersViewProps {
  onNewTransfer?: () => void;
}

export const TransfersView: React.FC<TransfersViewProps> = ({ onNewTransfer }) => {
  const { data: transfers = [], isLoading, isError, error, refetch } = useTransfers();
  const { data: accounts = [] } = useAccounts();
  const reverseTransferMutation = useReverseTransfer();
  const [activeTab, setActiveTab] = useState<TransferStatus | "ALL">("ALL");
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [reversingTransfer, setReversingTransfer] = useState<Transfer | null>(null);

  const accountNameById = useMemo(
    () => new Map(accounts.map((a) => [a.id, a.name])),
    [accounts]
  );

  const enrichedTransfers = useMemo<Transfer[]>(
    () =>
      transfers.map((t) => ({
        ...t,
        fromAccountName: accountNameById.get(t.fromAccountId) || t.fromAccountId,
        toAccountName: accountNameById.get(t.toAccountId) || t.toAccountId,
      })),
    [transfers, accountNameById]
  );

  const filtered = enrichedTransfers.filter((t) => activeTab === "ALL" || t.status === activeTab);

  const handleReverse = (id: string) => {
    reverseTransferMutation.mutate(id, {
      onSuccess: () => {
        setSelectedTransfer(null);
        setReversingTransfer(null);
      },
    });
  };

  const handleConfirmReverse = () => {
    if (!reversingTransfer) return;
    handleReverse(reversingTransfer.id);
  };

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
        title="Failed to Load Transfers"
        message={(error as Error)?.message || "Could not fetch transfer history."}
        actionLabel="Retry"
        onAction={() => refetch()}
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
                {enrichedTransfers.filter((t) => t.status === tab.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Transfer List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((transfer, i) => (
            <motion.div key={transfer.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <TransferCard
                transfer={transfer}
                onClick={() => setSelectedTransfer(transfer)}
                onReverse={() => setReversingTransfer(transfer)}
                isReversing={reverseTransferMutation.isPending && reverseTransferMutation.variables === transfer.id}
              />
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

      {/* Detail Drawer */}
      {selectedTransfer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-bold text-lg text-slate-100">Transfer Details</h3>
              <button
                onClick={() => setSelectedTransfer(null)}
                aria-label="Close transfer details"
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Amount</p>
                <p className="text-3xl font-extrabold mt-1 text-slate-100">
                  {formatCurrency(parseFloat(selectedTransfer.amount.amount), selectedTransfer.amount.currency)}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between border-b border-slate-800/60 py-2 text-sm">
                  <span className="text-slate-400">From</span>
                  <span className="font-semibold text-slate-200">{selectedTransfer.fromAccountName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 py-2 text-sm">
                  <span className="text-slate-400">To</span>
                  <span className="font-semibold text-slate-200">{selectedTransfer.toAccountName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 py-2 text-sm">
                  <span className="text-slate-400">Status</span>
                  <span className="font-semibold text-slate-200">{selectedTransfer.status}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 py-2 text-sm">
                  <span className="text-slate-400">Type</span>
                  <span className="font-semibold text-slate-200">{selectedTransfer.type}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 py-2 text-sm">
                  <span className="text-slate-400">Date</span>
                  <span className="font-semibold text-slate-200">{formatDate(selectedTransfer.executedAt)}</span>
                </div>
                {selectedTransfer.reference && (
                  <div className="flex justify-between border-b border-slate-800/60 py-2 text-sm">
                    <span className="text-slate-400">Reference</span>
                    <span className="font-semibold text-slate-200">{selectedTransfer.reference}</span>
                  </div>
                )}
                {selectedTransfer.description && (
                  <div className="flex justify-between border-b border-slate-800/60 py-2 text-sm">
                    <span className="text-slate-400">Description</span>
                    <span className="font-semibold text-slate-200">{selectedTransfer.description}</span>
                  </div>
                )}
                {selectedTransfer.notes && (
                  <div className="flex justify-between border-b border-slate-800/60 py-2 text-sm">
                    <span className="text-slate-400">Notes</span>
                    <span className="font-semibold text-slate-200">{selectedTransfer.notes}</span>
                  </div>
                )}
              </div>

              {selectedTransfer.status === "COMPLETED" &&
                !selectedTransfer.reversedByTransferId &&
                !selectedTransfer.reversalOfTransferId && (
                  <button
                    onClick={() => setReversingTransfer(selectedTransfer)}
                    disabled={reverseTransferMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 font-semibold text-sm transition-all disabled:opacity-50"
                  >
                    <Undo2 className="w-4 h-4" />
                    {reverseTransferMutation.isPending ? "Reversing..." : "Reverse Transfer"}
                  </button>
                )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(reversingTransfer)}
        title="Reverse Transfer"
        message={
          reversingTransfer
            ? `Reverse the transfer of ${formatCurrency(parseFloat(reversingTransfer.amount.amount), reversingTransfer.amount.currency)} from ${reversingTransfer.fromAccountName} to ${reversingTransfer.toAccountName}? This creates an offsetting transfer and cannot be undone.`
            : ""
        }
        confirmText="Reverse Transfer"
        cancelText="Cancel"
        variant="danger"
        isLoading={reverseTransferMutation.isPending}
        onConfirm={handleConfirmReverse}
        onClose={() => setReversingTransfer(null)}
      />
    </div>
  );
};
