import React, { useEffect, useState } from "react";
import { X, Repeat, Info, Wallet } from "lucide-react";
import { RetirementAccount, RetirementTransactionType } from "../../../types";
import { PRODUCT_TYPE_CONFIG, TRANSACTION_TYPE_LABELS, getSchedulableContributionTypes } from "../constants/productTypes";
import { useCreateRecurringContributionRule } from "../hooks/useRetirementQueries";
import { useAccounts } from "../../../hooks/useFinanceQueries";
import { AsyncSearchSelect } from "../../../components/common/AsyncSearchSelect";

interface RecurringContributionFormModalProps {
  account: RetirementAccount | null;
  onClose: () => void;
}

const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, i) => i + 1);

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export const RecurringContributionFormModal: React.FC<RecurringContributionFormModalProps> = ({
  account,
  onClose,
}) => {
  const createMutation = useCreateRecurringContributionRule();
  const schedulableTypes = account ? getSchedulableContributionTypes(account.productType) : [];

  const [transactionType, setTransactionType] = useState<RetirementTransactionType>(
    schedulableTypes[0] ?? "CONTRIBUTION",
  );
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [sourceAccountSearch, setSourceAccountSearch] = useState("");
  const [amount, setAmount] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [startDate, setStartDate] = useState(tomorrowIso());
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");

  const { data: sourceAccounts = [], isFetching: isSourceAccountsFetching } = useAccounts({
    search: sourceAccountSearch || undefined,
    status: "ACTIVE",
    limit: 20,
  });

  const lastAccountId = account?.id;
  useEffect(() => {
    if (account) {
      const types = getSchedulableContributionTypes(account.productType);
      setTransactionType(types[0] ?? "CONTRIBUTION");
      setSourceAccountId("");
      setSourceAccountSearch("");
      setAmount("");
      setDayOfMonth(1);
      setStartDate(tomorrowIso());
      setEndDate("");
      setDescription("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAccountId]);

  if (!account) return null;

  const isEmployerFunded = transactionType === "EMPLOYER_CONTRIBUTION";
  const typeConfig = TRANSACTION_TYPE_LABELS[transactionType];
  const selectedSourceAccount = sourceAccounts.find((a) => a.id === sourceAccountId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        type: "RETIREMENT_CONTRIBUTION",
        retirementAccountId: account.id,
        transactionType: transactionType as "EMPLOYEE_CONTRIBUTION" | "EMPLOYER_CONTRIBUTION" | "CONTRIBUTION",
        sourceAccountId: isEmployerFunded ? undefined : sourceAccountId || undefined,
        amount,
        frequency: "MONTHLY",
        dayOfMonth,
        startDate,
        endDate: endDate || undefined,
        description: description || undefined,
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recurring-contribution-title"
    >
      <div className="relative w-full max-w-lg p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h3 id="recurring-contribution-title" className="text-lg font-bold text-slate-100">
                Add Recurring Contribution
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

        {createMutation.isError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            {(createMutation.error as { userMessage?: string; message?: string })?.userMessage ||
              (createMutation.error as Error)?.message ||
              "Failed to set up recurring contribution. Please try again."}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="recurring-contribution-type" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Contribution Type
            </label>
            <select
              id="recurring-contribution-type"
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value as RetirementTransactionType)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-violet-500 transition-colors"
            >
              {schedulableTypes.map((t) => (
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

          {isEmployerFunded ? (
            <div className="p-3.5 rounded-2xl bg-violet-500/5 border border-violet-500/20 text-xs text-violet-300">
              This increases your retirement corpus without debiting your personal bank account. No source account is
              needed.
            </div>
          ) : (
            <div>
              <label
                id="recurring-source-account-label"
                htmlFor="recurring-source-account"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Source Account
              </label>
              <AsyncSearchSelect
                id="recurring-source-account"
                value={sourceAccountId}
                valueLabel={selectedSourceAccount ? selectedSourceAccount.name : undefined}
                items={sourceAccounts}
                isFetching={isSourceAccountsFetching}
                onSearch={setSourceAccountSearch}
                onSelect={(acc) => setSourceAccountId(acc.id)}
                onClear={() => setSourceAccountId("")}
                getOptionKey={(acc) => acc.id}
                icon={<Wallet className="w-4 h-4 text-slate-500 shrink-0" />}
                placeholder="Select an account…"
                emptyMessage="No matching active accounts"
                renderOption={(acc) => <span className="truncate">{acc.name}</span>}
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Your bank account will be debited when the contribution executes.
              </p>
            </div>
          )}

          <div>
            <label htmlFor="recurring-amount" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Amount
            </label>
            <input
              id="recurring-amount"
              type="number"
              required
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span id="recurring-frequency-label" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Frequency
              </span>
              <div
                aria-labelledby="recurring-frequency-label"
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-400"
              >
                Monthly
              </div>
            </div>
            <div>
              <label htmlFor="recurring-day-of-month" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Day of Month
              </label>
              <select
                id="recurring-day-of-month"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-violet-500 transition-colors"
              >
                {DAYS_OF_MONTH.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {dayOfMonth > 28 && (
            <p className="flex items-start gap-1.5 text-[11px] text-slate-500 -mt-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-sky-400" aria-hidden="true" />
              <span>For shorter months, the contribution follows the backend&apos;s monthly scheduling rules.</span>
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="recurring-start-date" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Start Date
              </label>
              <input
                id="recurring-start-date"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="recurring-end-date" className="block text-xs font-semibold text-slate-300 mb-1.5">
                End Date (Optional)
              </label>
              <input
                id="recurring-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="recurring-description" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              id="recurring-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-violet-500 transition-colors"
            />
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
              disabled={createMutation.isPending || !amount || (!isEmployerFunded && !sourceAccountId)}
              className="px-5 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
            >
              {createMutation.isPending ? "Setting up..." : "Add Recurring Contribution"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
