import React from "react";
import { Money as MoneyType } from "../../../../types";
import { MetricValue } from "../../components/common/MetricValue";

interface BreakdownItem {
  category: string;
  /** `null` renders "Not enough data" rather than a confident ₹0.00. */
  value: MoneyType | null;
  /** `null` renders the row without a bar rather than as a 0% share. */
  percentage: number | null;
}

/**
 * A composition breakdown as a labelled bar list rather than a pie.
 *
 * Bars beat a donut here because the reader's question is "how much is in X",
 * which a shared baseline answers directly and an angle does not. Each row
 * states its own share as text, so nothing depends on comparing wedge sizes.
 */
export const BreakdownList: React.FC<{
  title: string;
  items: BreakdownItem[];
  accent: string;
  emptyMessage?: string;
}> = ({ title, items, accent, emptyMessage = "Nothing recorded here." }) => (
  <div className="space-y-3">
    <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</h3>
    {items.length === 0 ? (
      <p className="text-xs text-slate-500">{emptyMessage}</p>
    ) : (
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.category} className="space-y-1">
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="truncate text-slate-300">{item.category}</span>
              <span className="shrink-0 tabular-nums text-slate-200">
                {/* Whole rupees, as everywhere else in the workspace: a column
                    of ".00" is three characters of noise per row. */}
                <MetricValue
                  value={item.value}
                  money
                  fractionDigits={0}
                  emptyClassName="text-slate-500"
                />
              </span>
            </div>
            {typeof item.percentage === "number" && (
              <div className="flex items-center gap-2">
                <div
                  className="h-1 flex-1 overflow-hidden rounded-full bg-slate-800"
                  role="presentation"
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(0, item.percentage))}%`,
                      backgroundColor: accent,
                    }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-slate-500">
                  {item.percentage.toFixed(0)}%
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    )}
  </div>
);
