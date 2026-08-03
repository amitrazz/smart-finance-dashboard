import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Money } from "../../types";
import { formatCurrency } from "../../utils/formatters";

interface MetricCardProps {
  title: string;
  value: Money | string;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: "indigo" | "emerald" | "amber" | "sky" | "rose" | "purple";
  delta?: { percent?: number; label?: string; isPositive?: boolean };
  progressPercent?: number;
  progressBarColor?: string;
  badge?: React.ReactNode;
  onClick?: () => void;
}

const ACCENT_CLASSES: Record<NonNullable<MetricCardProps["accentColor"]>, string> = {
  indigo: "border-indigo-500/20 bg-gradient-to-b from-indigo-500/5 via-slate-900/60 to-slate-900/80",
  emerald: "border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 via-slate-900/60 to-slate-900/80",
  amber: "border-amber-500/20 bg-gradient-to-b from-amber-500/5 via-slate-900/60 to-slate-900/80",
  sky: "border-sky-500/20 bg-gradient-to-b from-sky-500/5 via-slate-900/60 to-slate-900/80",
  rose: "border-rose-500/20 bg-gradient-to-b from-rose-500/5 via-slate-900/60 to-slate-900/80",
  purple: "border-purple-500/20 bg-gradient-to-b from-purple-500/5 via-slate-900/60 to-slate-900/80",
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accentColor = "indigo",
  delta,
  progressPercent,
  progressBarColor = "bg-emerald-500",
  badge,
  onClick,
}) => {
  const formattedVal = typeof value === "object" ? formatCurrency(value) : value;
  const isPositive = delta?.isPositive ?? (delta?.percent !== undefined ? delta.percent > 0 : undefined);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`p-5 rounded-3xl border backdrop-blur-xl transition-all duration-200 hover:border-slate-700 shadow-xl ${ACCENT_CLASSES[accentColor]} ${
        onClick ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-bold text-slate-400 tracking-wide uppercase truncate">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight truncate">
            {formattedVal}
          </h3>
        </div>
        {icon && (
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/50 text-slate-200 shadow-inner shrink-0">
            {icon}
          </div>
        )}
      </div>

      {typeof progressPercent === "number" && (
        <div className="mt-3 w-full h-1.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800/60">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressBarColor}`}
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      )}

      {(delta || subtitle || badge) && (
        <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between flex-wrap gap-2 text-xs">
          {delta && (delta.percent !== undefined || delta.label) && (
            <span
              className={`inline-flex items-center gap-1 font-bold ${
                isPositive === true ? "text-emerald-400" : isPositive === false ? "text-rose-400" : "text-slate-400"
              }`}
            >
              {isPositive === true && <TrendingUp className="w-3.5 h-3.5" />}
              {isPositive === false && <TrendingDown className="w-3.5 h-3.5" />}
              {isPositive === undefined && <Minus className="w-3.5 h-3.5" />}
              {delta.percent !== undefined && (
                <span>
                  {isPositive ? "+" : ""}
                  {delta.percent.toFixed(2)}%
                </span>
              )}
              {delta.label && <span className="text-slate-500 font-normal">{delta.label}</span>}
            </span>
          )}
          {subtitle && <p className="text-slate-400 font-medium ml-auto text-[11px] truncate">{subtitle}</p>}
          {badge}
        </div>
      )}
    </motion.div>
  );
};

export default MetricCard;
