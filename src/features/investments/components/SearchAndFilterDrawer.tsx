import React, { useState } from "react";
import { useGlobalInvestmentSearch } from "../hooks/useInvestmentQueries";
import { SearchResultItem } from "../types/investmentTypes";
import { X, Search, Filter, ArrowRight, PieChart, Layers, Target, Eye } from "lucide-react";
import { useUIStore } from "../../../store/useUIStore";

interface SearchAndFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchAndFilterDrawer: React.FC<SearchAndFilterDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState("");
  const { setActiveSubTab } = useUIStore();
  const { data: searchResults = [], isLoading } = useGlobalInvestmentSearch(query);

  if (!isOpen) return null;

  const handleSelectResult = (item: SearchResultItem) => {
    setActiveSubTab(item.targetSubTab);
    onClose();
  };

  const getResultIcon = (type: SearchResultItem["type"]) => {
    switch (type) {
      case "HOLDING":
        return <PieChart className="w-4 h-4 text-indigo-400" />;
      case "GOAL":
        return <Target className="w-4 h-4 text-emerald-400" />;
      case "WATCHLIST":
        return <Eye className="w-4 h-4 text-amber-400" />;
      default:
        return <Layers className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search holdings, equities, mutual funds, goals, watchlist..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto max-h-96 space-y-2">
          {query.trim().length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Filter className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">Type a query to search across all investment domains</p>
            </div>
          ) : isLoading ? (
            <p className="text-xs text-slate-400 text-center py-4">Searching investments...</p>
          ) : searchResults.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No matching assets, goals or trades found.</p>
          ) : (
            searchResults.map((res) => (
              <button
                key={res.id}
                onClick={() => handleSelectResult(res)}
                className="w-full p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-800/40 flex items-center justify-between transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">{getResultIcon(res.type)}</div>
                  <div>
                    <h5 className="font-bold text-slate-100 text-sm group-hover:text-indigo-400 transition-colors">
                      {res.title}
                    </h5>
                    <p className="text-xs text-slate-400">{res.subtitle}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
