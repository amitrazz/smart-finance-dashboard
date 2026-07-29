import React from "react";
import { useOnboardingProgress, useCompleteOnboardingStep } from "../../hooks/useFinanceQueries";
import { useUIStore, NavTab } from "../../store/useUIStore";
import { OnboardingStep } from "../../types";
import { CheckCircle2, Circle, ArrowRight, Sparkles, AlertTriangle, RefreshCw } from "lucide-react";

export const OnboardingView: React.FC = () => {
  const { data: onboarding, isLoading, isError, error, refetch } = useOnboardingProgress();
  const completeMutation = useCompleteOnboardingStep();
  const { setActiveTab } = useUIStore();

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3" />
        <div className="h-44 bg-slate-900/60 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  if (isError || !onboarding) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4 max-w-4xl">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Failed to Load Onboarding Progress</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not fetch onboarding progress from server."}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const pct = Math.round(((onboarding.completedCount || 0) / (onboarding.totalCount || 1)) * 100);

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest">
          <Sparkles className="w-4 h-4" /> Welcome to Smart Personal Finance
        </div>
        <h2 className="text-2xl font-bold text-slate-100">
          Setup Checklist ({onboarding.completedCount}/{onboarding.totalCount} Completed)
        </h2>
        <p className="text-xs text-slate-400 max-w-xl">
          Follow these essential steps to link your accounts, test AI statement parsing, and configure spending thresholds.
        </p>

        {/* Progress Bar */}
        <div className="space-y-2 pt-2">
          <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-semibold text-slate-300">
            <span>{pct}% Onboarding Complete</span>
            <span>
              {onboarding.isComplete
                ? "All Steps Completed!"
                : `${(onboarding.totalCount || 0) - (onboarding.completedCount || 0)} steps remaining`}
            </span>
          </div>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        {onboarding.steps?.map((step: OnboardingStep) => (
          <div
            key={step.id}
            className={`p-6 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              step.completed
                ? "bg-slate-900/40 border-slate-800/80"
                : "bg-slate-900/80 border-indigo-500/30 shadow-lg shadow-indigo-950/20"
            }`}
          >
            <div className="flex items-start gap-4">
              <button
                onClick={() => completeMutation.mutate(step.id)}
                disabled={completeMutation.isPending}
                className="mt-0.5 text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
              >
                {step.completed ? (
                  <CheckCircle2 className="w-6 h-6 fill-emerald-500/20 text-emerald-400" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-500" />
                )}
              </button>

              <div>
                <h3 className={`font-bold text-base ${step.completed ? "text-slate-300 line-through" : "text-slate-100"}`}>
                  {step.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{step.description}</p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab(step.actionTab as NavTab)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700/60 shrink-0"
            >
              <span>Go to {step.actionTab}</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
