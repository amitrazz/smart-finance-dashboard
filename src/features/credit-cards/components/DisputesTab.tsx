import React, { useState } from "react";
import { ShieldAlert, RefreshCw, AlertTriangle, Plus, Gavel } from "lucide-react";
import { useCardDisputes } from "../hooks/useCreditCardQueries";
import { CreditCardDispute } from "../../../types";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { RaiseDisputeModal } from "./RaiseDisputeModal";
import { ResolveDisputeModal } from "./ResolveDisputeModal";

interface DisputesTabProps {
  cardId: string;
}

const getVal = (val: unknown): number => {
  if (typeof val === "object" && val !== null) return parseFloat((val as { amount?: string }).amount || "0");
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val) || 0;
  return 0;
};

export const DisputesTab: React.FC<DisputesTabProps> = ({ cardId }) => {
  const { data: disputes = [], isLoading, isError, error, refetch } = useCardDisputes(cardId);
  const [isRaising, setIsRaising] = useState(false);
  const [resolvingDispute, setResolvingDispute] = useState<CreditCardDispute | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 bg-slate-900/60 rounded-3xl border border-slate-800" />
        <div className="h-44 bg-slate-900/60 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-100">Failed to Load Disputes</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not retrieve dispute history."}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const openCount = disputes.filter((d) => d.status === "OPEN").length;

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" /> Transaction Disputes
          </h4>
          <p className="text-xs text-slate-400">
            {openCount > 0 ? `${openCount} dispute(s) currently open.` : "Raise a dispute against a charge to get an immediate provisional credit."}
          </p>
        </div>
        <button
          onClick={() => setIsRaising(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-lg shadow-rose-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" /> Raise Dispute
        </button>
      </div>

      {disputes.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
          <ShieldAlert className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No Disputes Raised</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Disputed charges will show up here with their resolution status.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                <th className="py-3.5 px-4">Raised Date</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {disputes.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-100">{formatDate(d.raisedDate)}</td>
                  <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate" title={d.reason}>{d.reason}</td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-slate-100">
                    {formatCurrency({ amount: getVal(d.amount).toFixed(2), currency: "INR" })}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        d.status === "OPEN"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : d.status === "RESOLVED_REVERSED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {d.status.replace("RESOLVED_", "")}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {d.status === "OPEN" && (
                      <button
                        onClick={() => setResolvingDispute(d)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-[11px] font-semibold transition-colors"
                      >
                        <Gavel className="w-3 h-3" /> Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RaiseDisputeModal cardId={cardId} isOpen={isRaising} onClose={() => setIsRaising(false)} />
      <ResolveDisputeModal
        cardId={cardId}
        dispute={resolvingDispute}
        isOpen={Boolean(resolvingDispute)}
        onClose={() => setResolvingDispute(null)}
      />
    </div>
  );
};
