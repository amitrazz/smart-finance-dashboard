import React from "react";

interface BalanceCardProps {
  title: string;
  amount: string;
  currency?: string;
  subtitle?: string;
  trend?: { value: number; isPositive: boolean };
  icon: React.ReactNode;
  gradient?: string;
  onClick?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  title,
  amount,
  currency = "INR",
  subtitle,
  trend,
  icon,
  gradient = "from-emerald-500/20 via-teal-500/10 to-indigo-500/20",
  onClick,
  actionLabel,
  onAction,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative group overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800 p-6 backdrop-blur-xl transition-all duration-300 hover:border-slate-700/80 hover:shadow-2xl hover:shadow-emerald-500/10 ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      {/* Background Subtle Gradient Glow */}
      <div
        className={`absolute -top-12 -right-12 w-44 h-44 rounded-full bg-gradient-to-br ${gradient} blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-300`}
      />

      <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-800/80 text-emerald-400 border border-slate-700/50 shadow-inner group-hover:scale-105 transition-transform duration-200">
              {icon}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
              {subtitle && <p className="text-[11px] text-slate-500 font-medium">{subtitle}</p>}
            </div>
          </div>

          {trend && (
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                trend.isPositive
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/30"
              }`}
            >
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
          )}
        </div>

        <div className="pt-2">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-slate-400">{currency}</span>
            {amount}
          </h3>
        </div>

        {actionLabel && onAction && (
          <div className="pt-2 border-t border-slate-800/60 flex justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAction();
              }}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
            >
              {actionLabel} &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
