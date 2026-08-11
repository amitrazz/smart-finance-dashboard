import React, { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { RiskItem } from "../../types/insightsTypes";
import { useUIStore } from "../../../../store/useUIStore";
import { Money } from "../../../../components/common/Money";
import { Button } from "../../../../components/ui/Button";
import { SEVERITY, formatDueIn } from "../../utils/insightsFormat";
import { resolveActionRoute } from "../../utils/actionRoutes";
import { ConfidenceBadge } from "../common/Badges";

interface RiskCardProps {
  risk: RiskItem;
  /** `compact` is Overview's form: severity, title, impact, one action. */
  compact?: boolean;
}

/**
 * A risk: something that needs attention, with a reason and a way out.
 *
 * Deliberately shaped *unlike* `RecommendationCard`. The two used to be visually
 * interchangeable — same rounded panel, same badge, same button — so a warning
 * and a suggestion carried identical weight. A risk here gets a coloured left
 * rule and a severity word; a recommendation gets neither. That difference
 * survives greyscale and colour-blindness, because severity is always spelled
 * out as text alongside the colour.
 *
 * Everything optional is conditional: no due date, no due line; no evidence, no
 * confidence figure; no resolvable destination, no button. The card never
 * invents a call to action it can't honour.
 */
export const RiskCard: React.FC<RiskCardProps> = ({ risk, compact = false }) => {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const navigateToRoute = useUIStore((s) => s.navigateToRoute);

  const severity = SEVERITY[risk.severity];
  const due = formatDueIn(risk.dueInDays);
  const destination = resolveActionRoute({ deepLink: risk.deepLink, category: risk.category });
  const hasDetail = Boolean(risk.resolution || risk.affectedEntity);

  return (
    <article
      className={`rounded-2xl border border-slate-800 border-l-2 bg-slate-950/60 ${severity.rule}`}
    >
      <div className="space-y-2 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${severity.chip}`}
          >
            {severity.label}
          </span>
          <span className="text-[11px] text-slate-500">{risk.category}</span>
          {due && (
            <span
              className={`text-[11px] font-medium ${
                (risk.dueInDays ?? 1) <= 0 ? "text-rose-400" : "text-amber-400"
              }`}
            >
              {due}
            </span>
          )}
        </div>

        <h3 className="text-sm font-medium leading-snug text-slate-100">{risk.title}</h3>
        <p className="text-xs leading-relaxed text-slate-400">{risk.reason}</p>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-0.5">
          <div className="flex flex-wrap items-center gap-3">
            {risk.financialImpact && (
              <span className="text-sm font-medium tabular-nums text-slate-200">
                <Money value={risk.financialImpact} />
              </span>
            )}
            <ConfidenceBadge percent={risk.confidencePercent} />
          </div>

          {destination && (
            <Button
              variant="neutral"
              hierarchy="outline"
              size="sm"
              onClick={() => navigateToRoute(destination.tab, destination.subTab)}
            >
              {destination.label}
            </Button>
          )}
        </div>
      </div>

      {!compact && hasDetail && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls={panelId}
            className="flex w-full items-center justify-between gap-2 border-t border-slate-800 px-4 py-2 text-left text-xs font-medium text-slate-400 transition-colors hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
          >
            {expanded ? "Hide detail" : "Detail"}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>

          {expanded && (
            <dl id={panelId} className="space-y-2 border-t border-slate-800 px-4 py-3 text-xs">
              {risk.affectedEntity && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-slate-500">Affects</dt>
                  <dd className="text-slate-300">{risk.affectedEntity}</dd>
                </div>
              )}
              {risk.resolution && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-slate-500">Resolution</dt>
                  <dd className="leading-relaxed text-slate-300">{risk.resolution}</dd>
                </div>
              )}
            </dl>
          )}
        </>
      )}
    </article>
  );
};
