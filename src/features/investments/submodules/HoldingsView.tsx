import React, { useState } from "react";
import { useHoldings } from "../hooks/useInvestmentQueries";
import { LotTable } from "../components/LotTable";
import { AssetClass, InvestmentFilterState } from "../types/investmentTypes";
import { Search, Filter } from "lucide-react";

interface HoldingsViewProps {
  onSelectAsset?: (securityId: string) => void;
}

export const HoldingsView: React.FC<HoldingsViewProps> = ({ onSelectAsset }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssetClass, setSelectedAssetClass] = useState<string>("ALL");

  const filters: InvestmentFilterState = {
    searchQuery,
    assetClasses: selectedAssetClass !== "ALL" ? ([selectedAssetClass] as AssetClass[]) : [],
    brokers: [],
    sectors: [],
    gainLossFilter: "ALL",
  };

  const { data: holdings = [], isLoading } = useHoldings(filters);

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search holdings by name, ticker, or sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {(["ALL", "EQUITY", "MUTUAL_FUND", "DEBT", "GOLD", "SGB", "FIXED_DEPOSIT"] as const).map((ac) => (
            <button
              key={ac}
              onClick={() => setSelectedAssetClass(ac)}
              className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                selectedAssetClass === ac
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {ac === "ALL" ? "All Assets" : ac.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Lot-based Holdings Component */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse p-4">
          <div className="h-12 bg-slate-800 rounded-2xl" />
          <div className="h-12 bg-slate-800 rounded-2xl" />
          <div className="h-12 bg-slate-800 rounded-2xl" />
        </div>
      ) : (
        <LotTable holdings={holdings} onSelectAsset={onSelectAsset} />
      )}
    </div>
  );
};
