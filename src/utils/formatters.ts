import { Money } from "../types";

export function formatCurrency(money?: Money | { amount: string | number; currency?: string } | number | null, locale = "en-IN"): string {
  if (money === undefined || money === null) return "₹0.00";
  
  let val = 0;
  let curr = "INR";

  if (typeof money === "number") {
    val = money;
  } else if (typeof money === "object") {
    val = parseFloat(String(money.amount || "0"));
    curr = money.currency || "INR";
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: curr,
    maximumFractionDigits: 2,
  }).format(val);
}

export function formatPercent(value: number, decimals = 1): string {
  const formatted = value.toFixed(decimals);
  return `${value >= 0 ? "+" : ""}${formatted}%`;
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
