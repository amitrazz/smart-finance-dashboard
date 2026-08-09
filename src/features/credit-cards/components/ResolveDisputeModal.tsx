import React, { useState } from "react";
import { X, Gavel, Check } from "lucide-react";
import { CreditCardDispute } from "../../../types";
import { useResolveCardDispute } from "../hooks/useCreditCardQueries";
import { formatCurrency } from "../../../utils/formatters";

interface ResolveDisputeModalProps {
  cardId: string;
  dispute: CreditCardDispute | null;
  isOpen: boolean;
  onClose: () => void;
}

const getVal = (val: unknown): number => {
  if (typeof val === "object" && val !== null) return parseFloat((val as { amount?: string }).amount || "0");
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val) || 0;
  return 0;
};

export const ResolveDisputeModal: React.FC<ResolveDisputeModalProps> = ({ cardId, dispute, isOpen, onClose }) => {
  const resolveMutation = useResolveCardDispute();
  const [status, setStatus] = useState<"RESOLVED_UPHELD" | "RESOLVED_REVERSED">("RESOLVED_REVERSED");
  const [notes, setNotes] = useState("");

  if (!isOpen || !dispute) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resolveMutation.mutate(
      { cardId, disputeId: dispute.id, data: { status, resolutionNotes: notes || undefined } },
      {
        onSuccess: () => {
          onClose();
          setNotes("");
          setStatus("RESOLVED_REVERSED");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Resolve Dispute</h3>
              <p className="text-xs text-slate-400">
                {dispute.reason} • {formatCurrency({ amount: getVal(dispute.amount).toFixed(2), currency: "INR" })}
              </p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="block text-xs font-semibold text-slate-300 mb-1.5">Outcome *</p>
            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => setStatus("RESOLVED_REVERSED")}
                className={`p-3 rounded-2xl text-left border transition-all ${
                  status === "RESOLVED_REVERSED"
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="text-xs font-bold block">Reversed — Charge Refunded</span>
                <span className="text-[11px] font-normal opacity-80">The provisional credit becomes permanent; reward/cashback earned on it is clawed back.</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus("RESOLVED_UPHELD")}
                className={`p-3 rounded-2xl text-left border transition-all ${
                  status === "RESOLVED_UPHELD"
                    ? "bg-rose-500/15 border-rose-500/40 text-rose-300"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="text-xs font-bold block">Upheld — Charge Stands</span>
                <span className="text-[11px] font-normal opacity-80">The provisional credit is reversed; the original charge is restored.</span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="resolve-notes" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Resolution Notes (Optional)
            </label>
            <textarea
              id="resolve-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resolveMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {resolveMutation.isPending ? "Saving..." : <><Check className="w-4 h-4" /> Confirm Resolution</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
