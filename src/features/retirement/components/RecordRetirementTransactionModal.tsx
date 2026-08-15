import React, { useMemo, useState } from "react";
import { X, ReceiptText, Info } from "lucide-react";
import { RetirementAccount, RetirementTransactionType } from "../../../types";
import { PRODUCT_TYPE_CONFIG, TRANSACTION_TYPE_LABELS } from "../constants/productTypes";
import { useRecordRetirementTransaction } from "../hooks/useRetirementQueries";
import { ConfirmModal } from "../../../components/common/ConfirmModal";
import { formatCurrency } from "../../../utils/formatters";

interface RecordRetirementTransactionModalProps {
  account: RetirementAccount | null;
  onClose: () => void;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export const RecordRetirementTransactionModal: React.FC<RecordRetirementTransactionModalProps> = ({
  account,
  onClose,
}) => {
  const recordMutation = useRecordRetirementTransaction();
  const allowedTypes = account ? PRODUCT_TYPE_CONFIG[account.productType].allowedTransactionTypes : [];

  const [type, setType] = useState<RetirementTransactionType>(allowedTypes[0] ?? "CONTRIBUTION");
  const [amount, setAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState(todayIso());
  const [isWithdrawalConfirmOpen, setWithdrawalConfirmOpen] = useState(false);

  // Reset local form state whenever a different account is opened, since
  // its allowed type list can differ (e.g. switching from EPF to PPF).
  const lastAccountId = useMemo(() => account?.id, [account?.id]);
  React.useEffect(() => {
    if (account) {
      setType(PRODUCT_TYPE_CONFIG[account.productType].allowedTransactionTypes[0]);
      setAmount("");
      setTransactionDate(todayIso());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAccountId]);

  if (!account) return null;

  const typeConfig = TRANSACTION_TYPE_LABELS[type];
  const isWithdrawal = type === "WITHDRAWAL";

  const submit = () => {
    recordMutation.mutate(
      {
        retirementAccountId: account.id,
        type,
        amount,
        transactionDate,
      },
      {
        onSuccess: () => {
          setWithdrawalConfirmOpen(false);
          onClose();
        },
      },
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isWithdrawal) {
      setWithdrawalConfirmOpen(true);
      return;
    }
    submit();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-retirement-transaction-title"
    >
      <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h3 id="record-retirement-transaction-title" className="text-lg font-bold text-slate-100">
                Record Transaction
              </h3>
              <p className="text-xs text-slate-400">
                {account.name} · {PRODUCT_TYPE_CONFIG[account.productType].shortLabel}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {recordMutation.isError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            {(recordMutation.error as { userMessage?: string; message?: string })?.userMessage ||
              (recordMutation.error as Error)?.message ||
              "Failed to record transaction. Please try again."}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Transaction Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as RetirementTransactionType)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
            >
              {allowedTypes.map((t) => (
                <option key={t} value={t}>
                  {TRANSACTION_TYPE_LABELS[t].label}
                </option>
              ))}
            </select>
            {typeConfig.helperText && (
              <p className="flex items-start gap-1.5 text-[11px] text-slate-500 mt-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-sky-400" aria-hidden="true" />
                <span>{typeConfig.helperText}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Amount</label>
              <input
                type="number"
                required
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Date</label>
              <input
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordMutation.isPending || !amount}
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
            >
              {recordMutation.isPending ? "Recording..." : isWithdrawal ? "Review Withdrawal" : "Record Transaction"}
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={isWithdrawalConfirmOpen}
        title={`Withdraw ${formatCurrency({ amount: amount || "0", currency: account.currentBalance.currency })} from ${account.name}?`}
        message={`${PRODUCT_TYPE_CONFIG[account.productType].shortLabel} balance will decrease by this amount.${
          account.linkedAccountId ? " Your linked bank account will receive the withdrawn amount." : ""
        }`}
        impactDetails={`Current balance: ${formatCurrency(account.currentBalance)}`}
        confirmText="Confirm Withdrawal"
        variant="warning"
        isLoading={recordMutation.isPending}
        onConfirm={submit}
        onClose={() => setWithdrawalConfirmOpen(false)}
      />
    </div>
  );
};
