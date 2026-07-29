import React from "react";
import { useUIStore } from "../../store/useUIStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useFinancialHealth } from "../../hooks/useFinanceQueries";
import { Search, Plus, UploadCloud, Sun, Moon, ShieldCheck } from "lucide-react";

export const Navbar: React.FC = () => {
  const { toggleSearch, setAddTransactionOpen, setImportModalOpen } = useUIStore();
  const { theme, toggleTheme } = useSettingsStore();
  const { data: health } = useFinancialHealth();

  return (
    <header className="h-16 bg-slate-900/60 border-b border-slate-800 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search Bar Trigger */}
      <button
        onClick={toggleSearch}
        className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all text-sm w-72"
      >
        <Search className="w-4 h-4 text-slate-400" />
        <span className="flex-1 text-left">Search anything...</span>
        <kbd className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-300 border border-slate-600/50">
          ⌘K
        </kbd>
      </button>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Health Score Pill */}
        {health && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Health Score: {health.overallScore}/100</span>
          </div>
        )}

        {/* Action Buttons */}
        <button
          onClick={() => setAddTransactionOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-all shadow-md shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Transaction</span>
        </button>

        <button
          onClick={() => setImportModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700/60 transition-all"
        >
          <UploadCloud className="w-4 h-4 text-teal-400" />
          <span className="hidden sm:inline">Import Statement</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Toggle Dark/Light Mode"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>
      </div>
    </header>
  );
};
