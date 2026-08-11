import React from "react";
import { ResponsiveContainer } from "recharts";
import { useUIStore } from "../../../../store/useUIStore";
import { getMaskedOrFormatted } from "../../../../utils/formatters";

interface ChartFrameProps {
  /**
   * Sentence describing what the chart shows and its headline movement. Read by
   * screen readers in place of the SVG, which is `aria-hidden`. A chart with no
   * text equivalent is invisible to a third of the accessibility criteria.
   */
  description: string;
  height?: number;
  children: React.ReactElement;
  /** Rendered under the plot: series names and what each one means. */
  legend?: React.ReactNode;
}

/**
 * Shared container for every Insights chart.
 *
 * Owns three things that were previously re-implemented (and re-broken) per
 * chart: a fixed pixel height so `ResponsiveContainer` has something to fill, an
 * `overflow-hidden` box so a wide plot scrolls inside itself instead of
 * widening the page, and the text alternative.
 */
export const ChartFrame: React.FC<ChartFrameProps> = ({
  description,
  height = 240,
  children,
  legend,
}) => (
  <figure className="min-w-0 space-y-2">
    <div className="min-w-0 overflow-hidden" style={{ height }} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
    <figcaption className="sr-only">{description}</figcaption>
    {legend && <div className="flex flex-wrap items-center gap-x-4 gap-y-1">{legend}</div>}
  </figure>
);

export const ChartLegendItem: React.FC<{
  color: string;
  label: string;
  dashed?: boolean;
}> = ({ color, label, dashed = false }) => (
  <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
    <span
      className="h-0.5 w-4 rounded-full"
      style={{
        backgroundColor: dashed ? "transparent" : color,
        backgroundImage: dashed
          ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 8px)`
          : undefined,
      }}
      aria-hidden="true"
    />
    {label}
  </span>
);

interface TooltipRow {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

/**
 * Tooltip that respects privacy mode.
 *
 * Recharts' default tooltip prints raw numbers, so every Insights chart leaked
 * exact balances while the rest of the app was masked. This routes through the
 * same masking helper the `<Money>` component uses.
 */
export const MoneyTooltip: React.FC<{
  active?: boolean;
  payload?: TooltipRow[];
  label?: string | number;
  currency?: string;
  labelFormatter?: (label: string) => string;
}> = ({ active, payload, label, currency = "INR", labelFormatter }) => {
  const moneyVisible = useUIStore((s) => s.moneyVisible);
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/95 px-3 py-2 shadow-xl">
      <p className="mb-1 text-[11px] font-medium text-slate-400">
        {labelFormatter && typeof label === "string" ? labelFormatter(label) : label}
      </p>
      <div className="space-y-0.5">
        {payload.map((row, i) => (
          <p key={i} className="flex items-center justify-between gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: row.color }}
                aria-hidden="true"
              />
              {row.name}
            </span>
            <span className="font-medium tabular-nums text-slate-100">
              {getMaskedOrFormatted(row.value, moneyVisible, currency)}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
};
