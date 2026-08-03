import React, { useState } from "react";
import { Search, Filter, RefreshCw, Download, ChevronDown, X } from "lucide-react";

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

const DEFAULT_FILTERS: PlanningFilters = { dateFrom: "", dateTo: "", status: "", currency: "", tags: "" };

export const PlanningGlobalToolbar: React.FC<PlanningGlobalToolbarProps> = ({ onSearch, onFilter, onExport, onRefresh }) => {
  const [localSearch, setLocalSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<PlanningFilters>(DEFAULT_FILTERS);

  const handleFilterChange = (key: keyof PlanningFilters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onFilter?.(next);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    onFilter?.(DEFAULT_FILTERS);
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              onSearch?.(e.target.value);
            }}
            placeholder="Search goals, budgets, categories…"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowFilters((p) => !p)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
              showFilters || activeFilterCount > 0
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-[11px] font-extrabold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
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
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
            title="Refresh Planning data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Currency</label>
              <select
                value={filters.currency}
                onChange={(e) => handleFilterChange("currency", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="">All Currencies</option>
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Tags</label>
              <input
                type="text"
                value={filters.tags}
                onChange={(e) => handleFilterChange("tags", e.target.value)}
                placeholder="e.g. priority, family"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PlanningGlobalToolbar;
