import React, { useState } from "react";
import { X, PiggyBank, CheckCircle2, Wallet } from "lucide-react";
import { useAccounts } from "../../../hooks/useFinanceQueries";
import { useCreateRetirementAccount } from "../hooks/useRetirementQueries";
import { PRODUCT_TYPE_CONFIG, PRODUCT_TYPE_LIST } from "../constants/productTypes";
import { RetirementProductType } from "../../../types";
import { AsyncSearchSelect } from "../../../components/common/AsyncSearchSelect";
import { formatCurrency } from "../../../utils/formatters";

interface CreateRetirementAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateRetirementAccountModal: React.FC<CreateRetirementAccountModalProps> = ({
  isOpen,
  onClose,
}) => {
  const createMutation = useCreateRetirementAccount();

  const [productType, setProductType] = useState<RetirementProductType>("EPF");
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [linkedAccountId, setLinkedAccountId] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [openingBalanceDate, setOpeningBalanceDate] = useState("");
  const [accountPickerSearch, setAccountPickerSearch] = useState("");

  const { data: accountPickerResults = [], isFetching: isAccountPickerFetching } = useAccounts({
    search: accountPickerSearch || undefined,
    limit: 20,
  });

  if (!isOpen) return null;

  const resetForm = () => {
    setProductType("EPF");
    setName("");
    setCurrency("INR");
    setLinkedAccountId("");
    setOpeningBalance("");
    setOpeningBalanceDate("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        productType,
        name,
        currency,
        linkedAccountId: linkedAccountId || undefined,
        // Both must be present together — an opening balance without a date
        // (or vice versa) is meaningless to the atomic OPENING_BALANCE seed.
        openingBalance: openingBalance || undefined,
        openingBalanceDate: openingBalance ? openingBalanceDate || undefined : undefined,
      },
      { onSuccess: () => handleClose() },
    );
  };

  const selectedLinkedAccount = accountPickerResults.find((a) => a.id === linkedAccountId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-retirement-account-title"
    >
      <div className="relative w-full max-w-lg p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h3 id="create-retirement-account-title" className="text-lg font-bold text-slate-100">
                Add Retirement Account
              </h3>
              <p className="text-xs text-slate-400">Track an EPF, VPF, PPF, or NPS account</p>
            </div>
          </div>
          <button
            onClick={handleClose}
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
              "Failed to create retirement account. Please try again."}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Product</label>
            <div className="grid grid-cols-4 gap-2">
              {PRODUCT_TYPE_LIST.map((pt) => {
                const cfg = PRODUCT_TYPE_CONFIG[pt];
                const isActive = productType === pt;
                return (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => setProductType(pt)}
                    aria-pressed={isActive}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                      isActive
                        ? "bg-violet-500/15 border-violet-500/40 text-violet-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {cfg.shortLabel}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">{PRODUCT_TYPE_CONFIG[productType].description}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Account Name</label>
            <input
              type="text"
              required
              placeholder={`e.g. ${PRODUCT_TYPE_CONFIG[productType].shortLabel} - Acme Corp`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Currency</label>
              <input
                type="text"
                required
                maxLength={3}
                placeholder="INR"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 uppercase placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Opening Balance (Optional)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          {openingBalance && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Opening Balance Date</label>
              <input
                type="date"
                required
                value={openingBalanceDate}
                onChange={(e) => setOpeningBalanceDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Linked Bank Account (Optional)
            </label>
            <AsyncSearchSelect
              value={linkedAccountId}
              valueLabel={
                selectedLinkedAccount
                  ? `${selectedLinkedAccount.name} (${formatCurrency(selectedLinkedAccount.currentBalance)})`
                  : undefined
              }
              items={accountPickerResults}
              isFetching={isAccountPickerFetching}
              onSearch={setAccountPickerSearch}
              onSelect={(acc) => setLinkedAccountId(acc.id)}
              onClear={() => setLinkedAccountId("")}
              getOptionKey={(acc) => acc.id}
              icon={<Wallet className="w-4 h-4 text-slate-500 shrink-0" />}
              placeholder="Bridge contributions/withdrawals to a bank account…"
              emptyMessage="No matching accounts"
              renderOption={(acc) => (
                <span className="truncate">
                  {acc.name} ({formatCurrency(acc.currentBalance)})
                </span>
              )}
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              Contributions and withdrawals will move money to/from this account as a transfer, excluded from your
              cash-flow totals — not shown as an expense or income.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating..." : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Save Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
