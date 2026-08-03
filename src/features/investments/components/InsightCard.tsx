import React from "react";
import { InvestmentInsight } from "../types/investmentTypes";
import { AlertTriangle, Info, CheckCircle2, ArrowRight } from "lucide-react";
import { useUIStore } from "../../../store/useUIStore";

interface InsightCardProps {
  insight: InvestmentInsight;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const { setActiveSubTab } = useUIStore();

  const severityConfig = {
    CRITICAL: {
      border: "border-rose-500/30 bg-rose-500/5 text-rose-300",
      badge: "bg-rose-500/20 text-rose-400 border-rose-500/30",
      icon: <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />,
    },
    WARNING: {
      border: "border-amber-500/30 bg-amber-500/5 text-amber-300",
      badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    },
    INFO: {
      border: "border-sky-500/30 bg-sky-500/5 text-sky-300",
      badge: "bg-sky-500/20 text-sky-400 border-sky-500/30",
      icon: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
    },
    SUCCESS: {
      border: "border-emerald-500/30 bg-emerald-500/5 text-emerald-300",
      badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    },
  };

  const currentConfig = severityConfig[insight.severity] || severityConfig.INFO;

  const handleActionClick = () => {
    if (insight.actionRoute) {
      const sub = insight.actionRoute.replace("#investments/", "");
      setActiveSubTab(sub);
    }
  };

  return (
    <div className={`p-4 rounded-2xl border ${currentConfig.border} flex flex-col justify-between space-y-3 transition-all hover:scale-[1.01]`}>
      <div className="flex items-start gap-3">
        {currentConfig.icon}
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentConfig.badge}`}>
              {insight.category}
            </span>
            <h4 className="text-sm font-bold text-slate-100 truncate">{insight.title}</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{insight.description}</p>
        </div>
      </div>

      {insight.actionLabel && (
        <button
          onClick={handleActionClick}
          className="self-end inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <span>{insight.actionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
