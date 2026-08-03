import React from "react";
import { DailySpendingPoint } from "../types/insightsTypes";
import { Flame } from "lucide-react";

interface SpendingHeatmapProps {
  data: DailySpendingPoint[];
}

export const SpendingHeatmap: React.FC<SpendingHeatmapProps> = ({ data }) => {
  return (
    <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-400" /> Calendar Spending Velocity Heatmap
        </h3>
        <span className="text-xs text-slate-400 font-semibold">Daily Expenditure Outflow</span>
      </div>

      <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
        {data.map((point) => {
          let bgColor = "bg-emerald-500/10 border-emerald-500/20 text-emerald-300";
          if (point.velocityRating === "SPIKE") {
            bgColor = "bg-rose-500/20 border-rose-500/40 text-rose-300 font-bold";
          } else if (point.velocityRating === "HIGH") {
            bgColor = "bg-amber-500/20 border-amber-500/30 text-amber-300";
          }

          return (
            <div
              key={point.date}
              className={`p-2.5 rounded-xl border text-center space-y-0.5 transition-all hover:scale-105 ${bgColor}`}
            >
              <span className="text-[10px] text-slate-400 block font-mono">
                {point.date.split("-").slice(1).join("/")}
              </span>
              <span className="text-xs font-mono font-bold block">₹{point.amount}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
