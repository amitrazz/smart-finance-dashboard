import React from "react";
import { useOnboardingStatus } from "./hooks/useOnboarding";
import { useUIStore } from "../../store/useUIStore";
import { Sparkles, ArrowRight } from "lucide-react";

export const OnboardingWidget: React.FC = () => {
  const { data: status } = useOnboardingStatus();
  const { setActiveTab } = useUIStore();

  if (!status || status.isCompleted) return null;

  const pct = status.progressPercent ?? Math.round(((status.completedCount || 0) / (status.totalCount || 8)) * 100);

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl my-4">
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
            Build your personal financial workspace (accounts, loans, investments & goals) in 5–10 minutes.
          </p>
        </div>
      </div>

      <button
        onClick={() => setActiveTab("onboarding")}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all shrink-0 cursor-pointer"
      >
        <span>Resume Workspace Setup</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
