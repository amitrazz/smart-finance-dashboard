import React, { useId, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { SmartRecommendation } from "../../types/insightsTypes";
import { useUIStore } from "../../../../store/useUIStore";
import { Button } from "../../../../components/ui/Button";
import { IMPACT, formatPoints } from "../../utils/insightsFormat";
import { resolveActionRoute } from "../../utils/actionRoutes";

interface RecommendationCardProps {
  recommendation: SmartRecommendation;
  compact?: boolean;
}

/**
 * A recommendation: something to *do*, distinct from a risk to *watch*.
 *
 * The visual grammar is intentionally the inverse of `RiskCard` — no severity
 * rule down the side, a filled action button rather than an outlined one — so
 * the two are told apart before either is read.
 *
 * What this card will not do is quantify an outcome the backend didn't. The
 * previous version always rendered "Est. Monthly Impact **+₹0.00**" in emerald,
 * because the mapper hardcoded `estimatedMonthlySavings` to zero — every
 * recommendation advertised a precise saving of nothing. The only impact figure
 * shown here is the health-score movement the engine actually attributes, and
 * it is labelled as a score movement, not money.
 */
export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  compact = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const navigateToRoute = useUIStore((s) => s.navigateToRoute);

  const impact = IMPACT[recommendation.impactType];
  const scoreDelta = formatPoints(recommendation.scoreImpact);
  const destination = resolveActionRoute({
    deepLink: recommendation.deepLink,
    component: recommendation.component,
  });
  const hasDetail = Boolean(recommendation.reason) && !compact;

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/60">
      <div className="space-y-2 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${impact.chip}`}
          >
            {impact.label}
          </span>
          {scoreDelta && (
            <span className="text-[11px] text-slate-400">
              {scoreDelta} to health score
            </span>
          )}
        </div>

        <h3 className="text-sm font-medium leading-snug text-slate-100">
          {recommendation.title}
        </h3>

        {compact && recommendation.reason && (
          <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">
            {recommendation.reason}
          </p>
        )}

        {destination && (
          <div className="pt-1">
            <Button
              variant="primary"
              hierarchy="filled"
              size="sm"
              rightIcon={<ArrowRight className="h-3 w-3" aria-hidden="true" />}
              onClick={() => navigateToRoute(destination.tab, destination.subTab)}
            >
              {destination.label}
            </Button>
          </div>
        )}
      </div>

      {hasDetail && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls={panelId}
            className="flex w-full items-center justify-between gap-2 border-t border-slate-800 px-4 py-2 text-left text-xs font-medium text-slate-400 transition-colors hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
          >
            {expanded ? "Hide detail" : "Why this is suggested"}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
          {expanded && (
            <div id={panelId} className="border-t border-slate-800 px-4 py-3">
              <p className="text-xs leading-relaxed text-slate-300">{recommendation.reason}</p>
            </div>
          )}
        </>
      )}
    </article>
  );
};
