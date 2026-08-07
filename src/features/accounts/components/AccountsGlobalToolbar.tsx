import React from "react";

import { Search, Filter, RefreshCw, Download, ChevronDown } from "lucide-react";

interface AccountsGlobalToolbarProps {
  onSearch?: (query: string) => void;
  onFilter?: (filters: Record<string, string>) => void;
  onExport?: () => void;
  onRefresh?: () => void;
  searchQuery?: string;
}

/**
 * Search and the type/currency/status filter panel don't feed into any of the
 * account sub-views yet (only Export/Refresh are actually wired up by callers),
 * so both are shown disabled rather than silently accepting input that changes
 * nothing on screen.
 */
export const AccountsGlobalToolbar: React.FC<AccountsGlobalToolbarProps> = ({
  onExport,
  onRefresh,
  searchQuery = "",
}) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search — disabled: not wired to any account sub-view yet */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            disabled
            title="Account search isn't available yet"
            placeholder="Search accounts, institutions, currencies… (coming soon)"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-sm text-slate-500 placeholder-slate-600 cursor-not-allowed"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Filter Toggle — disabled: not wired to any account sub-view yet */}
          <button
            disabled
            title="Account filtering isn't available yet"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed opacity-60"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Export */}
          <button
            onClick={onExport}
            disabled={!onExport}
            title={onExport ? "Export" : "Export isn't available yet — no backend endpoint exists"}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
              onExport
                ? "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                : "bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed opacity-60"
            }`}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
            title="Refresh all accounts"
            aria-label="Refresh all accounts"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
