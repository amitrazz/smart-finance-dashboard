import React from "react";
import { Money as MoneyType } from "../../../../types";
import { Direction } from "../../utils/insightsFormat";
import { FinancialMetric, MetricRow } from "../primitives/FinancialMetric";

export interface AnalyticsKpiProps {
  label: string;
  value: MoneyType | number | string | null | undefined;
  money?: boolean;
  suffix?: string;
  precision?: number;
  caption?: string | null;
  /** Pre-formatted change string, e.g. `+2.1 pts`. */
  delta?: string | null;
  direction?: Direction;
  upIsGood?: boolean;
  /**
   * Accepted and ignored. See below — icons and accent gradients were removed
   * from metrics, and the prop is kept so the nine analytics domains didn't all
   * have to change on the same commit.
   */
  icon?: React.ReactNode;
  accent?: string;
  badge?: React.ReactNode;
}

/**
 * One analytics figure — now an adapter over `FinancialMetric`.
 *
 * The visual changes are the redesign, not a restyle, and they apply to every
 * analytics domain at once:
 *
 * - **The icon tile is gone.** A 48px gradient square holding a wallet glyph
 *   carried no information and took roughly a quarter of the card's width away
 *   from the number — which is why lakh-scale amounts were being clipped
 *   mid-digit at laptop widths.
 * - **The accent gradient and the card are gone.** Six independently-bordered,
 *   differently-tinted tiles in a row read as six unrelated facts; grouping now
 *   comes from the row itself.
 * - **`accent` no longer colours anything.** Colour means financial direction
 *   here, and a purple tile for "savings rate" was spending the one signal the
 *   eye trusts on decoration.
 *
 * `delta` arrives pre-formatted from the call sites, so it is rendered as a
 * caption rather than through `ChangeIndicator`, which needs the raw numbers to
 * resolve polarity. Domains that want a tone-resolved movement should use
 * `FinancialMetric`'s `change` prop directly.
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
  badge,
}) => {
  const isGood = direction === "flat" ? null : (direction === "up") === upIsGood;
  const deltaTone =
    isGood === null ? "text-slate-400" : isGood ? "text-emerald-400" : "text-rose-400";

  return (
    <div className="min-w-0 space-y-1">
      <FinancialMetric
        label={label}
        value={value}
        money={money}
        suffix={suffix}
        precision={precision}
        caption={caption}
        badge={badge}
      />
      {delta && (
        <p className={`text-xs font-medium tabular-nums ${deltaTone}`}>
          {direction === "up" ? "↑ " : direction === "down" ? "↓ " : ""}
          {delta}
        </p>
      )}
    </div>
  );
};

export const AnalyticsKpiRow: React.FC<{ children: React.ReactNode; columns?: 2 | 3 | 4 }> = ({
  children,
  columns = 4,
}) => <MetricRow columns={columns}>{children}</MetricRow>;
