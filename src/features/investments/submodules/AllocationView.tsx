import React, { useMemo, useState } from "react";
import { useDefaultPortfolio } from "../hooks/useDefaultPortfolio";
import { AllocationPie } from "../components/AllocationPie";
import { AllocationTreemap } from "../components/AllocationTreemap";
import { AllocationBreakdownItem } from "../types";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState } from "../../../components/common/ErrorState";
import { formatCurrency } from "../../../utils/formatters";
import { PieChart, LayoutGrid, Wallet } from "lucide-react";
import { NAV_TAB_L2 } from "../../../styles/navTabTokens";

const ASSET_CLASS_COLORS: Record<string, string> = {
  STOCK: "#10b981",
  ETF: "#14b8a6",
  MUTUAL_FUND: "#6366f1",
  BOND: "#3b82f6",
  FIXED_DEPOSIT: "#0ea5e9",
  GOLD: "#f59e0b",
  SILVER: "#94a3b8",
  CRYPTO: "#ec4899",
  REAL_ESTATE: "#a855f7",
  VEHICLE: "#64748b",
  PPF: "#8b5cf6",
  EPF: "#8b5cf6",
  NPS: "#8b5cf6",
  CASH: "#22c55e",
  REIT: "#f97316",
  INVIT: "#eab308",
  OTHER: "#6b7280",
};

// Only asset-class allocation is real (PortfolioSnapshot.allocationByAssetClass,
// backend-computed). Sector/country/market-cap/broker/currency dimensions
// don't exist on the backend and aren't shown.
export const AllocationView: React.FC = () => {
  const { portfolio, hasPortfolio, isLoading, isError, refetch } = useDefaultPortfolio();
  const [viewType, setViewType] = useState<"PIE" | "TREEMAP">("PIE");

  const items = useMemo<AllocationBreakdownItem[]>(() => {
    const snapshot = portfolio?.latestSnapshot;
    if (!snapshot) return [];
    const totalValue = parseFloat(snapshot.totalMarketValue.amount) || 0;
    return Object.entries(snapshot.allocationByAssetClass).map(([assetClass, fraction]) => ({
      name: assetClass.replace(/_/g, " "),
      value: totalValue * fraction,
      percentage: fraction * 100,
      color: ASSET_CLASS_COLORS[assetClass] || "#6366f1",
    }));
  }, [portfolio]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        <div className="h-72 bg-slate-900 rounded-3xl" />
        <div className="h-72 bg-slate-900 rounded-3xl" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Failed to load allocation" onRetry={refetch} />;
  }

  if (!hasPortfolio || items.length === 0) {
    return (
      <EmptyState
        icon={<Wallet className="w-10 h-10 text-slate-600 mx-auto" />}
        title="No Allocation Data"
        message="Asset class allocation appears once you have open holdings in your portfolio."
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
        <div>
          <h3 className="font-bold text-slate-100 text-sm">Asset Class Allocation</h3>
          <p className="text-xs text-slate-400">Market-value-weighted allocation across your portfolio's holdings</p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setViewType("PIE")}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
              viewType === "PIE" ? `${NAV_TAB_L2}` : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <PieChart className="w-3.5 h-3.5" /> Pie Chart
          </button>
          <button
            onClick={() => setViewType("TREEMAP")}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
              viewType === "TREEMAP" ? `${NAV_TAB_L2}` : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Treemap
          </button>
        </div>
      </div>

      {/* Visualization */}
      <div className="max-w-2xl">
        {viewType === "PIE" ? (
          <AllocationPie data={items} title="Asset Class Allocation" />
        ) : (
          <AllocationTreemap data={items} title="Asset Class Allocation" />
        )}
      </div>

      {/* Detailed Breakdown Table */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-slate-100">Allocation Summary</h3>
        <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Asset Class</th>
                <th className="p-3 text-right">Market Value</th>
                <th className="p-3 text-right">Allocation %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {items.map((item) => (
                <tr key={item.name} className="hover:bg-slate-900/40">
                  <td className="p-3 font-bold text-slate-100">{item.name}</td>
                  <td className="p-3 text-right font-mono font-semibold text-slate-200">
                    {formatCurrency({ amount: item.value.toFixed(2), currency: portfolio?.latestSnapshot.totalMarketValue.currency || "INR" })}
                  </td>
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
