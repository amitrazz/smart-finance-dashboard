import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Target,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  X,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Zap,
  Calendar,
  Tag,
  BarChart3,
  Percent,
  Copy,
  Shuffle,
  UploadCloud,
  PieChart,
  Repeat,
  AlertCircle,
  AlertTriangle,
  Droplet,
} from "lucide-react";
import { SmartActionItem, ActionPriority } from "../../../types";

interface SmartActionCardProps {
  action: SmartActionItem;
  onTakeAction: (action: SmartActionItem) => void;
  onDismiss: (id: string, version: number) => void;
  onComplete: (id: string, version: number) => void;
  onSnooze: (id: string, version: number, snoozedUntil: string) => void;
  onOpenDetails: (action: SmartActionItem) => void;
}

export const getActionIcon = (iconName?: string | null, category?: string) => {
  switch (iconName) {
    case "shield":
      return <ShieldAlert className="w-5 h-5 text-indigo-400" />;
    case "credit-card":
      return <CreditCard className="w-5 h-5 text-rose-400" />;
    case "calendar":
      return <Calendar className="w-5 h-5 text-amber-400" />;
    case "tag":
      return <Tag className="w-5 h-5 text-purple-400" />;
    case "trending-up":
      return <TrendingUp className="w-5 h-5 text-emerald-400" />;
    case "trending-down":
      return <TrendingDown className="w-5 h-5 text-rose-400" />;
    case "bar-chart":
      return <BarChart3 className="w-5 h-5 text-blue-400" />;
    case "target":
      return <Target className="w-5 h-5 text-emerald-400" />;
    case "check-circle":
      return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    case "percent":
      return <Percent className="w-5 h-5 text-indigo-400" />;
    case "copy":
      return <Copy className="w-5 h-5 text-slate-400" />;
    case "help-circle":
      return <HelpCircle className="w-5 h-5 text-indigo-400" />;
    case "shuffle":
      return <Shuffle className="w-5 h-5 text-teal-400" />;
    case "upload":
      return <UploadCloud className="w-5 h-5 text-indigo-400" />;
    case "pie-chart":
      return <PieChart className="w-5 h-5 text-purple-400" />;
    case "repeat":
      return <Repeat className="w-5 h-5 text-sky-400" />;
    case "alert-circle":
      return <AlertCircle className="w-5 h-5 text-amber-400" />;
    case "alert-triangle":
      return <AlertTriangle className="w-5 h-5 text-rose-400" />;
    case "droplet":
      return <Droplet className="w-5 h-5 text-cyan-400" />;
    default:
      if (category === "PAYMENT" || category === "PAYMENTS" || category === "CREDIT") {
        return <CreditCard className="w-5 h-5 text-rose-400" />;
      }
      if (category === "INCOME") {
        return <DollarSign className="w-5 h-5 text-emerald-400" />;
      }
      if (category === "SAVINGS" || category === "GOALS") {
        return <Target className="w-5 h-5 text-emerald-400" />;
      }
      if (category === "INVESTMENT" || category === "INVESTMENTS") {
        return <TrendingUp className="w-5 h-5 text-indigo-400" />;
      }
      return <Sparkles className="w-5 h-5 text-indigo-400" />;
  }
};

