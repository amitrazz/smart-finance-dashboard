import React from "react";
import { ChevronRight, Home, Command } from "lucide-react";
import { useUIStore } from "../../../store/useUIStore";

interface InsightsBreadcrumbsProps {
  sectionLabel: string;
  subTabLabel?: string;
  onSearchClick?: () => void;
}

export const InsightsBreadcrumbs: React.FC<InsightsBreadcrumbsProps> = ({
  sectionLabel,
  subTabLabel,
  onSearchClick,
}) => {
  const { setActiveSubTab } = useUIStore();

  return (
    <div className="flex items-center justify-between py-2 text-xs font-semibold text-slate-400 border-b border-slate-800/40">
      {/* Trail */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => setActiveSubTab("overview")}
          className="flex items-center gap-1 hover:text-slate-200 transition-colors"
        >
          <Home className="w-3.5 h-3.5 text-indigo-400" />
          <span>Insights</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

        <span className="text-slate-200 font-bold">{sectionLabel}</span>

        {subTabLabel && subTabLabel !== sectionLabel && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-indigo-400 font-bold">{subTabLabel}</span>
          </>
        )}
      </div>

      {/* Cmd + K Search Badge Trigger */}
      {onSearchClick && (
        <button
          onClick={onSearchClick}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-400 hover:text-slate-200 transition-all"
        >
          <Command className="w-3 h-3 text-indigo-400" />
          <span>Search Analytics</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">⌘K</kbd>
        </button>
      )}
    </div>
  );
};
