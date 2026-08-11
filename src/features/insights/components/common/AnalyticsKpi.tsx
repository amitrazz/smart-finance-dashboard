import React from "react";
import { motion } from "framer-motion";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Money as MoneyType } from "../../../../types";
import { MetricValue } from "./MetricValue";
import { Direction } from "../../utils/insightsFormat";

export interface AnalyticsKpiProps {
  label: string;
  value: MoneyType | number | string | null | undefined;
  money?: boolean;
  suffix?: string;
  precision?: number;
  /** Short caption under the value: a comparison, a target, a qualifier. */
  caption?: string | null;
  /** Change indicator. Rendered only when `delta` is a real string. */
  delta?: string | null;
  direction?: Direction;
  /**
   * Whether an upward move is good here. Debt going up is not a win, so the
   * arrow direction and its colour are decided separately.
   */
  upIsGood?: boolean;
  icon?: React.ReactNode;
  accent?: keyof typeof ACCENT_CLASSES;
  /** Marks the figure as a projection rather than a measurement. */
  badge?: React.ReactNode;
}

/** Mirrors the accent palette in `src/components/common/MetricCard.tsx`. */
const ACCENT_CLASSES = {
  indigo: "border-indigo-500/20 bg-gradient-to-b from-indigo-500/5 via-slate-900/60 to-slate-900/80",
  emerald:
    "border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 via-slate-900/60 to-slate-900/80",
  amber: "border-amber-500/20 bg-gradient-to-b from-amber-500/5 via-slate-900/60 to-slate-900/80",
  sky: "border-sky-500/20 bg-gradient-to-b from-sky-500/5 via-slate-900/60 to-slate-900/80",
  rose: "border-rose-500/20 bg-gradient-to-b from-rose-500/5 via-slate-900/60 to-slate-900/80",
  purple: "border-purple-500/20 bg-gradient-to-b from-purple-500/5 via-slate-900/60 to-slate-900/80",
} as const;

const DIRECTION_ICON = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
} as const;

/**
 * One number in a KPI row, in the app's shared metric-card shape.
 *
 * ## Why this isn't literally `components/common/MetricCard`
 *
 * The classes, radius, accent gradients, hover lift and footer divider are
 * copied from it deliberately, so a KPI here is indistinguishable from one on
 * Dashboard or Loans. What can't be reused is its value rendering: `MetricCard`
 * takes `Money | string` and formats it with `formatCurrency()` directly, which
 * (a) bypasses privacy mode, so amounts stay on screen after "hide amounts",
 * and (b) has no way to express "the backend didn't give us this" — a missing
 * figure would arrive as `0` and render as a confident ₹0.00.
 *
 * Both are the exact defects this redesign exists to remove, so the value goes
 * through `<MetricValue>` instead. Everything visual is shared.
 */
export const AnalyticsKpi: React.FC<AnalyticsKpiProps> = ({
  label,
  value,
  money = false,
  suffix,
  precision,
  caption,
  delta,
  direction = "flat",
  upIsGood = true,
  icon,
  accent = "indigo",
  badge,
}) => {
  const Icon = DIRECTION_ICON[direction];
  const isGood = direction === "flat" ? null : (direction === "up") === upIsGood;
  const deltaTone =
    isGood === null ? "text-slate-400" : isGood ? "text-emerald-400" : "text-rose-400";

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`p-5 rounded-3xl border backdrop-blur-xl transition-all duration-200 hover:border-slate-700 shadow-xl ${ACCENT_CLASSES[accent]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[11px] font-bold uppercase tracking-wide text-slate-400">
              {label}
            </p>
            {badge}
          </div>
          <h3 className="truncate text-2xl font-extrabold tracking-tight text-slate-100 sm:text-3xl">
            <MetricValue
              value={value}
              money={money}
              suffix={suffix}
              precision={precision}
              emptyClassName="text-base font-semibold text-slate-500"
            />
          </h3>
        </div>
        {icon && (
          <div className="shrink-0 rounded-2xl border border-slate-700/50 bg-slate-800/80 p-3 text-slate-200 shadow-inner">
            {icon}
          </div>
        )}
      </div>

      {(delta || caption) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/60 pt-2 text-xs">
          {delta && (
            <span className={`inline-flex items-center gap-1 font-bold ${deltaTone}`}>
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {delta}
            </span>
          )}
          {caption && (
            <p className="ml-auto truncate text-[11px] font-medium text-slate-400">{caption}</p>
          )}
        </div>
      )}
    </motion.div>
  );
};

/**
 * KPI row. Two columns on phones so a four-metric row stays two taps tall
 * rather than four screens long.
 */
export const AnalyticsKpiRow: React.FC<{ children: React.ReactNode; columns?: 2 | 3 | 4 }> = ({
  children,
  columns = 4,
}) => (
  <div
    className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
      columns === 4 ? "lg:grid-cols-4" : columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"
    }`}
  >
    {children}
  </div>
);
