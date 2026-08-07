import React from "react";
import { Check, LogOut, RotateCcw, ArrowLeft } from "lucide-react";
import { useUIStore } from "../../../store/useUIStore";

export interface StepItem {
  key: string;
  title: string;
  isOptional: boolean;
}

interface HeaderProps {
  steps: StepItem[];
  currentStepKey: string;
  completedStepKeys: string[];
  skippedStepKeys: string[];
  onSelectStep?: (key: string) => void;
  onBack?: () => void;
  onReset?: () => void;
  canGoBack?: boolean;
}

export const OnboardingProgressHeader: React.FC<HeaderProps> = ({
  steps,
  currentStepKey,
  completedStepKeys,
  skippedStepKeys,
  onSelectStep,
  onBack,
  onReset,
  canGoBack = false,
}) => {
  const { setActiveTab } = useUIStore();

  const isDoneAll = currentStepKey === "COMPLETE" || completedStepKeys.length >= 7;
  const setupSteps = ["PROFILE", "PREFERENCES", "ACCOUNT", "CREDIT_CARD", "LOAN", "INVESTMENT", "GOAL"];
  const currentSetupIdx = setupSteps.indexOf(currentStepKey);

  const doneSet = new Set([...completedStepKeys, ...skippedStepKeys]);
  let doneCount = doneSet.size;
  if (currentSetupIdx >= 0) {
    doneCount = Math.max(doneCount, currentSetupIdx);
  }
  const progressPct = isDoneAll ? 100 : Math.min(100, Math.round((doneCount / setupSteps.length) * 100));
  const activeIndex = steps.findIndex((s) => s.key === currentStepKey);
  const total = steps.length > 0 ? steps.length : 1;

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 md:p-5 shadow-2xl space-y-4 mb-8 sticky top-4 z-30 transition-all">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {canGoBack && onBack ? (
            <button
              onClick={onBack}
              type="button"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700/50 flex items-center gap-1.5 text-xs font-semibold"
              aria-label="Go back to previous step"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          ) : null}

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
              {progressPct}% Setup
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Step {activeIndex >= 0 ? activeIndex + 1 : 1} of {total}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onReset && (
            <button
              onClick={onReset}
              type="button"
              className="p-2 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all flex items-center gap-1.5"
              title="Reset Onboarding"
              aria-label="Reset onboarding progress"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("dashboard")}
            type="button"
            className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 rounded-xl border border-slate-700/60 transition-all flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span>Save & Exit</span>
          </button>
        </div>
      </div>

      {/* Progress Line bar */}
      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full transition-all duration-500 ease-out"
          style={{ width: `${Math.max(5, progressPct)}%` }}
        />
      </div>

      {/* Stepper horizontal badges */}
      <div className="hidden lg:flex items-center justify-between gap-1 overflow-x-auto pt-1 no-scrollbar">
        {steps.map((step, idx) => {
          const isDone = completedStepKeys.includes(step.key);
          const isSkipped = skippedStepKeys.includes(step.key);
          const isCurrent = step.key === currentStepKey;
          const isClickable = isDone || isSkipped || idx <= activeIndex;

          return (
            <button
              key={step.key}
              type="button"
              disabled={!isClickable || !onSelectStep}
              onClick={() => onSelectStep && onSelectStep(step.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-xs font-semibold shrink-0 ${
                isCurrent
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-400/50"
                  : isDone
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer"
                  : isSkipped
                  ? "bg-slate-800/50 text-slate-400 border border-slate-700/40 line-through opacity-70"
                  : "bg-slate-900/40 text-slate-500 border border-slate-800/50 opacity-60"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isDone
                    ? "bg-emerald-500 text-slate-950"
                    : isCurrent
                    ? "bg-white text-indigo-600"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
              </span>
              <span>{step.title}</span>
              {step.isOptional && !isDone && !isCurrent && (
                <span className="text-[10px] opacity-60 font-normal">(Opt)</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
