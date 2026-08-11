import React from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { ActionEvidence, EvidenceUnit } from "../../../types";
import { formatCurrency } from "../../../utils/formatters";

/**
 * Renders the deterministic metrics a rule fired on — the machine-readable
 * half of "why am I seeing this?".
 *
 * The backend guarantees these numbers came from a snapshot, the ledger or the
 * health engine, never from an AI: `evidence.source` has no AI member by
 * design. So this panel is the part of the card the user can actually trust
 * arithmetically, and it's worth showing the comparison basis rather than
 * paraphrasing it.
 */

/** `unit` says how to format `value` — never infer it from the metric name. */
function formatValue(value: number, unit: EvidenceUnit): string {
  switch (unit) {
    case "CURRENCY":
      return formatCurrency(value);
    case "PERCENT":
      return `${round(value)}%`;
    // A ratio arrives as 0.74, not 74 — rendering it raw next to a percentage
    // baseline would read as "0.74% utilization".
    case "RATIO":
      return `${round(value * 100)}%`;
    case "MONTHS":
      return `${round(value)} ${round(value) === 1 ? "month" : "months"}`;
    case "DAYS":
      return `${round(value)} ${round(value) === 1 ? "day" : "days"}`;
    case "SCORE_POINTS":
      return `${round(value)}/100`;
    case "COUNT":
    default:
      return String(round(value));
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** `monthly_category_spend` -> `Monthly category spend`. */
function humanizeMetric(metric: string): string {
  const spaced = metric.replace(/[_-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const COMPARISON_ICON = {
  ABOVE: ArrowUp,
  BELOW: ArrowDown,
  EQUAL: Minus,
} as const;

const COMPARISON_TONE = {
  ABOVE: "text-amber-400",
  BELOW: "text-indigo-300",
  EQUAL: "text-slate-400",
} as const;

interface ActionEvidenceListProps {
  evidence: ActionEvidence[];
}

export const ActionEvidenceList: React.FC<ActionEvidenceListProps> = ({
  evidence,
}) => {
  if (evidence.length === 0) return null;

  return (
    <div className="pt-2 mt-2 border-t border-slate-800/60 space-y-2">
      <span className="font-bold text-indigo-300 block">Evidence:</span>

      {evidence.map((item, idx) => {
        const Icon = item.comparison
          ? COMPARISON_ICON[item.comparison.kind]
          : null;
        const tone = item.comparison
          ? COMPARISON_TONE[item.comparison.kind]
          : "";

        return (
          <div key={`${item.metric}-${idx}`} className="space-y-0.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-slate-400">
                {humanizeMetric(item.metric)}
                {item.period && (
                  <span className="text-slate-500"> · {item.period}</span>
                )}
              </span>
              <span className="font-mono font-bold text-slate-100 shrink-0">
                {formatValue(item.value, item.unit)}
              </span>
            </div>

            {item.baseline && (
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                {Icon && <Icon className={`w-3 h-3 shrink-0 ${tone}`} />}
                <span>
                  vs {formatValue(item.baseline.value, item.unit)}{" "}
                  {item.baseline.label}
                  {item.comparison?.changePercent !== null &&
                    item.comparison?.changePercent !== undefined && (
                      <span className={`font-semibold ${tone}`}>
                        {" "}
                        ({round(Math.abs(item.comparison.changePercent))}%)
                      </span>
                    )}
                </span>
              </div>
            )}

            {/*
              Only surfaced below 1. Deterministic reads off a snapshot are
              exactly 1, so a badge on every row would be noise — what matters
              is flagging the ones the rule projected rather than measured.
            */}
            {item.confidence < 1 && (
              <span className="inline-block text-[10px] text-amber-400/80">
                Projected — {Math.round(item.confidence * 100)}% confidence
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
