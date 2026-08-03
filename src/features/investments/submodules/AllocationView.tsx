import React, { useState } from "react";
import { useAllocationOverview } from "../hooks/useInvestmentQueries";
import { AllocationPie } from "../components/AllocationPie";
import { AllocationTreemap } from "../components/AllocationTreemap";
import { formatCurrency } from "../../../utils/formatters";
import { PieChart, LayoutGrid } from "lucide-react";

export const AllocationView: React.FC = () => {
  const { data: allocation, isLoading } = useAllocationOverview();
  const [viewType, setViewType] = useState<"PIE" | "TREEMAP">("PIE");

  if (isLoading || !allocation) return null;

  return (
    <div className="space-y-8">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
        <div>
          <h3 className="font-bold text-slate-100 text-sm">Portfolio Allocation Explorer</h3>
          <p className="text-xs text-slate-400">Drill down across Asset Class, Sector, Country, Market Cap & Broker</p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setViewType("PIE")}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
              viewType === "PIE"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <PieChart className="w-3.5 h-3.5" /> Pie Chart
          </button>
          <button
            onClick={() => setViewType("TREEMAP")}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
              viewType === "TREEMAP"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Treemap
          </button>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {viewType === "PIE" ? (
          <>
            <AllocationPie data={allocation.byAssetClass} title="Asset Class Allocation" />
            <AllocationPie data={allocation.bySector} title="Sector Exposure Allocation" />
            <AllocationPie data={allocation.byMarketCap} title="Market Cap Breakdown" />
            <AllocationPie data={allocation.byBroker} title="Broker / Platform Breakdown" />
          </>
        ) : (
          <>
            <AllocationTreemap data={allocation.byAssetClass} title="Asset Class Allocation Treemap" />
            <AllocationTreemap data={allocation.bySector} title="Sector Exposure Allocation Treemap" />
            <AllocationTreemap data={allocation.byMarketCap} title="Market Cap Treemap" />
            <AllocationTreemap data={allocation.byBroker} title="Broker Distribution Treemap" />
          </>
        )}
      </div>

      {/* Detailed Breakdown Tables */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-slate-100">Asset Class Allocation Summary</h3>
        <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Asset Category</th>
                <th className="p-3 text-right">Current Value</th>
                <th className="p-3 text-right">Allocation %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {allocation.byAssetClass.map((item) => (
                <tr key={item.id} className="hover:bg-slate-900/40">
                  <td className="p-3 font-bold text-slate-100">{item.name}</td>
                  <td className="p-3 text-right font-mono font-semibold text-slate-200">{formatCurrency(item.value)}</td>
                  <td className="p-3 text-right font-extrabold text-indigo-400 font-mono">{item.percentage.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
