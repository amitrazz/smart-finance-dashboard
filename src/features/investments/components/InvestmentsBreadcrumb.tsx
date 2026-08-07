import React from "react";
import { ChevronRight, Home } from "lucide-react";
import { useUIStore } from "../../../store/useUIStore";

interface InvestmentsBreadcrumbProps {
  categoryLabel: string;
  subTabLabel?: string;
}

export const InvestmentsBreadcrumb: React.FC<InvestmentsBreadcrumbProps> = ({ categoryLabel, subTabLabel }) => {
  const { setActiveSubTab } = useUIStore();

  return (
    <div className="flex items-center py-2 text-xs font-semibold text-slate-400 border-b border-slate-800/40">
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => setActiveSubTab("dashboard")}
          className="flex items-center gap-1 hover:text-slate-200 transition-colors"
        >
          <Home className="w-3.5 h-3.5 text-emerald-400" />
          <span>Investments</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

        <span className="text-slate-200 font-bold">{categoryLabel}</span>

        {subTabLabel && subTabLabel !== categoryLabel && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-emerald-400 font-bold">{subTabLabel}</span>
          </>
        )}
      </div>
    </div>
  );
};
