import React from "react";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { useFinancialHealth, useHealthComponents } from "../../../hooks/useFinanceQueries";
import { useUIStore } from "../../../store/useUIStore";
import { HealthDimensionDetail } from "../../../types";

type HealthDimension = HealthDimensionDetail & { dimensionName?: string; status?: string };

export const FinancialHealthCard: React.FC = () => {
  const { data: healthData } = useFinancialHealth();
  const { data: componentsData } = useHealthComponents();
  const { setActiveTab } = useUIStore();

  const score = healthData?.overallScore || 0;
  const rating = healthData?.rating || "GOOD";
  const dimensions = Array.isArray(componentsData) ? componentsData : [];

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6 h-full flex flex-col justify-between w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-100 font-sans tracking-tight">
              Financial Health Index
            </h3>
            <p className="text-xs text-slate-400">8-dimension holistic stability score</p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab("analytics")}
          className="px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-800 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <span>Breakdown</span>
          <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
        </button>
      </div>

      {/* Score & Dimension Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center flex-1">
        {/* Gauge Circle */}
        <div className="sm:col-span-5 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-3 flex flex-col justify-center items-center h-full">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-28 h-28 rounded-full border-8 border-slate-900 border-t-emerald-500 border-r-emerald-500 border-b-teal-500 flex items-center justify-center shadow-xl">
              <div>
                <span className="text-2xl font-extrabold text-white font-sans block leading-none">{score}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mt-1">/ 100</span>
              </div>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider">
              {rating}
            </span>
          </div>
        </div>

        {/* Dimension Badges */}
        <div className="sm:col-span-7 grid grid-cols-2 gap-2.5">
          {dimensions.length === 0 ? (
            <div className="col-span-2 p-4 text-center text-xs text-slate-400">
              Health score dimensions calculated automatically from live accounts.
            </div>
          ) : (
            dimensions.slice(0, 6).map((dim: HealthDimension, idx: number) => (
              <div key={idx} className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 truncate block">{dim.dimensionName}</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white">{dim.score}</span>
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                      dim.score >= 80
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {dim.status || (dim.score >= 80 ? "OK" : "MOD")}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
