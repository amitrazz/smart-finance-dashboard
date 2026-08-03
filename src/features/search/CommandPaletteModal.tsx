import React, { useState, useEffect } from "react";
import { useUIStore, NavTab } from "../../store/useUIStore";
import { useGlobalSearch } from "../../hooks/useFinanceQueries";
import { Search, X, CreditCard, ArrowUpRight, Target, PieChart, Landmark, FileText, ChevronRight } from "lucide-react";

export const CommandPaletteModal: React.FC = () => {
  const { isSearchOpen, setSearchOpen, setActiveTab } = useUIStore();
  const [query, setQuery] = useState("");
  const { data: results = [], isLoading } = useGlobalSearch(query);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(!isSearchOpen);
      }
      if (e.key === "Escape" && isSearchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, setSearchOpen]);

  if (!isSearchOpen) return null;

  // "goals" and "budgets" were merged into the unified "planning" tab —
  // normalize any legacy tab identifier (including ones the search API might
  // still return in result links) instead of silently mis-navigating.
  const LEGACY_TAB_MAP: Record<string, { tab: NavTab; subTab?: string }> = {
    goals: { tab: "planning", subTab: "goals" },
    budgets: { tab: "planning", subTab: "budgets" },
  };

  const navigateTo = (rawTab: string, subTab?: string) => {
    const legacy = LEGACY_TAB_MAP[rawTab];
    if (legacy) {
      setActiveTab(legacy.tab, legacy.subTab ?? null);
    } else {
      setActiveTab(rawTab as NavTab, subTab ?? null);
    }
    setSearchOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "account":
        return <Landmark className="w-4 h-4 text-emerald-400" />;
      case "transaction":
        return <ArrowUpRight className="w-4 h-4 text-blue-400" />;
      case "goal":
        return <Target className="w-4 h-4 text-purple-400" />;
      case "investment":
        return <PieChart className="w-4 h-4 text-amber-400" />;
      case "document":
        return <FileText className="w-4 h-4 text-rose-400" />;
      default:
        return <CreditCard className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-slate-800 bg-slate-900/50">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search accounts, transactions, investments, goals... (Cmd+K)"
            autoFocus
            className="w-full bg-transparent border-none text-slate-100 placeholder-slate-500 focus:outline-none text-base"
          />
          <button
            onClick={() => setSearchOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-800/50">
          {query.trim().length === 0 ? (
            <div className="p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2">Quick Navigation</p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { name: "Dashboard", tab: "dashboard", subTab: undefined, icon: <PieChart className="w-4 h-4 text-indigo-400" /> },
                    { name: "Accounts & Cash", tab: "accounts", subTab: undefined, icon: <Landmark className="w-4 h-4 text-emerald-400" /> },
                    { name: "Transactions", tab: "transactions", subTab: undefined, icon: <ArrowUpRight className="w-4 h-4 text-blue-400" /> },
                    { name: "File Import Wizard", tab: "imports", subTab: undefined, icon: <FileText className="w-4 h-4 text-cyan-400" /> },
                    { name: "Investments Portfolio", tab: "investments", subTab: undefined, icon: <PieChart className="w-4 h-4 text-amber-400" /> },
                    { name: "Goals & Emergency Fund", tab: "planning", subTab: "goals", icon: <Target className="w-4 h-4 text-purple-400" /> },
                  ] as Array<{ name: string; tab: NavTab; subTab?: string; icon: React.ReactNode }>
                ).map((item) => (
                  <button
                    key={item.tab}
                    onClick={() => navigateTo(item.tab, item.subTab)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800/60 text-slate-200 text-sm font-medium transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {isLoading ? (
                <div className="py-8 text-center text-sm text-slate-400">Searching financial domain index...</div>
              ) : results.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">No matching entities found for "{query}".</div>
              ) : (
                <div className="space-y-1">
                  {results.map((res) => (
                    <button
                      key={res.id}
                      onClick={() => navigateTo(res.link.replace("/", ""))}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/80 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-800">{getIcon(res.type)}</div>
                        <div>
                          <p className="text-sm font-medium text-slate-100">{res.title}</p>
                          <p className="text-xs text-slate-400">{res.subtitle}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-slate-500 uppercase px-2 py-1 bg-slate-800 rounded">{res.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
