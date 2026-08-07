import React, { useMemo, useState } from "react";
import { useHoldingsInfinite } from "../../../hooks/useFinanceQueries";
import { LotTable } from "../components/LotTable";
import { ErrorState } from "../../../components/common/ErrorState";
import { Holding, InvestmentAssetClass } from "../../../types";
import { Search, Filter } from "lucide-react";
import { NAV_TAB_L2 } from "../../../styles/navTabTokens";

interface HoldingsViewProps {
  onSelectAsset?: (holding: Holding) => void;
}

const ASSET_CLASS_FILTERS: Array<"ALL" | InvestmentAssetClass> = [
  "ALL",
  "STOCK",
  "ETF",
  "MUTUAL_FUND",
  "BOND",
  "GOLD",
  "SILVER",
  "CRYPTO",
  "REIT",
  "INVIT",
];

export const HoldingsView: React.FC<HoldingsViewProps> = ({ onSelectAsset }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssetClass, setSelectedAssetClass] = useState<"ALL" | InvestmentAssetClass>("ALL");

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useHoldingsInfinite({
    limit: 50,
  });

  const holdings = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

  const filteredHoldings = holdings.filter((h) => {
    const name = h.security?.name || "";
    const symbol = h.security?.symbol || "";
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) || symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedAssetClass === "ALL" || h.security?.assetClass === selectedAssetClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search holdings by name or ticker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {ASSET_CLASS_FILTERS.map((ac) => (
            <button
              key={ac}
              onClick={() => setSelectedAssetClass(ac)}
              className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                selectedAssetClass === ac
                  ? `${NAV_TAB_L2}`
                  : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {ac === "ALL" ? "All Assets" : ac.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse p-4">
          <div className="h-12 bg-slate-800 rounded-2xl" />
          <div className="h-12 bg-slate-800 rounded-2xl" />
          <div className="h-12 bg-slate-800 rounded-2xl" />
        </div>
      ) : isError ? (
        <ErrorState title="Failed to load holdings" onRetry={refetch} />
      ) : (
        <>
          <LotTable holdings={filteredHoldings} onSelectAsset={onSelectAsset} />
          {hasNextPage && (
            <div className="text-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition-all disabled:opacity-50"
              >
                {isFetchingNextPage ? "Loading..." : "Load More Holdings"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
