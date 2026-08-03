import React from "react";
import { X, FileText } from "lucide-react";
import { CreditCardStatement } from "../../../types";
import { formatCurrency } from "../../../utils/formatters";

interface StatementDetailsModalProps {
  statement: CreditCardStatement | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StatementDetailsModal: React.FC<StatementDetailsModalProps> = ({ statement, isOpen, onClose }) => {
  if (!isOpen || !statement) return null;

  const getVal = (val: unknown): number => {
    if (typeof val === "object" && val !== null) return parseFloat((val as { amount?: string }).amount || "0");
    if (typeof val === "number") return val;
    if (typeof val === "string") return parseFloat(val) || 0;
    return 0;
  };

  const statementBal = getVal(statement.statementBalance || statement.closingBalance);
  const openingBal = getVal(statement.openingBalance);
  const minDue = getVal(statement.minimumDue);
  const interest = getVal(statement.interest);
  const fees = getVal(statement.fees);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Statement Details</h3>
              <p className="text-xs text-slate-400">Statement Date: {statement.statementDate}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Status</span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  statement.status === "PAID"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : statement.status === "OVERDUE"
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}
              >
                {statement.status}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs">
              <span className="text-slate-400">Statement Total Due:</span>
              <span className="font-extrabold text-base text-slate-100">
                {formatCurrency({ amount: statementBal.toFixed(2), currency: "INR" })}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Minimum Amount Due:</span>
              <span className="font-bold text-amber-400">
                {formatCurrency({ amount: minDue.toFixed(2), currency: "INR" })}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Payment Due Date:</span>
              <span className="font-bold text-cyan-400">{statement.dueDate}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block">Opening Balance</span>
              <span className="font-bold text-slate-200 mt-0.5 block">
                {formatCurrency({ amount: openingBal.toFixed(2), currency: "INR" })}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block">Closing Balance</span>
              <span className="font-bold text-slate-200 mt-0.5 block">
                {formatCurrency({ amount: statementBal.toFixed(2), currency: "INR" })}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block">Interest Charged</span>
              <span className="font-bold text-rose-400 mt-0.5 block">
                {formatCurrency({ amount: interest.toFixed(2), currency: "INR" })}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block">Fees & Charges</span>
              <span className="font-bold text-amber-400 mt-0.5 block">
                {formatCurrency({ amount: fees.toFixed(2), currency: "INR" })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
