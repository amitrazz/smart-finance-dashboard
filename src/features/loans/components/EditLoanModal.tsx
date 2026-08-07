import React, { useState, useEffect } from "react";
import { X, CheckCircle2, Edit3, Wallet } from "lucide-react";
import { useUpdateLoan } from "../hooks/useLoanQueries";
import { useAccounts } from "../../../hooks/useFinanceQueries";
import { Loan, LoanStatus, UpdateLoanInput, FinancialInstitution } from "../../../types";
import { InstitutionPicker } from "../../../components/common/InstitutionPicker";
import { AsyncSearchSelect } from "../../../components/common/AsyncSearchSelect";

interface EditLoanModalProps {
  loan: Loan | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditLoanModal: React.FC<EditLoanModalProps> = ({ loan, isOpen, onClose }) => {
  const [formData, setFormData] = useState<UpdateLoanInput>({
    name: "",
    lenderName: "",
    institutionId: "",
    loanNumber: "",
    purpose: "",
    notes: "",
    autoDebit: false,
    accountId: "",
    status: "ACTIVE",
  });

  const updateLoanMutation = useUpdateLoan();
  const [accountSearch, setAccountSearch] = useState("");
  const { data: accounts = [], isFetching: isAccountsFetching } = useAccounts({
    search: accountSearch || undefined,
    limit: 100,
  });

  const handleInstitutionChange = (id: string | undefined, institution?: FinancialInstitution) => {
    setFormData((prev) => ({
      ...prev,
      institutionId: id || "",
      lenderName: institution?.name ?? prev.lenderName,
    }));
  };

  useEffect(() => {
    if (loan) {
      setFormData({
        name: loan.name || "",
        lenderName: loan.lenderName || "",
        institutionId: loan.institutionId || "",
        loanNumber: loan.loanNumber || "",
        purpose: loan.purpose || "",
        notes: loan.notes || "",
        autoDebit: Boolean(loan.autoDebit),
        accountId: loan.accountId || "",
        status: loan.status || "ACTIVE",
      });
    }
  }, [loan]);

  if (!isOpen || !loan) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const allowedPatchStatuses = ["DEFAULTED", "RESTRUCTURED", "SETTLED", "CANCELLED"];

    const payload: UpdateLoanInput = {
      name: formData.name || undefined,
      lenderName: formData.lenderName || undefined,
      institutionId: formData.institutionId || undefined,
      loanNumber: formData.loanNumber || undefined,
      purpose: formData.purpose || undefined,
      notes: formData.notes || undefined,
      autoDebit: formData.autoDebit,
      accountId: formData.accountId || undefined,
      status: allowedPatchStatuses.includes(formData.status || "") ? formData.status : undefined,
    };

    updateLoanMutation.mutate(
      {
        id: loan.id,
        data: payload,
        version: loan.version || 1,
      },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-100 font-sans tracking-tight">Edit Loan Details</h2>
              <p className="text-xs text-slate-400">Update loan metadata, lender bank, account status & settings</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 font-semibold block mb-1.5">Loan Nickname *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label htmlFor="edit-loan-institution" className="text-slate-400 font-semibold block mb-1.5">Lender Institution</label>
              <InstitutionPicker
                id="edit-loan-institution"
                value={formData.institutionId || undefined}
                valueLabel={formData.lenderName || undefined}
                onChange={handleInstitutionChange}
                placeholder="-- Select Lender Bank / Institution --"
              />
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1.5">Loan Account / Ref #</label>
              <input
                type="text"
                placeholder="e.g. LN-889412"
                value={formData.loanNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, loanNumber: e.target.value }))}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-indigo-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1.5">Loan Purpose</label>
              <input
                type="text"
                placeholder="e.g. Home Renovation, Vehicle, Education"
                value={formData.purpose}
                onChange={(e) => setFormData((prev) => ({ ...prev, purpose: e.target.value }))}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1.5">Loan Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as LoanStatus }))}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="CLOSED">Closed</option>
                <option value="DEFAULTED">Defaulted</option>
                <option value="SETTLED">Settled</option>
                <option value="RESTRUCTURED">Restructured</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1.5">Linked Payment Account</label>
              <AsyncSearchSelect
                value={formData.accountId}
                valueLabel={
                  formData.accountId
                    ? (() => {
                        const acc = accounts.find((a) => a.id === formData.accountId);
                        return acc ? `${acc.name} (${acc.type})` : undefined;
                      })()
                    : "No Linked Bank Account"
                }
                items={accounts}
                isFetching={isAccountsFetching}
                onSearch={setAccountSearch}
                onSelect={(acc) => setFormData((prev) => ({ ...prev, accountId: acc.id }))}
                onClear={() => setFormData((prev) => ({ ...prev, accountId: "" }))}
                getOptionKey={(acc) => acc.id}
                icon={<Wallet className="w-4 h-4 text-slate-500 shrink-0" />}
                placeholder="No Linked Bank Account"
                emptyMessage="No matching accounts"
                renderOption={(acc) => (
                  <span className="truncate">
                    {acc.name} ({acc.type})
                  </span>
                )}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="editAutoDebit"
              checked={formData.autoDebit}
              onChange={(e) => setFormData((prev) => ({ ...prev, autoDebit: e.target.checked }))}
              className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="editAutoDebit" className="text-xs text-slate-300 font-semibold cursor-pointer">
              Auto-debit active on linked bank account
            </label>
          </div>

          <div>
            <label className="text-slate-400 font-semibold block mb-1.5">Notes & Documentation</label>
            <textarea
              rows={3}
              placeholder="Additional details, tax notes, or agreement references..."
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-indigo-500 outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateLoanMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer shadow-lg shadow-indigo-600/20 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{updateLoanMutation.isPending ? "Saving..." : "Save Loan Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
