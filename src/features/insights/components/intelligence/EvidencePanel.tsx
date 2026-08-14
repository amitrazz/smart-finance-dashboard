import React from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { ActionEvidence, EvidenceUnit } from "../../../../types";
import { Money } from "../../../../components/common/Money";

/**
 * The arithmetic behind a finding — "why are you telling me this?"
 *
 * Insights renders its own evidence rather than reusing
 * `features/actions/ActionEvidenceList`, for one reason that matters: that
 * component formats currency with `formatCurrency()` directly, so every rupee
 * figure in it stays on screen after "hide amounts". Evidence rows are exactly
 * where the largest amounts appear — balances, monthly spend, interest charged —
 * so an unmaskable evidence panel would make the privacy toggle decorative.
 *
 * Values render through `<Money>` for currency and as plain text otherwise; a
 * ratio, a month count and a score are not balances and are not masked.
 *
 * The backend guarantees these figures came from a snapshot, the ledger or the
 * health engine — `evidence.source` has no AI member by design — which is why
 * this panel is labelled as observation and the rule's prose is not.
 */

const COMPARISON_ICON = { ABOVE: ArrowUp, BELOW: ArrowDown, EQUAL: Minus } as const;
const COMPARISON_TONE = {
  ABOVE: "text-amber-400",
  BELOW: "text-sky-400",
  EQUAL: "text-slate-500",
} as const;

const round = (value: number) => Math.round(value * 100) / 100;

/** `unit` says how to format `value` — never infer it from the metric name. */
const EvidenceValue: React.FC<{ value: number; unit: EvidenceUnit }> = ({ value, unit }) => {
  switch (unit) {
    case "CURRENCY":
      return <Money value={value} fractionDigits={0} />;
    case "PERCENT":
      return <>{round(value)}%</>;
    // A ratio arrives as 0.74, not 74 — rendering it raw beside a percentage
    // baseline would read as "0.74% utilisation".
    case "RATIO":
      return <>{round(value * 100)}%</>;
    case "MONTHS":
      return <>{`${round(value)} ${round(value) === 1 ? "month" : "months"}`}</>;
    case "DAYS":
      return <>{`${round(value)} ${round(value) === 1 ? "day" : "days"}`}</>;
    case "SCORE_POINTS":
      return <>{round(value)}/100</>;
    case "COUNT":
    default:
      return <>{round(value)}</>;
  }
};

/** `monthly_category_spend` → `Monthly category spend`. */
function humanizeMetric(metric: string): string {
  const spaced = metric.replace(/[_-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export const EvidencePanel: React.FC<{ evidence: ActionEvidence[]; className?: string }> = ({
  evidence,
  className = "",
}) => {
  // No evidence is a truthful state: some rules make no numeric claim at all.
  // An empty panel headed "Evidence" implies the arithmetic exists and is merely
  // hidden.
  if (evidence.length === 0) return null;

  return (
    <div className={`space-y-2.5 ${className}`}>
      {evidence.map((item, index) => {
        const Icon = item.comparison ? COMPARISON_ICON[item.comparison.kind] : null;
        const tone = item.comparison ? COMPARISON_TONE[item.comparison.kind] : "";

        return (
          <div key={`${item.metric}-${index}`} className="space-y-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 text-xs text-slate-400">
                {humanizeMetric(item.metric)}
                {item.period && <span className="text-slate-600"> · {item.period}</span>}
              </span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-100">
                <EvidenceValue value={item.value} unit={item.unit} />
              </span>
            </div>

            {item.baseline && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                {Icon && <Icon className={`h-3 w-3 shrink-0 ${tone}`} aria-hidden="true" />}
                <span className="tabular-nums">
                  vs <EvidenceValue value={item.baseline.value} unit={item.unit} />{" "}
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
              Surfaced only below 1. A deterministic read off a snapshot is
              exactly 1, so a badge on every row would be noise — what matters is
              flagging the figures the rule projected rather than measured.
            */}
            {item.confidence < 1 && (
              <span className="inline-block text-[11px] text-amber-400/90">
                Projected — {Math.round(item.confidence * 100)}% confidence
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

/** Where the numbers came from, in one line. */
export const EvidenceSource: React.FC<{ evidence: ActionEvidence[] }> = ({ evidence }) => {
  if (evidence.length === 0) return null;
  const sources = Array.from(new Set(evidence.map((item) => item.source))).filter(Boolean);
  const entities = evidence.reduce((total, item) => total + (item.sourceEntityIds?.length ?? 0), 0);
  if (sources.length === 0) return null;

  return (
    <p className="text-[11px] text-slate-600">
      Measured from {sources.join(", ").toLowerCase().replace(/_/g, " ")}
      {entities > 0 && ` · ${entities} record${entities === 1 ? "" : "s"}`}
    </p>
  );
};
