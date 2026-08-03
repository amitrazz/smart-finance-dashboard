import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  delta?: string;
  isPositiveDelta?: boolean;
  icon: React.ReactNode;
  subtitle?: string;
  onClick?: () => void;
  badgeColor?: string;
  progressPercent?: number;
  progressBarColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  delta,
  isPositiveDelta = true,
  icon,
  subtitle,
  onClick,
  progressPercent,
  progressBarColor = "bg-emerald-500",
}) => {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`p-4 sm:p-5 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 shadow-lg transition-all duration-200 space-y-3 relative group ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      {/* Top Title & Icon Row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-400 font-sans truncate">{title}</span>
        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 shrink-0">
          {icon}
        </div>
      </div>

      {/* Value & Delta Row */}
      <div className="space-y-1">
        <div className="text-xl sm:text-2xl font-extrabold text-slate-100 font-sans tracking-tight truncate">
          {value}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {delta && (
            <span
              className={`inline-flex items-center gap-0.5 text-[11px] font-extrabold px-2 py-0.5 rounded-md border ${
                isPositiveDelta
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              }`}
            >
              {isPositiveDelta ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {delta}
            </span>
          )}

          {subtitle && <span className="text-[11px] text-slate-400 truncate">{subtitle}</span>}
        </div>
      </div>

      {/* Optional Progress Bar */}
      {typeof progressPercent === "number" && (
        <div className="space-y-1 pt-1">
          <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressBarColor}`}
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};
