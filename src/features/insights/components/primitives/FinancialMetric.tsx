import React from "react";
import { Money as MoneyType } from "../../../../types";
import { MetricValue } from "../common/MetricValue";
import { ChangeIndicator, ChangeIndicatorProps } from "./ChangeIndicator";
import { Tone, TONE_TEXT } from "./tone";

type MetricSize = "sm" | "md" | "lg";

export interface FinancialMetricProps {
  label: string;
  value: MoneyType | number | string | null | undefined;
  money?: boolean;
  suffix?: string;
  precision?: number;
  /** Movement against a prior period. Omitted entirely when there is nothing to compare. */
  change?: Omit<ChangeIndicatorProps, "size" | "className"> | null;
  /** Context under the value: a target, a window, a qualifier. */
  caption?: string | null;
  /** Colours the value itself. Reserved for figures that are inherently good or bad — a negative net cash flow, an exceeded budget. */
  tone?: Tone;
  size?: MetricSize;
  /** Marks the figure as a projection rather than a measurement. */
  badge?: React.ReactNode;
  className?: string;
}

/**
 * One financial figure.
 *
 * Replaces the old `AnalyticsKpi`, and the differences are the point of the
 * redesign rather than a restyle:
 *
 * - **No icon tile.** A 48px gradient square holding a wallet glyph carried no
 *   information and took a quarter of the card's width from the number.
 * - **No accent gradient, no card.** A metric is type on a surface. Grouping
 *   comes from the row it sits in; six independently-bordered tiles in a row
 *   read as six unrelated facts.
 * - **No clipping.** The value wraps and steps down through breakpoints. A
 *   truncated amount does not look wrong, it looks like a *different amount*.
 * - **Whole rupees.** Paise are three characters of noise on a headline figure
 *   and are always available in the underlying list.
 *
 * Absence still routes through `<MetricValue>`, so a figure the backend didn't
 * produce reads as "Not enough data" and never as zero.
 */
const VALUE_SIZE: Record<MetricSize, string> = {
  sm: "text-lg",
  md: "text-xl xl:text-2xl",
  lg: "text-2xl sm:text-3xl",
};

export const FinancialMetric: React.FC<FinancialMetricProps> = ({
  label,
  value,
  money = false,
  suffix,
  precision,
  change,
  caption,
  tone,
  size = "md",
  badge,
  className = "",
}) => (
  <div className={`min-w-0 space-y-1 ${className}`}>
    <div className="flex items-center gap-2">
      <p className="truncate text-[11px] font-medium tracking-wide text-slate-500">{label}</p>
      {badge}
    </div>

    <p
      className={`font-semibold leading-tight tracking-tight tabular-nums [overflow-wrap:anywhere] ${
        VALUE_SIZE[size]
      } ${tone ? TONE_TEXT[tone] : "text-slate-100"}`}
    >
      <MetricValue
        value={value}
        money={money}
        suffix={suffix}
        precision={precision}
        fractionDigits={money ? 0 : undefined}
        emptyClassName="text-sm font-medium text-slate-500"
      />
    </p>

    {change && <ChangeIndicator {...change} />}
    {caption && <p className="truncate text-[11px] text-slate-500">{caption}</p>}
  </div>
);

/**
 * A row of metrics reading as one group.
 *
 * Grouping is done with space, not with six borders. Vertical rules were tried
 * and dropped: in a wrapping grid they land on the first item of the second row
 * as well, which draws a line exactly where there is no boundary.
 *
 * Two columns on phones, so a four-metric row is one screen rather than four.
 */
export const MetricRow: React.FC<{
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}> = ({ children, columns = 4, className = "" }) => (
  <div
    className={`grid grid-cols-2 gap-x-6 gap-y-6 ${
      columns === 4 ? "lg:grid-cols-4" : columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
    } ${className}`}
  >
    {children}
  </div>
);
