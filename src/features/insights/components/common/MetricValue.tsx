import React from "react";
import { Money as MoneyType } from "../../../../types";
import { Money } from "../../../../components/common/Money";
import { NO_DATA_LABEL } from "../../utils/insightsFormat";

interface MetricValueProps {
  /** `null`/`undefined` renders the no-data label — never a zero. */
  value: MoneyType | number | string | null | undefined;
  /** Formats `value` as currency through the shared `<Money>` component. */
  money?: boolean;
  /** Suffix for non-money values, e.g. `%`, ` / 100`. */
  suffix?: string;
  /** Decimal places for numeric values. */
  precision?: number;
  className?: string;
  /** Class applied only to the no-data label, which should read quieter. */
  emptyClassName?: string;
}

/**
 * Renders one figure, or says plainly that there isn't one.
 *
 * This exists because the failure mode it prevents is invisible in review: a
 * component reads `analytics.savingsRatePercent`, gets `0` from a mapper that
 * defaulted a missing field, and renders "0%" — indistinguishable from a real
 * zero savings rate, and far more alarming. Every figure in this workspace goes
 * through here so absence renders as absence.
 *
 * Monetary values delegate to the app's `<Money>` component rather than
 * formatting inline, which keeps them inside privacy mode. The old Insights
 * pages called `formatCurrency()` directly, so toggling "hide amounts" masked
 * the rest of the app and left every figure in this workspace exposed.
 */
export const MetricValue: React.FC<MetricValueProps> = ({
  value,
  money = false,
  suffix = "",
  precision = 1,
  className = "",
  emptyClassName = "",
}) => {
  if (value === null || value === undefined || value === "") {
    return (
      <span className={`text-slate-500 font-medium ${emptyClassName || className}`}>
        {NO_DATA_LABEL}
      </span>
    );
  }

  if (money) {
    return <Money value={value as MoneyType | number | string} className={className} />;
  }

  const text =
    typeof value === "number"
      ? value.toLocaleString("en-IN", {
          minimumFractionDigits: precision,
          maximumFractionDigits: precision,
        })
      : String(value);

  return (
    <span className={className}>
      {text}
      {suffix}
    </span>
  );
};
