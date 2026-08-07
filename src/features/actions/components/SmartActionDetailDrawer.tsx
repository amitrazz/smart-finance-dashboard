import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Zap, HelpCircle, CheckCircle2, ArrowRight, DollarSign } from "lucide-react";
import { SmartActionItem } from "../../../types";
import { useUIStore, NavTab } from "../../../store/useUIStore";

interface DetailDrawerProps {
  action: SmartActionItem | null;
  onClose: () => void;
  onComplete: (id: string, version: number) => void;
  onDismiss: (id: string, version: number) => void;
}

export const SmartActionDetailDrawer: React.FC<DetailDrawerProps> = ({
  action,
  onClose,
  onComplete,
  onDismiss,
}) => {
  const { setActiveTab } = useUIStore();

  if (!action) return null;

  const handleNavigate = () => {
    if (action.deepLink) {
      setActiveTab(action.deepLink as NavTab);
      onClose();
    }
  };

  const healthScoreBonus = action.healthScoreImpact ?? action.scoreImpact;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full max-w-lg bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col h-full shadow-2xl z-10 overflow-y-auto"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-md z-20">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold uppercase tracking-wider">
                {action.priority} Priority
              </span>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                {action.category}
              </span>
            </div>

            <button
              onClick={onClose}
              type="button"
              aria-label="Close"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 flex-1">
            {/* Title & Description */}
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white font-sans">{action.title}</h2>
              <p className="text-sm text-slate-300 leading-relaxed">{action.description}</p>
            </div>

            {/* Expected Health Score & Financial Impact */}
            <div className="space-y-3">
              {Boolean(healthScoreBonus) && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-emerald-400">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-bold">Financial Health Score Improvement</span>
                  </div>
                  <span className="text-base font-extrabold">+{healthScoreBonus} Points</span>
                </div>
              )}

              {action.financialImpact && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-amber-400">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-bold">Estimated Financial Impact</span>
                  </div>
                  <span className="text-base font-extrabold">{action.financialImpact}</span>
                </div>
              )}
            </div>

            {/* Why Am I Seeing This Explanation */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                <span>Why am I seeing this recommendation?</span>
              </h4>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
                {action.explanation}
              </p>
            </div>

            {/* Recommendation Box */}
            {action.recommendation && (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Suggested Next Action</span>
                </h4>
                <p className="text-xs text-slate-300">{action.recommendation}</p>
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="p-6 border-t border-slate-800 bg-slate-950/80 space-y-3">
            {action.deepLink && (
              <button
                onClick={handleNavigate}
                type="button"
                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Go to Relevant Module</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onComplete(action.id, action.version || 1);
                  onClose();
                }}
                type="button"
                className="w-1/2 py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Complete</span>
              </button>

              {action.dismissible && (
                <button
                  onClick={() => {
                    onDismiss(action.id, action.version || 1);
                    onClose();
                  }}
                  type="button"
                  className="w-1/2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
                >
                  Dismiss Action
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
