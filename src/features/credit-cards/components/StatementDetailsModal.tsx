import React, { useState } from "react";
import { X, FileText, DollarSign, Edit2, Check } from "lucide-react";
import { CreditCardStatement, UpdateCreditCardStatementInput } from "../../../types";
import { formatCurrency } from "../../../utils/formatters";
import { useUpdateCardStatement } from "../hooks/useCreditCardQueries";

interface StatementDetailsModalProps {
  cardId: string;
  statement: CreditCardStatement | null;
  isOpen: boolean;
  onClose: () => void;
  onRecordPayment?: (statementId: string) => void;
}

export const StatementDetailsModal: React.FC<StatementDetailsModalProps> = ({
  cardId,
  statement,
  isOpen,
  onClose,
  onRecordPayment,
}) => {
  const updateStatementMutation = useUpdateCardStatement();
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [correction, setCorrection] = useState<UpdateCreditCardStatementInput>({});

  const getVal = (val: unknown): number => {
    if (typeof val === "object" && val !== null) return parseFloat((val as { amount?: string }).amount || "0");
    if (typeof val === "number") return val;
    if (typeof val === "string") return parseFloat(val) || 0;
    return 0;
  };

  React.useEffect(() => {
    if (statement) {
      setIsCorrecting(false);
      setCorrection({
        statementBalance: String(getVal(statement.statementBalance || statement.closingBalance)),
        minimumDue: String(getVal(statement.minimumDue)),
        interestCharged: String(getVal(statement.interest)),
        fees: String(getVal(statement.fees)),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statement?.id]);

  if (!isOpen || !statement) return null;

  const statementBal = getVal(statement.statementBalance || statement.closingBalance);
  const openingBal = getVal(statement.openingBalance);
  const minDue = getVal(statement.minimumDue);
  const interest = getVal(statement.interest);
  const fees = getVal(statement.fees);
  const canPay = statement.status !== "PAID" && statement.status !== "ARCHIVED";

  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    updateStatementMutation.mutate(
      { cardId, statementId: statement.id, data: correction },
      { onSuccess: () => setIsCorrecting(false) }
    );
  };

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
            aria-label="Close"
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

          {isCorrecting ? (
            <form onSubmit={handleSaveCorrection} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Correct Statement Figures</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="corr-statement-balance" className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Statement Balance
                  </label>
                  <input
                    id="corr-statement-balance"
                    type="number"
                    step="any"
                    value={correction.statementBalance ?? ""}
                    onChange={(e) => setCorrection((c) => ({ ...c, statementBalance: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="corr-minimum-due" className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Minimum Due
                  </label>
                  <input
                    id="corr-minimum-due"
                    type="number"
                    step="any"
                    value={correction.minimumDue ?? ""}
                    onChange={(e) => setCorrection((c) => ({ ...c, minimumDue: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="corr-interest" className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Interest Charged
                  </label>
                  <input
                    id="corr-interest"
                    type="number"
                    step="any"
                    value={correction.interestCharged ?? ""}
                    onChange={(e) => setCorrection((c) => ({ ...c, interestCharged: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="corr-fees" className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Fees
                  </label>
                  <input
                    id="corr-fees"
                    type="number"
                    step="any"
                    value={correction.fees ?? ""}
                    onChange={(e) => setCorrection((c) => ({ ...c, fees: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={updateStatementMutation.isPending}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {updateStatementMutation.isPending ? "Saving..." : <><Check className="w-4 h-4" /> Save Correction</>}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCorrecting(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center gap-3">
              {canPay && (
                <button
                  type="button"
                  onClick={() => onRecordPayment?.(statement.id)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all"
                >
                  <DollarSign className="w-4 h-4" /> Record Payment for This Statement
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsCorrecting(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shrink-0"
              >
                <Edit2 className="w-3.5 h-3.5" /> Correct
              </button>
            </div>
          )}
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
