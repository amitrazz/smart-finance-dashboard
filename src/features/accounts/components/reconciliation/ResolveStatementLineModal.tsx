import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, Copy, PlusCircle, RefreshCw, X } from "lucide-react";
import {
  useCategories,
  useCreateMissingTransactionFromStatementLine,
  useIgnoreStatementLine,
  useMatchStatementLine,
  useStatementLineCandidates,
  useTransaction,
} from "../../../../hooks/useFinanceQueries";
import { IgnoreReason, StatementLine } from "../../../../types";
import { Money } from "../../../../components/common/Money";
import { formatDate } from "../../../../utils/formatters";

const IGNORE_REASONS: { value: IgnoreReason; label: string }[] = [
  { value: "DUPLICATE_IMPORT", label: "Duplicate import" },
  { value: "BANK_INFORMATIONAL", label: "Bank informational line" },
  { value: "ALREADY_RECONCILED", label: "Already reconciled" },
  { value: "BANK_CHARGES", label: "Bank charges" },
  { value: "INTEREST_ADJUSTMENT", label: "Interest adjustment" },
  { value: "OTHER", label: "Other" },
];

interface ResolveStatementLineModalProps {
  statementLine: StatementLine | null;
  onClose: () => void;
}

type Tab = "match" | "create" | "ignore";

const ScoreBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex items-center gap-2">
    <span className="w-16 shrink-0 text-[10px] text-slate-500">{label}</span>
    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
      <div
        className={`h-full rounded-full ${value >= 80 ? "bg-emerald-500" : value >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
    <span className="w-8 shrink-0 text-right text-[10px] font-mono text-slate-400">{value}</span>
  </div>
);

const CandidateRow: React.FC<{
  transactionId: string;
  score: number;
  breakdown: { amount: number; date: number; merchant: number; reference: number; account: number };
  selected: boolean;
  onSelect: () => void;
}> = ({ transactionId, score, breakdown, selected, onSelect }) => {
  const { data: transaction, isLoading } = useTransaction(transactionId);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
        selected
          ? "bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30"
          : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {isLoading ? (
            <div className="h-4 w-40 bg-slate-800 rounded animate-pulse" />
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-100 truncate">
                {transaction?.description || "Untitled transaction"}
              </p>
              <p className="text-[11px] text-slate-500">
                {transaction ? formatDate(transaction.date) : ""} • {transaction?.categoryName || "Uncategorized"}
              </p>
            </>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-slate-100">
            {transaction ? <Money value={transaction.amount} /> : "—"}
          </p>
          <span
            className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              score >= 80
                ? "bg-emerald-500/10 text-emerald-400"
                : score >= 40
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-rose-500/10 text-rose-400"
            }`}
          >
            {score}% match
          </span>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
        <ScoreBar label="Amount" value={breakdown.amount} />
        <ScoreBar label="Date" value={breakdown.date} />
        <ScoreBar label="Merchant" value={breakdown.merchant} />
        <ScoreBar label="Reference" value={breakdown.reference} />
      </div>
    </button>
  );
};

