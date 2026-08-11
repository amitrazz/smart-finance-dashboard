import React from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { FinancialHealthOverview } from "../../types/insightsTypes";
import { directionOf, formatPoints, healthStatus } from "../../utils/insightsFormat";
import { DataFreshnessBadge } from "../common/Badges";

interface HealthScoreCardProps {
  health: FinancialHealthOverview;
  /** Overview uses the compact form; the Health page uses the full one. */
  compact?: boolean;
  updatedAt?: number | null;
}

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The score, its status, and its direction. Three facts, stated once each.
 *
 * The previous hero encoded the same score five ways at once — a number, a
 * five-star row, a progress bar, a coloured ring and a rating word — so reading
 * it meant reconciling five representations that could disagree. They *did*
 * disagree: the ring was hardcoded emerald and the trend read "Upward (+2 pts)"
 * regardless of the actual score or `scoreTrend`, so a critical score rendered
 * in the colour and copy of a healthy one.
 *
 * Here the dial is the only redundancy, and it is derived from the same number
 * it draws. Status is always a word as well as a colour, and the trend line
 * disappears entirely when there is no prior snapshot to compare against.
 */
export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({
  health,
  compact = false,
  updatedAt = null,
}) => {
  const status = healthStatus(health.rating);
  const trend = formatPoints(health.monthlyTrend);
  const direction = directionOf(health.monthlyTrend);
  const TrendIcon =
    direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : ArrowRight;

  const clamped = Math.max(0, Math.min(100, health.overallScore));
  const dash = (clamped / 100) * CIRCUMFERENCE;

  return (
    <div className="flex flex-wrap items-center gap-5 sm:gap-8">
      <div
        className="relative shrink-0"
        role="img"
        aria-label={`Financial health score ${health.overallScore} out of 100. Status: ${status.label}.`}
      >
        <svg width="104" height="104" viewBox="0 0 104 104" aria-hidden="true">
          <circle
            cx="52"
            cy="52"
            r={RADIUS}
            fill="none"
            stroke="#1e293b"
            strokeWidth="8"
          />
          <circle
            cx="52"
            cy="52"
            r={RADIUS}
            fill="none"
            stroke={status.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
            transform="rotate(-90 52 52)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums tracking-tight text-slate-50">
            {health.overallScore}
          </span>
          <span className="text-[10px] font-medium text-slate-500">/ 100</span>
        </div>
      </div>

      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${status.chip}`}
          >
            {status.label}
          </span>
          {trend && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium ${
                direction === "up"
                  ? "text-emerald-400"
                  : direction === "down"
                    ? "text-rose-400"
                    : "text-slate-400"
              }`}
            >
              <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {trend} vs previous period
            </span>
          )}
        </div>

        {!compact && (
          <p className="max-w-lg text-sm leading-relaxed text-slate-400">
            Scored across {health.dimensions.length} dimensions of your finances. Each dimension is
            graded independently; the overall score is the engine's weighted view of them.
          </p>
        )}

        <DataFreshnessBadge updatedAt={updatedAt} asOf={health.asOf} />
      </div>
    </div>
  );
};
