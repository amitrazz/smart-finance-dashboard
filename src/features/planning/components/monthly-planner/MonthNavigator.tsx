import React from "react";
import { ChevronLeft, ChevronRight, RefreshCw, CalendarClock } from "lucide-react";
import { formatMonthLabel, getCurrentYearMonth, shiftMonth } from "./monthlyPlanner.utils";

interface MonthNavigatorProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const MonthNavigator: React.FC<MonthNavigatorProps> = ({
  year,
  month,
  onChange,
  onRefresh,
  isRefreshing,
}) => {
  const current = getCurrentYearMonth();
  const isCurrentMonth = year === current.year && month === current.month;

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [y, m] = e.target.value.split("-").map(Number);
    if (y && m) onChange(y, m);
  };

  const inputValue = `${year}-${String(month).padStart(2, "0")}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-1">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => {
            const prev = shiftMonth(year, month, -1);
            onChange(prev.year, prev.month);
          }}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="relative px-2 flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-slate-500" aria-hidden="true" />
          <span className="text-sm font-bold text-slate-100 whitespace-nowrap min-w-[9rem] text-center">
            {formatMonthLabel(year, month)}
          </span>
          <input
            type="month"
            aria-label="Select month"
            value={inputValue}
            onChange={handlePickerChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>

        <button
          type="button"
          aria-label="Next month"
          onClick={() => {
            const next = shiftMonth(year, month, 1);
            onChange(next.year, next.month);
          }}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {!isCurrentMonth && (
        <button
          type="button"
          onClick={() => onChange(current.year, current.month)}
          className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all"
        >
          Current Month
        </button>
      )}

      <button
        type="button"
        onClick={onRefresh}
        aria-label="Refresh monthly plan"
        title="Refresh monthly plan"
        className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
      >
        <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden="true" />
      </button>
    </div>
  );
};

export default MonthNavigator;
