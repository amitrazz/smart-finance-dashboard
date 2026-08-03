import React from "react";
import { ChevronRight, Home, Command } from "lucide-react";
import { useUIStore } from "../../../store/useUIStore";

interface InvestmentsBreadcrumbProps {
  categoryLabel: string;
  subTabLabel?: string;
  onSearchClick: () => void;
}

export const InvestmentsBreadcrumb: React.FC<InvestmentsBreadcrumbProps> = ({
  categoryLabel,
  subTabLabel,
  onSearchClick,
}) => {
  const { setActiveSubTab } = useUIStore();

  return (
    <div className="flex items-center justify-between py-2 text-xs font-semibold text-slate-400 border-b border-slate-800/40">
      {/* Trail */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => setActiveSubTab("dashboard")}
          className="flex items-center gap-1 hover:text-slate-200 transition-colors"
        >
          <Home className="w-3.5 h-3.5 text-indigo-400" />
          <span>Investments</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

        <span className="text-slate-200 font-bold">{categoryLabel}</span>

        {subTabLabel && subTabLabel !== categoryLabel && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-indigo-400 font-bold">{subTabLabel}</span>
          </>
        )}
      </div>

      {/* Cmd + K Search Badge Trigger */}
      <button
        onClick={onSearchClick}
        className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-400 hover:text-slate-200 transition-all"
      >
        <Command className="w-3 h-3 text-indigo-400" />
        <span>Quick Search</span>
        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">⌘K</kbd>
      </button>
    </div>
  );
};
