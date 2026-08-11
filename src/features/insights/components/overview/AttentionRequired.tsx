import React from "react";
import { ShieldCheck } from "lucide-react";
import { RiskMatrixAnalytics } from "../../types/insightsTypes";
import { sortRisks } from "../../utils/insightsFormat";
import { RiskCard } from "../intelligence/RiskCard";
import { RiskSummary } from "../intelligence/RiskSummary";

interface AttentionRequiredProps {
  matrix: RiskMatrixAnalytics;
  /** How many risks to surface here. The rest live under Intelligence. */
  limit?: number;
}

/**
 * The "what needs me right now" block on Overview.
 *
 * Shows the severity breakdown and only the top few risks. The full matrix
 * belongs under Intelligence — dumping every risk here is what made the old
 * Overview scroll for pages and buried the trajectory below three folds.
 *
 * Ordering is by `sortRisks`: severity, then how soon it bites, then detection
 * confidence. "Top 3" is only meaningful if the ranking is.
 */
export const AttentionRequired: React.FC<AttentionRequiredProps> = ({ matrix, limit = 3 }) => {
  const ranked = sortRisks(matrix.risks);
  const shown = ranked.slice(0, limit);
  const remaining = ranked.length - shown.length;

  return (
    <div className="space-y-4">
      <RiskSummary matrix={matrix} />

      <div className="space-y-3">
        {shown.map((risk) => (
          <RiskCard key={risk.id} risk={risk} compact />
        ))}
      </div>

      {remaining > 0 && (
        <p className="text-xs text-slate-500">
          {remaining} more {remaining === 1 ? "risk" : "risks"} under Intelligence.
        </p>
      )}
    </div>
  );
};

/** Shown in place of the list when the action feed flagged nothing. */
export const NothingNeedsAttention: React.FC = () => (
  <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
    <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
    <div>
      <p className="text-sm font-medium text-slate-100">Nothing needs your attention</p>
      <p className="text-xs text-slate-400">
        No active risks were flagged against your accounts, cards, loans or goals.
      </p>
    </div>
  </div>
);