export const ResolveStatementLineModal: React.FC<ResolveStatementLineModalProps> = ({
  statementLine,
  onClose,
}) => {
  const isOpen = Boolean(statementLine);
  const [activeTab, setActiveTab] = useState<Tab>("match");
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [notes, setNotes] = useState("");
  const [ignoreReason, setIgnoreReason] = useState<IgnoreReason>("BANK_CHARGES");

  useEffect(() => {
    if (isOpen) {
      setActiveTab("match");
      setSelectedTransactionId(null);
      setCategoryId("");
      setNotes("");
      setIgnoreReason("BANK_CHARGES");
    }
  }, [isOpen, statementLine?.id]);

  const { data: candidates = [], isLoading: candidatesLoading } = useStatementLineCandidates(
    statementLine?.id || "",
  );
  const { data: categories = [] } = useCategories();

  const matchMutation = useMatchStatementLine();
  const createTxMutation = useCreateMissingTransactionFromStatementLine();
  const ignoreMutation = useIgnoreStatementLine();

  const isSubmitting = matchMutation.isPending || createTxMutation.isPending || ignoreMutation.isPending;

  const sortedCandidates = useMemo(() => [...candidates].sort((a, b) => b.score - a.score), [candidates]);

  if (!isOpen || !statementLine) return null;

  const handleMatch = () => {
    if (!selectedTransactionId) return;
    matchMutation.mutate(
      { id: statementLine.id, transactionId: selectedTransactionId, version: statementLine.version },
      { onSuccess: onClose },
    );
  };

  const handleCreateTransaction = () => {
    createTxMutation.mutate(
      {
        id: statementLine.id,
        data: { categoryId: categoryId || undefined, notes: notes || undefined },
        version: statementLine.version,
      },
      { onSuccess: onClose },
    );
  };

  const handleIgnore = () => {
    ignoreMutation.mutate(
      { id: statementLine.id, reason: ignoreReason, version: statementLine.version },
      { onSuccess: onClose },
    );
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800/80 flex items-start justify-between gap-4 shrink-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-100">Resolve Statement Line</h3>
                {statementLine.isDuplicate && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Copy className="w-3 h-3" /> Possible duplicate
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 truncate">
                {statementLine.description} • {formatDate(statementLine.transactionDate)} •{" "}
                <Money value={statementLine.amount} className="font-semibold text-slate-300" />
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close dialog"
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6 pt-4 flex items-center gap-2 shrink-0">
            {([
              { id: "match", label: "Find Match" },
              { id: "create", label: "Create Transaction" },
              { id: "ignore", label: "Ignore" },
            ] as { id: Tab; label: string }[]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-emerald-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 scrollbar-thin">
            {activeTab === "match" && (
              <div className="space-y-3">
                {candidatesLoading ? (
                  <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="h-20 bg-slate-800/60 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : sortedCandidates.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                    No in-window candidate transactions found. Try creating a new transaction from this
                    statement line instead.
                  </div>
                ) : (
                  sortedCandidates.map((c) => (
                    <CandidateRow
                      key={c.transactionId}
                      transactionId={c.transactionId}
                      score={c.score}
                      breakdown={c.breakdown}
                      selected={selectedTransactionId === c.transactionId}
                      onSelect={() => setSelectedTransactionId(c.transactionId)}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === "create" && (
              <div className="space-y-4 max-w-md">
                <div className="flex items-start gap-2 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px]">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  Creates a real transaction from this statement line's date, amount, and direction, and
                  reconciles it immediately.
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category (optional)
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">-- Uncategorized --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {activeTab === "ignore" && (
              <div className="space-y-4 max-w-md">
                <p className="text-xs text-slate-400">
                  Choose why this statement line should be excluded from reconciliation. It stays visible
                  in history but no longer counts against unmatched totals.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {IGNORE_REASONS.map((r) => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                        ignoreReason === r.value
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                          : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="ignoreReason"
                        value={r.value}
                        checked={ignoreReason === r.value}
                        onChange={() => setIgnoreReason(r.value)}
                        className="accent-emerald-500"
                      />
                      {r.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-800/80 flex items-center justify-end gap-3 shrink-0">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            {activeTab === "match" && (
              <button
                onClick={handleMatch}
                disabled={!selectedTransactionId || isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {matchMutation.isPending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Match Selected
              </button>
            )}
            {activeTab === "create" && (
              <button
                onClick={handleCreateTransaction}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {createTxMutation.isPending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <PlusCircle className="w-3.5 h-3.5" />
                )}
                Create & Reconcile
              </button>
            )}
            {activeTab === "ignore" && (
              <button
                onClick={handleIgnore}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/90 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50"
              >
                {ignoreMutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Ignore Line
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
