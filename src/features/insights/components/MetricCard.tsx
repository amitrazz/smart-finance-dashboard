import React from "react";
import { Money } from "../types/insightsTypes";
import { formatCurrency } from "../../../utils/formatters";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: Money | string;
  subtitle?: string;
  deltaPercent?: number;
  deltaLabel?: string;
  icon?: React.ReactNode;
  accentColor?: "indigo" | "emerald" | "amber" | "sky" | "rose" | "purple";
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  deltaPercent,
  deltaLabel,
  icon,
  accentColor = "indigo",
}) => {
  const formattedVal = typeof value === "object" ? formatCurrency(value) : value;
  const isPositive = (deltaPercent ?? 0) > 0;
  const isNegative = (deltaPercent ?? 0) < 0;

  const accentClasses = {
    indigo: "border-indigo-500/20 bg-gradient-to-b from-indigo-500/5 via-slate-900/60 to-slate-900/80",
    emerald: "border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 via-slate-900/60 to-slate-900/80",
    amber: "border-amber-500/20 bg-gradient-to-b from-amber-500/5 via-slate-900/60 to-slate-900/80",
    sky: "border-sky-500/20 bg-gradient-to-b from-sky-500/5 via-slate-900/60 to-slate-900/80",
    rose: "border-rose-500/20 bg-gradient-to-b from-rose-500/5 via-slate-900/60 to-slate-900/80",
    purple: "border-purple-500/20 bg-gradient-to-b from-purple-500/5 via-slate-900/60 to-slate-900/80",
  };

  return (
    <div className={`p-5 rounded-3xl border backdrop-blur-xl transition-all duration-200 hover:border-slate-700 shadow-xl ${accentClasses[accentColor]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-slate-400 tracking-wide uppercase">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight font-mono">
            {formattedVal}
          </h3>
        </div>
        {icon && (
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/50 text-slate-200 shadow-inner">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2 text-xs">
        {deltaPercent !== undefined && (
          <span
            className={`inline-flex items-center gap-1 font-bold ${
              isPositive ? "text-emerald-400" : isNegative ? "text-rose-400" : "text-slate-400"
            }`}
          >
            {isPositive && <TrendingUp className="w-3.5 h-3.5" />}
            {isNegative && <TrendingDown className="w-3.5 h-3.5" />}
            {!isPositive && !isNegative && <Minus className="w-3.5 h-3.5" />}
            <span>
              {isPositive ? "+" : ""}
              {deltaPercent.toFixed(2)}%
            </span>
            {deltaLabel && <span className="text-slate-500 font-normal">{deltaLabel}</span>}
          </span>
        )}
        {subtitle && <p className="text-slate-400 font-medium ml-auto text-[11px]">{subtitle}</p>}
      </div>
    </div>
  );
};
