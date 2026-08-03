import React, { useState } from "react";
import { X, Landmark, CheckCircle2 } from "lucide-react";
import { useCreateAccount } from "../../../hooks/useFinanceQueries";
import { Account, AccountType, FinancialInstitution } from "../../../types";
import { InstitutionPicker } from "../../../components/common/InstitutionPicker";

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "SAVINGS", label: "Savings Account" },
  { value: "CURRENT", label: "Current / Checking Account" },
  { value: "CASH", label: "Cash Wallet" },
  { value: "WALLET", label: "Digital Wallet" },
  { value: "FIXED_DEPOSIT", label: "Fixed Deposit" },
  { value: "RECURRING_DEPOSIT", label: "Recurring Deposit" },
  { value: "BROKERAGE_CASH", label: "Brokerage Cash" },
  { value: "OTHER", label: "Other" },
];

export const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose }) => {
  const createAccountMutation = useCreateAccount();

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("SAVINGS");
  const [currency, setCurrency] = useState("INR");
  const [openingBalance, setOpeningBalance] = useState("0.00");
  const [institutionId, setInstitutionId] = useState<string | undefined>(undefined);
  const [institutionName, setInstitutionName] = useState<string | undefined>(undefined);

  if (!isOpen) return null;

  const resetForm = () => {
    setName("");
    setType("SAVINGS");
    setCurrency("INR");
    setOpeningBalance("0.00");
    setInstitutionId(undefined);
    setInstitutionName(undefined);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInstitutionChange = (id: string | undefined, institution?: FinancialInstitution) => {
    setInstitutionId(id);
    setInstitutionName(institution?.name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<Account> = {
      name,
      type,
      currency,
      openingBalance,
      institutionId,
      isManual: true,
    };
    createAccountMutation.mutate(payload, {
      onSuccess: () => handleClose(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-account-title"
    >
      <div className="relative w-full max-w-lg p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 id="add-account-title" className="text-lg font-bold text-slate-100">
                Add Account
              </h3>
              <p className="text-xs text-slate-400">Manually add a bank, cash, or wallet account</p>
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

        {createAccountMutation.isError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            {(createAccountMutation.error as Error)?.message || "Failed to create account. Please try again."}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Account Name</label>
            <input
              type="text"
              required
              placeholder="e.g. HDFC Salary Savings"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="add-account-institution" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Institution (Optional)
            </label>
            <InstitutionPicker
              id="add-account-institution"
              value={institutionId}
              valueLabel={institutionName}
              onChange={handleInstitutionChange}
              placeholder="e.g. HDFC Bank, Cash / Other…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Account Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Currency</label>
              <input
                type="text"
                required
                maxLength={3}
                placeholder="INR"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 uppercase placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Opening Balance</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
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
              disabled={createAccountMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
            >
              {createAccountMutation.isPending ? "Creating..." : <><CheckCircle2 className="w-4 h-4" /> Save Account</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
