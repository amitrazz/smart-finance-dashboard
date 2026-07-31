import React from "react";
import { useOnboardingProgress } from "../../hooks/useFinanceQueries";
import { useUIStore } from "../../store/useUIStore";
import { Sparkles, ArrowRight } from "lucide-react";

export const OnboardingWidget: React.FC = () => {
  const { data: onboarding } = useOnboardingProgress();
  const { setActiveTab, completedStepIds } = useUIStore();

  const isComplete = onboarding?.isComplete || (onboarding?.completedCount ?? 0) >= 10 || completedStepIds.length >= 10;
  if (!onboarding || isComplete) return null;

  const totalCount = onboarding.totalCount || 10;
  const completedCount = onboarding.completedCount || 0;
  const pct = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-slate-100">Personal Finance OS Onboarding</h4>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {pct}% Setup Completed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Capture your current financial position (accounts, loans, investments & assets) in 5–10 minutes.
          </p>
        </div>
      </div>

      <button
        onClick={() => setActiveTab("onboarding")}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all shrink-0"
      >
        <span>Continue Setup Wizard</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
