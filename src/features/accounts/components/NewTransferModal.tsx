import React, { useEffect, useState } from "react";
import { ArrowRightLeft, Wallet, X, Check } from "lucide-react";
import { useAccounts, useCreateTransfer } from "../../../hooks/useFinanceQueries";
import { Account, CreateTransferInput, TransferType } from "../../../types";
import { AsyncSearchSelect } from "../../../components/common/AsyncSearchSelect";

// AccountResponseDto has no top-level `currency` field — it only appears
// nested under currentBalance.currency (see account.mapper.ts on the
// backend). Account.currency is effectively always undefined on real data.
const accountCurrency = (acc: Account): string => acc.currency || acc.currentBalance?.currency || "INR";

interface NewTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-select the source account, e.g. when triggered from an account's own "Transfer" action. */
  defaultFromAccountId?: string;
}

const TRANSFER_TYPES: { value: TransferType; label: string }[] = [
  { value: "INTERNAL", label: "Internal" },
  { value: "BANK", label: "Bank" },
  { value: "CASH", label: "Cash" },
  { value: "INVESTMENT", label: "Investment" },
  { value: "CREDIT_CARD_PAYMENT", label: "Credit Card Payment" },
  { value: "LOAN_PAYMENT", label: "Loan Payment" },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

export const NewTransferModal: React.FC<NewTransferModalProps> = ({ isOpen, onClose, defaultFromAccountId }) => {
  const [fromSearch, setFromSearch] = useState("");
  const [toSearch, setToSearch] = useState("");
  const { data: fromAccounts = [], isFetching: isFromFetching } = useAccounts({
    search: fromSearch || undefined,
    limit: 100,
  });
  const { data: toAccounts = [], isFetching: isToFetching } = useAccounts({
    search: toSearch || undefined,
    limit: 100,
  });
  const createTransferMutation = useCreateTransfer();

  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransferType>("INTERNAL");
  const [transferDate, setTransferDate] = useState(todayISO());
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [reference, setReference] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const activeFromAccounts = fromAccounts.filter((a) => a.status === "ACTIVE");
  const activeToAccounts = toAccounts.filter((a) => a.status === "ACTIVE" && a.id !== fromAccountId);

  // Seed from/to accounts once the (unfiltered) initial fetch has loaded, honoring defaultFromAccountId if given.
  useEffect(() => {
    if (!isOpen || activeFromAccounts.length === 0) return;
    setFromAccountId((prev) => prev || defaultFromAccountId || activeFromAccounts[0].id);
  }, [isOpen, activeFromAccounts, defaultFromAccountId]);

  useEffect(() => {
    if (!isOpen || activeToAccounts.length === 0) return;
    setToAccountId((prev) => {
      if (prev && prev !== fromAccountId) return prev;
      return activeToAccounts[0]?.id || "";
    });
  }, [isOpen, activeToAccounts, fromAccountId]);

  if (!isOpen) return null;

  const resetForm = () => {
    setFromAccountId("");
    setToAccountId("");
    setAmount("");
    setType("INTERNAL");
    setTransferDate(todayISO());
    setDescription("");
    setNotes("");
    setReference("");
    setFormError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const fromAccount = [...fromAccounts, ...toAccounts].find((a) => a.id === fromAccountId);
  const toAccount = [...fromAccounts, ...toAccounts].find((a) => a.id === toAccountId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fromAccountId || !toAccountId) {
      setFormError("Select both a source and destination account.");
      return;
    }
    if (fromAccountId === toAccountId) {
      setFormError("Source and destination accounts must be different.");
      return;
    }
    const numericAmount = parseFloat(amount);
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setFormError("Enter an amount greater than zero.");
      return;
    }

    const payload: CreateTransferInput = {
      fromAccountId,
      toAccountId,
      amount,
      type,
      transferDate,
      description: description || undefined,
      notes: notes || undefined,
      reference: reference || undefined,
    };

    createTransferMutation.mutate(payload, {
      onSuccess: () => handleClose(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-emerald-400" /> New Transfer
          </h3>
          <button onClick={handleClose} aria-label="Close dialog" className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">From Account</label>
              <AsyncSearchSelect
                value={fromAccountId}
                valueLabel={fromAccount ? `${fromAccount.name} (${accountCurrency(fromAccount)})` : undefined}
                items={activeFromAccounts}
                isFetching={isFromFetching}
                onSearch={setFromSearch}
                onSelect={(acc) => setFromAccountId(acc.id)}
                getOptionKey={(acc) => acc.id}
                icon={<Wallet className="w-4 h-4 text-slate-500 shrink-0" />}
                placeholder="Search accounts…"
                emptyMessage="No matching accounts"
                renderOption={(acc) => (
                  <span className="truncate">
                    {acc.name} ({accountCurrency(acc)})
                  </span>
                )}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">To Account</label>
              <AsyncSearchSelect
                value={toAccountId}
                valueLabel={toAccount ? `${toAccount.name} (${accountCurrency(toAccount)})` : undefined}
                items={activeToAccounts}
                isFetching={isToFetching}
                onSearch={setToSearch}
                onSelect={(acc) => setToAccountId(acc.id)}
                getOptionKey={(acc) => acc.id}
                icon={<Wallet className="w-4 h-4 text-slate-500 shrink-0" />}
                placeholder="Search accounts…"
                emptyMessage="No other accounts available"
                renderOption={(acc) => (
                  <span className="truncate">
                    {acc.name} ({accountCurrency(acc)})
                  </span>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Amount {fromAccount ? `(${accountCurrency(fromAccount)})` : ""}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TransferType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none"
              >
                {TRANSFER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Transfer Date</label>
            <input
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Monthly Savings"
              maxLength={500}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
                maxLength={1000}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reference</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Optional, must be unique"
                maxLength={200}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {formError && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
              {formError}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTransferMutation.isPending || activeFromAccounts.length < 2}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> {createTransferMutation.isPending ? "Transferring..." : "Send Transfer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTransferModal;