export const SmartActionCard: React.FC<SmartActionCardProps> = ({
  action,
  onTakeAction,
  onDismiss,
  onComplete,
  onSnooze,
  onOpenDetails,
}) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const [customSnoozeDate, setCustomSnoozeDate] = useState("");

  const getPriorityStyle = (priority: ActionPriority) => {
    switch (priority) {
      case "CRITICAL":
        return {
          badge: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          border: "border-rose-500/30 hover:border-rose-500/50",
          dot: "bg-rose-500",
        };
      case "HIGH":
        return {
          badge: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          border: "border-amber-500/30 hover:border-amber-500/50",
          dot: "bg-amber-500",
        };
      case "MEDIUM":
        return {
          badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
          border: "border-slate-800 hover:border-indigo-500/40",
          dot: "bg-indigo-500",
        };
      case "LOW":
        return {
          badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          border: "border-slate-800 hover:border-slate-700",
          dot: "bg-emerald-500",
        };
      default:
        return {
          badge: "bg-slate-800 text-slate-400 border-slate-700",
          border: "border-slate-800 hover:border-slate-700",
          dot: "bg-slate-500",
        };
    }
  };

  const handleSnoozeDays = (days: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    onSnooze(action.id, action.version || 1, targetDate.toISOString());
    setShowSnoozeMenu(false);
  };

  const handleCustomSnooze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSnoozeDate) return;
    const dateObj = new Date(customSnoozeDate);
    if (isNaN(dateObj.getTime()) || dateObj <= new Date()) {
      return;
    }
    onSnooze(action.id, action.version || 1, dateObj.toISOString());
    setShowSnoozeMenu(false);
  };

  const style = getPriorityStyle(action.priority);
  const healthScoreBonus = action.healthScoreImpact ?? action.scoreImpact;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className={`p-5 rounded-2xl bg-slate-950/80 border ${style.border} shadow-lg transition-all space-y-4 relative group`}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
            {getActionIcon(action.icon, action.category)}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold tracking-wider uppercase ${style.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                {action.priority}
              </span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                {action.category}
              </span>
              {action.dueInDays !== undefined && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  {action.dueInDays === 0 ? "Due Today" : `Due in ${action.dueInDays}d`}
                </span>
              )}
            </div>

            <h3 className="text-sm font-bold text-slate-100 mt-1 font-sans">
              {action.title}
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 relative">
          <button
            onClick={() => onComplete(action.id, action.version || 1)}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer"
            title="Mark Complete"
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer"
            title="Snooze Action"
          >
            <Clock className="w-4 h-4" />
          </button>

          {action.dismissible && (
            <button
              onClick={() => onDismiss(action.id, action.version || 1)}
              type="button"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
              title="Dismiss Action"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Snooze Popover Menu */}
          <AnimatePresence>
            {showSnoozeMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                className="absolute right-0 top-8 z-30 w-56 p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-2 text-xs"
              >
                <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                  <span>Snooze Action</span>
                  <button
                    onClick={() => setShowSnoozeMenu(false)}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => handleSnoozeDays(1)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
                  >
                    Tomorrow (+1 day)
                  </button>
                  <button
                    onClick={() => handleSnoozeDays(3)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
                  >
                    In 3 Days
                  </button>
                  <button
                    onClick={() => handleSnoozeDays(7)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
                  >
                    Next Week (+7 days)
                  </button>
                </div>

                <form onSubmit={handleCustomSnooze} className="pt-2 border-t border-slate-800 space-y-1.5">
                  <label className="block text-[10px] text-slate-400 font-semibold">Custom Future Date:</label>
                  <input
                    type="date"
                    value={customSnoozeDate}
                    onChange={(e) => setCustomSnoozeDate(e.target.value)}
                    min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                    className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="w-full py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-all"
                  >
                    Set Snooze
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Description & Impact */}
      <div className="space-y-2">
        <p className="text-xs text-slate-300 leading-relaxed">
          {action.description}
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {Boolean(healthScoreBonus) && (
            <div className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <Zap className="w-3.5 h-3.5" />
              <span>+{healthScoreBonus} Health Score</span>
            </div>
          )}

          {action.financialImpact && (
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Impact: {action.financialImpact}</span>
            </div>
          )}
        </div>
      </div>

      {/* Why Am I Seeing This? Expander */}
      <div className="pt-1 border-t border-slate-900">
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          type="button"
          className="text-[11px] font-semibold text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
          <span>Why am I seeing this?</span>
          {showExplanation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <span className="font-bold text-indigo-300 block">Explanation & Context:</span>
                <p className="leading-relaxed">{action.explanation}</p>
                {action.recommendation && (
                  <p className="text-emerald-400 font-medium pt-1">💡 Recommendation: {action.recommendation}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => onOpenDetails(action)}
          type="button"
          className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          View Context
        </button>

        {action.actionable !== false ? (
          <button
            onClick={() => onTakeAction(action)}
            type="button"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Take Action</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={() => onDismiss(action.id, action.version || 1)}
            type="button"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Acknowledge</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
};
