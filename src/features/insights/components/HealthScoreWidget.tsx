import React from "react";
import { FinancialHealthOverview, HealthDimension } from "../types/insightsTypes";
import { ShieldCheck, Star, TrendingUp, Info } from "lucide-react";

interface HealthScoreWidgetProps {
  data: FinancialHealthOverview;
}

export const HealthScoreWidget: React.FC<HealthScoreWidgetProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Hero Score Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-slate-950 border-4 border-emerald-500 flex flex-col items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            <span className="text-3xl font-extrabold text-slate-100 font-mono">{data.overallScore}</span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase">/ 100</span>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" /> Financial Health Score • {data.rating} Rating
            </div>
            <h3 className="text-xl font-bold text-slate-100">Composite Financial Assessment</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Score computed across 8 key financial health dimensions based on cash flow, savings rate, emergency fund, debt ratio, and credit usage.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Score Trend</span>
            <span className="text-sm font-extrabold text-emerald-400 flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-4 h-4" /> Upward (+2 pts)
            </span>
          </div>
        </div>
      </div>

      {/* 8 Dimension Breakdown Grid */}
      <div className="space-y-3">
        <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-400" /> Score Breakdown across 8 Dimensions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.dimensions.map((dim: HealthDimension) => (
            <div key={dim.code} className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-3 backdrop-blur-xl flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-100">{dim.label}</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < dim.stars ? "fill-amber-400 text-amber-400" : "fill-slate-800 text-slate-800"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-2xl font-extrabold text-slate-100 font-mono">{dim.score}</span>
                  <span className="text-xs text-slate-500 font-semibold">/ 100</span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      dim.score >= 80
                        ? "bg-emerald-500"
                        : dim.score >= 60
                          ? "bg-indigo-500"
                          : "bg-amber-500"
                    }`}
                    style={{ width: `${dim.score}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800/60 text-xs">
                <p className="text-slate-300 leading-snug">
                  <strong className="text-slate-100 font-semibold">Why: </strong>
                  {dim.why}
                </p>
                <p className="text-indigo-400 text-[11px] font-medium">
                  💡 {dim.improvementTip}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
