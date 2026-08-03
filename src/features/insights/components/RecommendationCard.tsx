import React from "react";
import { SmartRecommendation } from "../types/insightsTypes";
import { formatCurrency } from "../../../utils/formatters";
import { ArrowRight, Zap, Target, Award } from "lucide-react";
import { useUIStore } from "../../../store/useUIStore";

interface RecommendationCardProps {
  recommendation: SmartRecommendation;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
  const { setActiveSubTab } = useUIStore();

  const impactConfig = {
    HIGH_IMPACT: {
      badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      icon: <Award className="w-4 h-4 text-purple-400" />,
      label: "High Impact",
    },
    QUICK_WIN: {
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      icon: <Zap className="w-4 h-4 text-emerald-400" />,
      label: "Quick Win",
    },
    LONG_TERM: {
      badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      icon: <Target className="w-4 h-4 text-indigo-400" />,
      label: "Long Term",
    },
  };

  const currentImpact = impactConfig[recommendation.impactType] || impactConfig.QUICK_WIN;

  const handleActionClick = () => {
    if (recommendation.actionRoute) {
      const sub = recommendation.actionRoute.replace("#insights/", "");
      setActiveSubTab(sub);
    }
  };

  return (
    <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-3 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${currentImpact.badge}`}>
            {currentImpact.icon}
            {currentImpact.label}
          </span>
          <span className="text-[10px] font-semibold text-slate-400">
            Confidence: <strong className="text-slate-200">{recommendation.confidencePercent}%</strong>
          </span>
        </div>

        <h4 className="text-sm font-bold text-slate-100">{recommendation.title}</h4>
        <p className="text-xs text-slate-300 leading-relaxed">{recommendation.reason}</p>
      </div>

      <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
        <div>
          <span className="text-[10px] text-slate-400 block">Est. Monthly Impact</span>
          <span className="font-extrabold text-emerald-400 font-mono text-sm">
            +{formatCurrency(recommendation.estimatedMonthlySavings)}
          </span>
        </div>

        <button
          onClick={handleActionClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
        >
          <span>{recommendation.actionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
