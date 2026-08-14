import React from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { Money as MoneyType } from "../../../../types";
import { Money } from "../../../../components/common/Money";
import { TONE_TEXT, directionalTone } from "./tone";
import { formatPercentDelta, formatPoints } from "../../utils/insightsFormat";

export interface ChangeIndicatorProps {
  /** Money movement, rendered with an explicit sign. */
  amount?: MoneyType | null;
  /** Percentage movement. */
  percent?: number | null;
  /** Percentage-*point* movement, for figures that are themselves rates. */
  points?: number | null;
  /** Whether an increase is a good outcome for this measure. Required: there is no safe default. */
  upIsGood: boolean;
  /** What the movement is measured against, e.g. "vs previous period". */
  caption?: string | null;
  size?: "sm" | "md";
  className?: string;
}

/**
 * A movement, with its financial polarity resolved.
 *
 * The arrow shows *direction*; the colour shows *whether that direction is good
 * here*. They disagree constantly and that is the point — debt falling is a
 * down arrow in emerald, income falling is a down arrow in rose. A component
 * that colours by direction alone congratulates the user on losing income.
 *
 * Renders nothing at all when there is no movement to report, so callers can
 * drop it in unconditionally and a metric with no prior period simply shows no
 * comparison line rather than "0%" or "—".
 */
export const ChangeIndicator: React.FC<ChangeIndicatorProps> = ({
  amount,
  percent,
  points,
  upIsGood,
  caption,
  size = "sm",
  className = "",
}) => {
  const magnitude =
    points !== null && points !== undefined
      ? points
      : percent !== null && percent !== undefined
        ? percent
        : amount
          ? Number(amount.amount)
          : null;

  if (magnitude === null || Number.isNaN(magnitude)) return null;

  const tone = directionalTone(magnitude, upIsGood);
  const Icon = magnitude === 0 ? ArrowRight : magnitude > 0 ? ArrowUpRight : ArrowDownRight;
  const text = size === "sm" ? "text-xs" : "text-sm";

  // Percent is shown beside a money movement, not instead of it: "+₹24,680"
  // answers "how much", "+12.4%" answers "how much relative to what". Either
  // alone leaves a question open.
  const secondary =
    amount && percent !== null && percent !== undefined ? formatPercentDelta(percent) : null;

  return (
    <span
      className={`inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 tabular-nums ${text} ${className}`}
    >
      <span className={`inline-flex items-center gap-1 font-medium ${TONE_TEXT[tone]}`}>
        <Icon className="h-3.5 w-3.5 shrink-0 self-center" aria-hidden="true" />
        {amount ? (
          <Money value={amount} showSign fractionDigits={0} />
        ) : points !== null && points !== undefined ? (
          formatPoints(points)
        ) : (
          formatPercentDelta(percent)
        )}
      </span>
      {secondary && <span className="text-slate-500">{secondary}</span>}
      {caption && <span className="text-slate-600">{caption}</span>}
    </span>
  );
};
