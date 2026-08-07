import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  RotateCcw,
  Search,
  CheckCircle2,
  Trophy,
  Flame,
  Zap,
  Archive,
  History,
} from "lucide-react";
import {
  useSmartActions,
  useActionCategories,
  useDismissAction,
  useCompleteAction,
  useSnoozeAction,
  useRefreshActions,
} from "./hooks/useSmartActions";
import { SmartActionCard } from "./components/SmartActionCard";
import { SmartActionDetailDrawer } from "./components/SmartActionDetailDrawer";
import { SmartActionItem, ActionStatus } from "../../types";
import { useUIStore, NavTab } from "../../store/useUIStore";
import { NAV_TAB_L2 } from "../../styles/navTabTokens";

export const SmartActionCenter: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState("TODAY");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState<ActionStatus>("ACTIVE");
  const [selectedAction, setSelectedAction] = useState<SmartActionItem | null>(null);

  const { data: actions, isLoading } = useSmartActions({
    category: activeCategory,
    status: activeStatus,
    search: searchQuery,
  });

  const { data: categoryCounts } = useActionCategories();

  const dismissMutation = useDismissAction();
  const completeMutation = useCompleteAction();
  const snoozeMutation = useSnoozeAction();
  const refreshMutation = useRefreshActions();
  const { setActiveTab } = useUIStore();

  const handleTakeAction = (action: SmartActionItem) => {
    if (action.deepLink) {
      setActiveTab(action.deepLink as NavTab);
    } else {
      setSelectedAction(action);
    }
  };

  const actionList = Array.isArray(actions) ? actions : [];
  const categoryList = Array.isArray(categoryCounts) ? categoryCounts : [];

  const filteredActions = actionList.filter((action) => {
    if (activeCategory === "TODAY") {
      return action.priority === "CRITICAL" || action.priority === "HIGH" || action.dueInDays === 0;
    }
    if (activeCategory === "CRITICAL") {
      return action.priority === "CRITICAL";
    }
    if (activeCategory !== "ALL") {
      return action.category === activeCategory;
    }
    return true;
  });

  // Dynamic filter chips built from backend /actions/categories
  const defaultPresets = [
    { key: "TODAY", label: "Today" },
    { key: "ALL", label: "All Tasks" },
    { key: "CRITICAL", label: "🔴 Critical" },
  ];

  const categoryChips = [
    ...defaultPresets,
    ...categoryList.map((c) => ({
      key: c.category,
      label: `${c.category} (${c.count})`,
    })),
  ];

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-lg">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-100 font-sans tracking-tight">Smart Action Center</h2>
              <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                Daily Command Center
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Personalized, prioritized financial guidance generated from your live data
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Status Feed Selector (ACTIVE vs History) */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveStatus("ACTIVE")}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeStatus === "ACTIVE"
                  ? `${NAV_TAB_L2}`
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveStatus("COMPLETED")}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeStatus === "COMPLETED"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <CheckCircle2 className="w-3 h-3" /> Done
            </button>
            <button
              onClick={() => setActiveStatus("DISMISSED")}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeStatus === "DISMISSED"
                  ? "bg-slate-800 text-slate-200"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Archive className="w-3 h-3" /> Dismissed
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-36 sm:w-44 transition-all"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            type="button"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Smart Actions"
            aria-label="Refresh Smart Actions"
          >
            <RotateCcw className={`w-4 h-4 ${refreshMutation.isPending ? "animate-spin text-indigo-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categoryChips.map((cat) => {
          const isSelected = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              type="button"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? `${NAV_TAB_L2}`
                  : "bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Card Stack or Empty State */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 bg-slate-950/80 rounded-2xl border border-slate-800" />
          <div className="h-28 bg-slate-950/80 rounded-2xl border border-slate-800" />
        </div>
      ) : filteredActions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredActions.map((action) => (
              <SmartActionCard
                key={action.id}
                action={action}
                onTakeAction={handleTakeAction}
                onDismiss={(id, version) => dismissMutation.mutate({ id, version })}
                onComplete={(id, version) => completeMutation.mutate({ id, version })}
                onSnooze={(id, version, snoozedUntil) =>
                  snoozeMutation.mutate({ id, version, snoozedUntil })
                }
                onOpenDetails={(act) => setSelectedAction(act)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* Celebration / Clear Empty State */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-3xl bg-slate-950/80 border border-emerald-500/30 text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
            {activeStatus === "ACTIVE" ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : (
              <History className="w-8 h-8 text-indigo-400" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-white">
              {activeStatus === "ACTIVE"
                ? "You're all caught up!"
                : `No ${activeStatus.toLowerCase()} actions found`}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {activeStatus === "ACTIVE"
                ? "No urgent financial actions require your attention right now. Great job keeping your finances organized!"
                : "No historical action records match this filter query."}
            </p>
          </div>

          {activeStatus === "ACTIVE" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-md mx-auto pt-2 text-left">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
                <Flame className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-[11px] font-bold text-slate-200">12-Day Streak</div>
                  <div className="text-[10px] text-slate-400">Budget on track</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[11px] font-bold text-slate-200">Emergency Fund</div>
                  <div className="text-[10px] text-slate-400">Milestone Met</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <div className="text-[11px] font-bold text-slate-200">Health Rating</div>
                  <div className="text-[10px] text-slate-400">Calculated Live</div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Slide-over Action Detail Drawer */}
      <SmartActionDetailDrawer
        action={selectedAction}
        onClose={() => setSelectedAction(null)}
        onComplete={(id, version) => completeMutation.mutate({ id, version })}
        onDismiss={(id, version) => dismissMutation.mutate({ id, version })}
      />
    </div>
  );
};
