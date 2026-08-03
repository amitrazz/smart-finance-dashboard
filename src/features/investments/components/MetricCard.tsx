import React from "react";
import { Money } from "../../../types";
import { formatCurrency } from "../../../utils/formatters";
import { GainLossBadge } from "./GainLossBadge";

interface MetricCardProps {
  title: string;
  value: Money | string;
  subtitle?: string;
  gainLossAmount?: Money;
  gainLossPercent?: number;
  icon?: React.ReactNode;
  accentColor?: "emerald" | "indigo" | "amber" | "sky" | "rose" | "purple";
  badge?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  gainLossAmount,
  gainLossPercent,
  icon,
  accentColor = "indigo",
  badge,
}) => {
  const formattedVal = typeof value === "object" ? formatCurrency(value) : value;

  const accentClasses = {
    indigo: "border-indigo-500/20 bg-gradient-to-b from-indigo-500/5 via-slate-900/60 to-slate-900/80",
    emerald: "border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 via-slate-900/60 to-slate-900/80",
    amber: "border-amber-500/20 bg-gradient-to-b from-amber-500/5 via-slate-900/60 to-slate-900/80",
    sky: "border-sky-500/20 bg-gradient-to-b from-sky-500/5 via-slate-900/60 to-slate-900/80",
    rose: "border-rose-500/20 bg-gradient-to-b from-rose-500/5 via-slate-900/60 to-slate-900/80",
    purple: "border-purple-500/20 bg-gradient-to-b from-purple-500/5 via-slate-900/60 to-slate-900/80",
  };

  return (
    <div className={`p-6 rounded-3xl border backdrop-blur-xl transition-all duration-200 hover:border-slate-700 shadow-xl ${accentClasses[accentColor]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight leading-none pt-1">
            {formattedVal}
          </h3>
        </div>
        {icon && (
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/50 text-slate-200 shadow-inner">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between flex-wrap gap-2">
        {(gainLossAmount || gainLossPercent !== undefined) && (
          <GainLossBadge amount={gainLossAmount} percent={gainLossPercent} size="sm" />
        )}
        {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
        {badge}
      </div>
    </div>
  );
};
