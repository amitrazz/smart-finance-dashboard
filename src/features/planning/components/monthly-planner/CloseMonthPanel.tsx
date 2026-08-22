import React from "react";
import { Lock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { MonthlyCloseCarryForwardResult } from "../../../../types";

interface CloseMonthPanelProps {
  onClose: () => void;
  isClosing: boolean;
  carryForwardResults?: MonthlyCloseCarryForwardResult[];
}

/** Spec §15 — only ever shown for a month that has already ended (period.timing === "PAST"). Closing dispatches the real budget carry-forward flow; per-budget outcomes are shown, never silently swallowed. */
export const CloseMonthPanel: React.FC<CloseMonthPanelProps> = ({ onClose, isClosing, carryForwardResults }) => {
  return (
    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-bold text-slate-100">Close Month</h3>
            <p className="text-xs text-slate-500">Finalizes this month's plan vs. actual and carries forward eligible budgets.</p>
          </div>
        </div>
        <Button variant="primary" hierarchy="filled" size="sm" isLoading={isClosing} onClick={onClose}>
          Close Month
        </Button>
      </div>

      {carryForwardResults && carryForwardResults.length > 0 && (
        <ul className="space-y-1.5 pt-3 border-t border-slate-800/60">
          {carryForwardResults.map((r) => (
            <li key={r.budgetId} className="flex items-center gap-2 text-xs">
              {r.outcome === "CARRIED" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
              )}
              <span className="text-slate-300">
                Budget {r.budgetId.slice(0, 8)}… — {r.outcome === "CARRIED" ? "carried forward" : `skipped (${r.reason ?? "not eligible"})`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CloseMonthPanel;
