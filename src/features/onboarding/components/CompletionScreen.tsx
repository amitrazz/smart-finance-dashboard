import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, CheckCircle2, ArrowRight, LayoutDashboard, ShieldCheck, Landmark, CreditCard, Home, TrendingUp, Target } from "lucide-react";
import { useCompleteOnboarding } from "../hooks/useOnboarding";
import { OnboardingState } from "../../../types";

interface CompletionScreenProps {
  onboardingState?: OnboardingState;
}

// Particle confetti generator component
const ConfettiEffect: React.FC = () => {
  const [particles] = useState(() =>
    Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      scale: 0.5 + Math.random() * 0.8,
      rotation: Math.random() * 360,
      color: ["#6366f1", "#10b981", "#a855f7", "#ec4899", "#f59e0b"][i % 5],
      delay: Math.random() * 0.5,
      duration: 2.5 + Math.random() * 1.5,
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ top: "-5%", left: `${p.x}%`, opacity: 1, rotate: 0, scale: p.scale }}
          animate={{ top: "105%", opacity: [1, 1, 0], rotate: p.rotation + 360 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut", repeat: Infinity }}
          style={{
            position: "absolute",
            width: "10px",
            height: "10px",
            backgroundColor: p.color,
            borderRadius: p.id % 2 === 0 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
};

export const CompletionScreen: React.FC<CompletionScreenProps> = ({ onboardingState }) => {
  const completeOnboarding = useCompleteOnboarding();

  const completedKeys = onboardingState?.completedStepKeys || [];
  const skippedKeys = onboardingState?.skippedStepKeys || [];

  const summaryItems = [
    { key: "PROFILE", label: "Profile Setup", icon: ShieldCheck },
    { key: "PREFERENCES", label: "Financial Preferences", icon: Sparkles },
    { key: "ACCOUNT", label: "Bank Account Added", icon: Landmark },
    { key: "CREDIT_CARD", label: "Credit Card Configured", icon: CreditCard },
    { key: "LOAN", label: "Loan Information", icon: Home },
    { key: "INVESTMENT", label: "Investment Holdings", icon: TrendingUp },
    { key: "GOAL", label: "Savings Goals", icon: Target },
  ];

  const handleFinish = () => {
    completeOnboarding.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto space-y-8 py-4 relative"
    >
      <ConfettiEffect />

      {/* Hero Card */}
      <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-950 border border-emerald-500/30 p-8 md:p-12 shadow-2xl text-center space-y-6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Icon Badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20"
        >
          <CheckCircle2 className="w-10 h-10" />
        </motion.div>

        {/* Title */}
        <div className="space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Setup Complete
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">
            Your Financial Workspace is Ready
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            All your accounts, preferences, investments, and goals have been saved and configured.
          </p>
        </div>

        {/* Summary Checklist */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Workspace Setup Summary
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {summaryItems.map((item) => {
              const isDone = completedKeys.includes(item.key) || completedKeys.length === 0;
              const isSkipped = skippedKeys.includes(item.key);
              const IconComp = item.icon;

              return (
                <div
                  key={item.key}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium ${
                    isDone
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : isSkipped
                      ? "bg-slate-900 border-slate-800 text-slate-400"
                      : "bg-emerald-500/10 border-emerald-500/20 text-slate-300"
                  }`}
                >
                  <IconComp className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="truncate">{item.label}</span>
                  <span className="ml-auto text-[10px] font-bold">
                    {isSkipped ? "(Skipped)" : "✓ Done"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Finish CTA */}
        <div className="pt-2">
          <button
            onClick={handleFinish}
            disabled={completeOnboarding.isPending}
            type="button"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-slate-950 font-bold text-base shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {completeOnboarding.isPending ? (
              <span>Opening Dashboard...</span>
            ) : (
              <>
                <LayoutDashboard className="w-5 h-5" />
                <span>Go to Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
