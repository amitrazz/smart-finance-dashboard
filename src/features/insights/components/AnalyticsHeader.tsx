import React from "react";
import { TimeHorizon } from "../types/insightsTypes";
import { Calendar, Download } from "lucide-react";

interface AnalyticsHeaderProps {
  title: string;
  description: string;
  horizon?: TimeHorizon;
  onHorizonChange?: (horizon: TimeHorizon) => void;
  onExport?: () => void;
}

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
  title,
  description,
  horizon = "1Y",
  onHorizonChange,
  onExport,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">{title}</h2>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {onHorizonChange && (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-indigo-400 ml-1.5" />
            {(["30D", "90D", "6M", "1Y", "3Y", "ALL"] as const).map((h) => (
              <button
                key={h}
                onClick={() => onHorizonChange(h)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  horizon === h
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        )}

        {onExport && (
          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" /> Export PDF
          </button>
        )}
      </div>
    </div>
  );
};
