import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Money } from "../types/investmentTypes";
import { formatCurrency } from "../../../utils/formatters";

interface GainLossBadgeProps {
  amount?: Money | string;
  percent?: number;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export const GainLossBadge: React.FC<GainLossBadgeProps> = ({
  amount,
  percent,
  showIcon = true,
  size = "md",
  label,
}) => {
  const numPercent = percent ?? 0;
  const isPositive = numPercent > 0;
  const isNegative = numPercent < 0;

  const colorClass = isPositive
    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : isNegative
      ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
      : "text-slate-400 bg-slate-800/40 border-slate-700/30";

  const sizeClass =
    size === "sm"
      ? "text-[11px] px-2 py-0.5"
      : size === "lg"
        ? "text-sm px-3 py-1.5 font-bold"
        : "text-xs px-2.5 py-1 font-semibold";

  const formattedAmountStr =
    typeof amount === "object"
      ? formatCurrency(amount)
      : typeof amount === "string"
        ? amount
        : null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${colorClass} ${sizeClass}`}
    >
      {showIcon && (
        <>
          {isPositive && <TrendingUp className="w-3.5 h-3.5 shrink-0" />}
          {isNegative && <TrendingDown className="w-3.5 h-3.5 shrink-0" />}
          {!isPositive && !isNegative && <Minus className="w-3.5 h-3.5 shrink-0" />}
        </>
      )}
      {label && <span className="opacity-80 font-normal">{label}:</span>}
      {formattedAmountStr && <span>{formattedAmountStr}</span>}
      {percent !== undefined && (
        <span>
          {isPositive ? "+" : ""}
          {numPercent.toFixed(2)}%
        </span>
      )}
    </span>
  );
};
