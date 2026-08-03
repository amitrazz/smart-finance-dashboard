import React, { memo, useMemo } from "react";
import { Money as MoneyType } from "../../types";
import { formatCurrency } from "../../utils/formatters";
import { useUIStore } from "../../store/useUIStore";

/** Default mask string — fixed width dots, no digit count leakage */
const DEFAULT_MASK = "••••••••";

type MoneyValue = MoneyType | number | string | null | undefined;

interface MoneyProps {
  /** The monetary value to display */
  value?: MoneyValue;
  /** ISO currency code override (e.g. "USD"). Inferred from value when possible. */
  currency?: string;
  /** BCP 47 locale override (default "en-IN") */
  locale?: string;
  /** Additional className for the outer span */
  className?: string;
  /**
   * When true, prepends "+" for positive values and "-" for negative values.
   * The sign is always shown even in hidden mode (sign is not sensitive).
   */
  showSign?: boolean;
  /** Override the mask string shown when hidden (default "••••••••") */
  hideMask?: string;
}

/**
 * The canonical way to render any monetary value in the app.
 * Reads global privacy state from useUIStore and automatically
 * masks/reveals values. Never duplicate visibility logic elsewhere.
 */
export const Money: React.FC<MoneyProps> = memo(
  ({
    value,
    currency,
    locale = "en-IN",
    className = "",
    showSign = false,
    hideMask = DEFAULT_MASK,
  }) => {
    const moneyVisible = useUIStore((s) => s.moneyVisible);

    const { formatted, currencySymbol, isNegative } = useMemo(() => {
      // Resolve numeric value and currency code
      let numericVal = 0;
      let currCode = currency || "INR";

      if (value === null || value === undefined) {
        numericVal = 0;
      } else if (typeof value === "number") {
        numericVal = value;
      } else if (typeof value === "string") {
        numericVal = parseFloat(value) || 0;
      } else if (typeof value === "object" && "amount" in value) {
        numericVal = parseFloat(String(value.amount || "0"));
        currCode = value.currency || currCode;
      }

      const neg = numericVal < 0;

      // Currency symbol extraction (safe, fallback to ₹)
      let symbol = "₹";
      try {
        const parts = new Intl.NumberFormat(locale, {
          style: "currency",
          currency: currCode,
        }).formatToParts(0);
        const symPart = parts.find((p) => p.type === "currency");
        if (symPart) symbol = symPart.value;
      } catch {
        symbol = currCode === "INR" ? "₹" : currCode;
      }

      const full = formatCurrency(value ?? { amount: "0", currency: currCode }, locale);
      const sign = showSign ? (neg ? "-" : "+") : "";

      return {
        formatted: sign ? `${neg ? "" : "+"}${full}` : full,
        currencySymbol: symbol,
        isNegative: neg,
      };
    }, [value, currency, locale, showSign]);

    const maskedText = `${currencySymbol}${hideMask}`;
    const displayText = moneyVisible ? formatted : maskedText;
    const ariaLabel = moneyVisible ? formatted : "Hidden financial value";

    return (
      <span
        className={`money-value inline-block ${className}`}
        aria-label={ariaLabel}
        role="text"
        data-money-visible={moneyVisible}
        data-negative={isNegative}
      >
        {displayText}
      </span>
    );
  }
);

Money.displayName = "Money";
