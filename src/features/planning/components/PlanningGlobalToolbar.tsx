import React from "react";
import { Search, Filter, RefreshCw, Download } from "lucide-react";

export interface PlanningFilters {
  dateFrom: string;
  dateTo: string;
  status: string;
  currency: string;
  tags: string;
}

interface PlanningGlobalToolbarProps {
  onSearch?: (query: string) => void;
  onFilter?: (filters: PlanningFilters) => void;
  onExport?: () => void;
  onRefresh?: () => void;
}

/**
 * Search and the date/status/currency/tag filter panel don't feed into any of
 * the planning sub-views yet (only Export/Refresh are actually wired up by
 * PlanningView), so both are shown disabled rather than silently accepting
 * input that changes nothing on screen.
 */
export const PlanningGlobalToolbar: React.FC<PlanningGlobalToolbarProps> = ({ onExport, onRefresh }) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            disabled
            title="Search isn't available yet"
            placeholder="Search goals, budgets, categories… (coming soon)"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-sm text-slate-500 placeholder-slate-600 cursor-not-allowed"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            disabled
            title="Filtering isn't available yet"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed opacity-60"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>

          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm font-semibold text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={onRefresh}
            aria-label="Refresh Planning data"
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
            title="Refresh Planning data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanningGlobalToolbar;
