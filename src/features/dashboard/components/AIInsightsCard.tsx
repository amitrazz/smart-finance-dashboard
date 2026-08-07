import React from "react";
import { Sparkles, ArrowRight, CheckCircle2, X, MessageSquare } from "lucide-react";
import { useSmartActions, useDismissAction, useCompleteAction } from "../../actions/hooks/useSmartActions";
import { useUIStore } from "../../../store/useUIStore";
import { SmartActionItem } from "../../../types";

export const AIInsightsCard: React.FC = () => {
  const { data: actionsData } = useSmartActions({ status: "ACTIVE" });
  const dismissMutation = useDismissAction();
  const completeMutation = useCompleteAction();
  const { setActiveTab } = useUIStore();

  const actions = (Array.isArray(actionsData) ? actionsData : []).slice(0, 3);

  const handleDismiss = (id: string, version = 1) => {
    dismissMutation.mutate({ id, version });
  };

  const handleComplete = (id: string, version = 1) => {
    completeMutation.mutate({ id, version });
  };

  const handleAskAI = () => {
    // There's no conversational AI backend to carry this action's context into
    // — this just opens Insights, so the toast shouldn't imply otherwise.
    setActiveTab("insights");
  };

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-2xl space-y-6 relative overflow-hidden h-full flex flex-col justify-between w-full">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-md">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-100 font-sans tracking-tight">
                AI Copilot & Smart Actions
              </h3>
              <span className="text-[10px] font-extrabold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30 uppercase">
                AI
              </span>
            </div>
            <p className="text-xs text-slate-400">Intelligent anomaly detection & recommendations</p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab("insights")}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <span>Action Center</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Actions Stack */}
      {actions.length === 0 ? (
        <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-2 my-auto">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <p className="text-xs text-slate-300 font-bold">All Recommendations Applied</p>
          <p className="text-[11px] text-slate-400">Your financial engine is operating at peak efficiency.</p>
        </div>
      ) : (
        <div className="space-y-3 relative z-10 flex-1 flex flex-col justify-center">
          {actions.map((item: SmartActionItem) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              {/* Info */}
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-extrabold text-slate-100 truncate">{item.title}</span>
                  {item.healthScoreImpact && item.healthScoreImpact > 0 && (
                    <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                      +{item.healthScoreImpact} Score
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate">{item.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleAskAI}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 text-xs font-semibold border border-indigo-500/20 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Ask AI</span>
                </button>

                <button
                  onClick={() => handleComplete(item.id, item.version)}
                  disabled={completeMutation.isPending || dismissMutation.isPending}
                  aria-label="Mark Done"
                  className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Mark Done"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDismiss(item.id, item.version)}
                  disabled={completeMutation.isPending || dismissMutation.isPending}
                  aria-label="Dismiss"
                  className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
