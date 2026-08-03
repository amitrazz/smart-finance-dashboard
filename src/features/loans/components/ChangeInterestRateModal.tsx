import React, { useState } from "react";
import { X, Percent, CheckCircle2 } from "lucide-react";
import { useChangeInterestRate } from "../hooks/useLoanQueries";
import { Loan } from "../../../types";

interface ChangeInterestRateModalProps {
  loan: Loan | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ChangeInterestRateModal: React.FC<ChangeInterestRateModalProps> = ({
  loan,
  isOpen,
  onClose,
}) => {
  const [newRate, setNewRate] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");

  const changeRateMutation = useChangeInterestRate();

  if (!isOpen || !loan) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    changeRateMutation.mutate(
      {
        loanId: loan.id,
        data: { newRate, effectiveDate, reason },
        version: loan.version || 1,
      },
      {
        onSuccess: () => {
          onClose();
          setNewRate("");
          setReason("");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Adjust Interest Rate</h2>
              <p className="text-xs text-slate-400">Floating rate revision for {loan.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
            Current APR: <strong>{loan.interestRate}% ({loan.interestType || "FLOATING"})</strong>. Changing the rate will automatically recalculate the remaining amortization schedule.
          </div>

          <div>
            <label className="text-slate-400 font-semibold block mb-1">New Interest Rate (% APR) *</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 9.25"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              required
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-extrabold text-sm placeholder-slate-600 focus:border-indigo-500 outline-none font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 font-semibold block mb-1">Effective Date *</label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              required
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 font-semibold block mb-1">Revision Reason</label>
            <input
              type="text"
              placeholder="e.g. RBI Repo Rate Increase"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 outline-none"
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
              disabled={changeRateMutation.isPending || !newRate}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{changeRateMutation.isPending ? "Updating..." : "Recalculate Schedule"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
