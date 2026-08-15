import React from "react";
import { ArrowRight } from "lucide-react";
import { ForecastAnalytics } from "../../types/insightsTypes";
import { MetricValue } from "../common/MetricValue";
import { ProjectionBadge } from "../common/Badges";
import { useUIStore } from "../../../../store/useUIStore";

/**
 * "Where is this heading?" — the fifth question Overview answers, in one line.
 *
 * ## Why a strip and not the forecast panel
 *
 * `ForecastPanel` on Analytics → Net worth is the full treatment: actual
 * history charted, projection stated separately, assumptions spelled out. On
 * Overview that would be the largest block on a page whose job is a
 * thirty-second read, and it would push the four questions above it off the
 * first viewport.
 *
 * So Overview gets current → projected and nothing else, and hands off.
 *
 * ## What it refuses to imply
 *
 * A projection is not a forecast of anyone's actual balance. Three things keep
 * that visible rather than buried: the figure carries a "Projected" badge, the
 * assumptions it rests on are printed beside it (the backend requires an age
 * pair this app does not store, so those ages are defaults, not the user's),
 * and the wording is "on these assumptions" rather than "you will have". No
 * intermediate path is drawn, because the endpoint returns a single corpus
 * figure and a drawn line would invite reading values off it that no model
 * produced.
 */
export const TrajectoryStrip: React.FC<{ forecast: ForecastAnalytics }> = ({ forecast }) => {
  const navigateToRoute = useUIStore((s) => s.navigateToRoute);

  const projectedCorpusVal = forecast.projectedCorpus ? parseFloat(forecast.projectedCorpus.amount) : null;
  const isValidProjection = projectedCorpusVal !== null && projectedCorpusVal > 0;

  if (!isValidProjection || (!forecast.projectedCorpus && !forecast.currentNetWorth)) {
    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-400">Projection unavailable</p>
          <p className="text-sm text-slate-350">
            Your current financial data isn't sufficient for a reliable long-term projection.
          </p>
        </div>
        <button
          onClick={() => navigateToRoute("planning")}
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg"
        >
          <span>Review financial plan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const assumptions = [
    forecast.currentAge !== null && forecast.retirementAge !== null
      ? `ages ${forecast.currentAge}→${forecast.retirementAge}`
      : null,
    forecast.expectedReturnPercent !== null
      ? `${forecast.expectedReturnPercent}% assumed return`
      : null,
  ].filter(Boolean);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="text-[11px] text-slate-500">Net worth today</p>
          <p className="text-xl font-semibold tracking-tight text-slate-100 tabular-nums">
            <MetricValue value={forecast.currentNetWorth} money fractionDigits={0} />
          </p>
        </div>

        <ArrowRight className="mb-1.5 h-4 w-4 shrink-0 text-slate-700" aria-hidden="true" />

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-slate-500">
              {forecast.retirementAge !== null
                ? `Corpus at ${forecast.retirementAge}`
                : "Projected corpus"}
            </p>
            <ProjectionBadge />
          </div>
          <p className="text-xl font-semibold tracking-tight text-sky-300 tabular-nums">
            <MetricValue value={forecast.projectedCorpus} money fractionDigits={0} />
          </p>
        </div>

        {forecast.monthlySavingsNeeded && (
          <div className="min-w-0">
            <p className="text-[11px] text-slate-500">To get there, per month</p>
            <p className="text-xl font-semibold tracking-tight text-slate-100 tabular-nums">
              <MetricValue value={forecast.monthlySavingsNeeded} money fractionDigits={0} />
            </p>
          </div>
        )}
      </div>

      <p className="text-[11px] leading-relaxed text-slate-500">
        A projection on {assumptions.length > 0 ? assumptions.join(" and ") : "the engine's stated assumptions"} — not a
        prediction of your balance, and not a guarantee.
      </p>
    </div>
  );
};
