import React from "react";
import { HealthDimensionDetail } from "../../../types";
import { AlertTriangle, CheckCircle2, ArrowRight, PieChart } from "lucide-react";
import { useUIStore } from "../../../store/useUIStore";

interface InsightCardProps {
  component: HealthDimensionDetail;
}

// Real Financial Health "Investment Diversification" component — a
// Herfindahl-Hirschman concentration score computed server-side from
// PortfolioSnapshot.allocationByAssetClass. No client-side scoring.
export const InsightCard: React.FC<InsightCardProps> = ({ component }) => {
  const { setActiveSubTab } = useUIStore();

  const isHealthy = component.score >= 70;
  const config = isHealthy
    ? {
        border: "border-emerald-500/30 bg-emerald-500/5 text-emerald-300",
        badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
      }
    : {
        border: "border-amber-500/30 bg-amber-500/5 text-amber-300",
        badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
      };

  return (
    <div className={`p-4 rounded-2xl border ${config.border} flex flex-col justify-between space-y-3 transition-all hover:scale-[1.01]`}>
      <div className="flex items-start gap-3">
        {config.icon}
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.badge}`}>
              Score {component.score}/100
            </span>
            <h4 className="text-sm font-bold text-slate-100">Investment Diversification</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{component.why}</p>
          {component.recommendations && component.recommendations.length > 0 && (
            <ul className="pt-1 space-y-1">
              {component.recommendations.map((rec, idx) => (
                <li key={idx} className="text-xs text-slate-400 flex items-start gap-1.5">
                  <PieChart className="w-3 h-3 mt-0.5 shrink-0 text-slate-500" />
                  <span>{rec.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <button
        onClick={() => setActiveSubTab("allocation")}
        className="self-end inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        <span>View Allocation</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
