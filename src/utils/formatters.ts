import { Money } from "../types";

type MoneyLike = Money | { amount: string | number; currency?: string };

/**
 * `fractionDigits` fixes both the minimum and the maximum, so passing `0`
 * renders whole rupees (₹2,68,315) rather than Intl's currency default of two.
 * Headline figures in narrow cards use it: paise are three characters that push
 * a lakh-scale amount past the width it has, and the exact figure is always one
 * click away in the underlying list.
 */
export function formatCurrency(
  money?: MoneyLike | number | string | null,
  locale = "en-IN",
  fractionDigits?: number
): string {
  if (money === undefined || money === null) {
    return fractionDigits === undefined ? "₹0.00" : `₹${(0).toFixed(fractionDigits)}`;
  }

  let val = 0;
  let curr = "INR";

  if (typeof money === "number") {
    val = money;
  } else if (typeof money === "string") {
    val = parseFloat(money) || 0;
  } else if (typeof money === "object" && "amount" in money) {
    val = parseFloat(String(money.amount || "0"));
    curr = money.currency || "INR";
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: curr,
    ...(fractionDigits === undefined
      ? { maximumFractionDigits: 2 }
      : { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }),
  }).format(val);
}

/**
 * Returns the masked representation of a currency value.
 * Used by chart formatters and non-React contexts that need
 * to respect privacy mode without consuming hooks.
 */
export function maskCurrency(currency = "INR"): string {
  const symbol = currency === "INR" ? "₹" : currency;
  return `${symbol}••••••••`;
}

/**
 * Convenience helper for Recharts formatter callbacks:
 * returns the masked string when moneyVisible is false,
 * or the formatted value when visible.
 *
 * Usage in chart: formatter={(val) => getMaskedOrFormatted(val, moneyVisible, currency)}
 */
export function getMaskedOrFormatted(
  val: unknown,
  moneyVisible: boolean,
  currency = "INR"
): string {
  if (!moneyVisible) return maskCurrency(currency);
  if (val === null || val === undefined) return "₹0.00";
  return formatCurrency({ amount: String(val), currency });
}

export function formatPercent(
  value?: number | string | null,
  decimals = 1
): string {
  if (value === undefined || value === null) return "0%";
  const num = typeof value === "number" ? value : parseFloat(String(value)) || 0;
  if (isNaN(num)) return "0%";
  const formatted = num.toFixed(decimals);
  return `${num >= 0 ? "+" : ""}${formatted}%`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return "";
  const d = new Date(dateString);
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatRelativeTime(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));

  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  return formatDate(dateString);
}

export function formatLastSyncedAt(dateString?: string | null): string {
  if (!dateString) return "recently";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "recently";

  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  if (diffInMs < 0) {
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const diffInSecs = Math.floor(diffInMs / 1000);
  const diffInMins = Math.floor(diffInSecs / 60);

  if (diffInSecs < 60) {
    return "just now";
  }

  if (diffInMins < 60) {
    return `${diffInMins} min${diffInMins === 1 ? "" : "s"} ago`;
  }

  const isToday =
    now.getDate() === date.getDate() &&
    now.getMonth() === date.getMonth() &&
    now.getFullYear() === date.getFullYear();

  const timeStr = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) {
    return `Today at ${timeStr}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    yesterday.getDate() === date.getDate() &&
    yesterday.getMonth() === date.getMonth() &&
    yesterday.getFullYear() === date.getFullYear();

  if (isYesterday) {
    return `Yesterday at ${timeStr}`;
  }

  const isSameYear = now.getFullYear() === date.getFullYear();
  const dateStr = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(isSameYear ? {} : { year: "numeric" }),
  });

  return `${dateStr} at ${timeStr}`;
}
