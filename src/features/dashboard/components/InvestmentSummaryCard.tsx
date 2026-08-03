import React from "react";
import { PieChart as PieIcon, ArrowRight, PlusCircle } from "lucide-react";
import { formatCurrency, formatPercent } from "../../../utils/formatters";
import { useInvestmentReturns, useAssetAllocation, useHoldings } from "../../../hooks/useFinanceQueries";
import { useUIStore } from "../../../store/useUIStore";

const ASSET_CLASS_COLORS: Record<string, string> = {
  MUTUAL_FUND: "#6366f1",
  EQUITY: "#10b981",
  GOLD: "#f59e0b",
  FIXED_DEPOSIT: "#3b82f6",
  PF: "#8b5cf6",
  CRYPTO: "#ec4899",
};

const getAssetClassLabel = (ac: string) =>
  ac ? ac.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : "Other";

export const InvestmentSummaryCard: React.FC = () => {
  const { data: returnsData, isLoading: isReturnsLoading } = useInvestmentReturns();
  const { data: allocationData, isLoading: isAllocLoading } = useAssetAllocation();
  const { data: holdings = [], isLoading: isHoldingsLoading } = useHoldings();
  const { setActiveTab } = useUIStore();

  const totalValue = returnsData?.totalValue || { amount: "0", currency: "INR" };
  const totalInvested = returnsData?.totalInvested || { amount: "0", currency: "INR" };
  const overallReturnVal = returnsData?.unrealizedGain || { amount: "0", currency: "INR" };
  const overallReturnPercent = returnsData?.returnsPercentage || 0;

  const allocationList = Array.isArray(allocationData?.allocations) ? allocationData.allocations : [];
  const isLoading = isReturnsLoading || isAllocLoading || isHoldingsLoading;
  const hasInvestments = holdings.length > 0 || parseFloat(totalValue.amount) > 0;

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6 h-full flex flex-col justify-between w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-md">
            <PieIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-100 font-sans tracking-tight">
              Investment Snapshot
            </h3>
            <p className="text-xs text-slate-400">Mutual Funds, Equity & FD Growth</p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab("investments")}
          className="px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-800 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <span>Portfolio</span>
          <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse flex-1">
          <div className="h-16 bg-slate-950 rounded-2xl border border-slate-800" />
          <div className="h-16 bg-slate-950 rounded-2xl border border-slate-800" />
        </div>
      ) : !hasInvestments ? (
        <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-3 flex-1 flex flex-col justify-center items-center">
          <p className="text-xs text-slate-300 font-bold">No Investment Holdings Added</p>
          <p className="text-[11px] text-slate-400 max-w-xs">Add mutual funds, stocks, or fixed deposits to track portfolio returns.</p>
          <button
            onClick={() => setActiveTab("investments")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add First Investment</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4 flex-1 flex flex-col justify-center">
          {/* Top 3 Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 block font-semibold">Portfolio Value</span>
              <p className="text-base font-extrabold text-white font-sans truncate">{formatCurrency(totalValue)}</p>
              <span className="text-[10px] text-slate-500 block truncate">Invested: {formatCurrency(totalInvested)}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 block font-semibold">Holdings</span>
              <p className="text-base font-extrabold text-white font-sans truncate">{holdings.length} Assets</p>
              <span className="text-[10px] text-slate-500 block truncate font-mono">Live positions</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 block font-semibold">Overall Return</span>
              <p className={`text-base font-extrabold font-sans truncate ${overallReturnPercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {overallReturnPercent >= 0 ? "+" : ""}{formatCurrency(overallReturnVal)}
              </p>
              <span className={`text-[10px] font-bold block ${overallReturnPercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {overallReturnPercent >= 0 ? "+" : ""}{formatPercent(overallReturnPercent)}
              </span>
            </div>
          </div>

          {/* Asset Allocation Mini Bars */}
          {allocationList.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-slate-300 block">Asset Allocation</span>
              <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800 flex">
                {allocationList.map((item, idx) => {
                  const color = ASSET_CLASS_COLORS[item.assetClass] || "#6366f1";
                  const label = getAssetClassLabel(item.assetClass);
                  return (
                    <div
                      key={idx}
                      className="h-full transition-all"
                      style={{ width: `${item.percentage}%`, backgroundColor: color }}
                      title={`${label}: ${item.percentage}%`}
                    />
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {allocationList.map((item, idx) => {
                  const color = ASSET_CLASS_COLORS[item.assetClass] || "#6366f1";
                  const label = getAssetClassLabel(item.assetClass);
                  return (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="truncate">{label} ({item.percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
