import React, { useState } from "react";
import { X, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useCreateLoan } from "../../../hooks/useFinanceQueries";

interface AddLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddLoanModal: React.FC<AddLoanModalProps> = ({ isOpen, onClose }) => {
  const createLoanMutation = useCreateLoan();

  const [name, setName] = useState("");
  const [type, setType] = useState("HOME");
  const [currency, setCurrency] = useState("INR");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [tenureMonths, setTenureMonths] = useState("12");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(principalAmount) || 0;
    const r = parseFloat(interestRate) || 0;
    const n = parseInt(tenureMonths, 10) || 12;

    let computedEmi = 0;
    if (p > 0 && n > 0) {
      if (r > 0) {
        const monthlyRate = r / 100 / 12;
        computedEmi = (p * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
      } else {
        computedEmi = p / n;
      }
    }

    const emiString = isNaN(computedEmi) || computedEmi <= 0 ? "0.00" : computedEmi.toFixed(2);

    createLoanMutation.mutate(
      {
        name,
        type,
        currency,
        principalAmount,
        outstandingBalance: principalAmount,
        interestRate,
        tenureMonths: n,
        emiAmount: emiString,
        startDate,
      } as unknown as Partial<import("../../../types").Loan>,
      {
        onSuccess: () => {
          onClose();
          setName("");
          setPrincipalAmount("");
          setInterestRate("");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Add New Loan</h3>
              <p className="text-xs text-slate-400">Register loan details to auto-generate EMI schedule</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {createLoanMutation.isError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            {(createLoanMutation.error as Error)?.message || "Failed to create loan. Please try again."}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Loan Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Home Loan - HDFC"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Loan Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="HOME">Home Loan</option>
                <option value="PERSONAL">Personal Loan</option>
                <option value="AUTO">Auto / Car Loan</option>
                <option value="EDUCATION">Education Loan</option>
                <option value="MORTGAGE">Mortgage Loan</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Principal Amount</label>
              <input
                type="number"
                step="any"
                required
                placeholder="1000000"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Interest Rate (%)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="8.5"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tenure (Months)</label>
              <input
                type="number"
                required
                min="1"
                placeholder="120"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
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
              disabled={createLoanMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
            >
              {createLoanMutation.isPending ? "Creating..." : <><CheckCircle2 className="w-4 h-4" /> Save Loan</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
