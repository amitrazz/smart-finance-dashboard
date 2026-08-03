import React from "react";
import { RiskItem } from "../types/insightsTypes";
import { AlertTriangle, ChevronRight } from "lucide-react";

interface RiskCardProps {
  risk: RiskItem;
}

export const RiskCard: React.FC<RiskCardProps> = ({ risk }) => {
  const severityConfig = {
    CRITICAL: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    HIGH: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    MEDIUM: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    LOW: "bg-slate-800 text-slate-300 border-slate-700",
  };

  return (
    <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-3 shadow-xl hover:border-slate-700 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${severityConfig[risk.severity]}`}>
              {risk.severity} SEVERITY
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              Confidence: <strong className="text-slate-200">{risk.confidencePercent}%</strong>
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 pt-1">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            {risk.title}
          </h4>
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">{risk.reason}</p>

      <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Affected Account: <strong className="text-slate-200">{risk.affectedAccount}</strong>
        </span>

        <div className="space-y-1 pt-1 border-t border-slate-800/60">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
            Resolution Action Steps:
          </span>
          {risk.resolutionSteps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-1.5 text-slate-300 text-[11px]">
              <ChevronRight className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
