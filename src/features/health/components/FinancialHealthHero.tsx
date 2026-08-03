import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  RotateCcw,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
  Star,
  Zap,
} from "lucide-react";
import {
  useFinancialHealth,
  useRecalculateHealthScore,
  HEALTH_DIMENSION_LABELS,
  getRatingLabel,
} from "../hooks/useFinancialHealth";
import { FinancialHealthDetailDrawer } from "./FinancialHealthDetailDrawer";
import { HealthDimensionKey, HealthDimensionDetail } from "../../../types";

export const FinancialHealthHero: React.FC = () => {
  const { data: health, isLoading } = useFinancialHealth();
  const recalculateMutation = useRecalculateHealthScore();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [selectedDimensionKey, setSelectedDimensionKey] = useState<HealthDimensionKey | undefined>(undefined);

  if (isLoading) {
    return (
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 animate-pulse space-y-6">
        <div className="h-10 bg-slate-800/80 rounded-xl w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 bg-slate-950/80 rounded-2xl" />
          <div className="h-48 bg-slate-950/80 rounded-2xl md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!health) {
    return null;
  }

  const rawComponents = health.componentScores || health.components || {};
  const ALL_KEYS: HealthDimensionKey[] = [
    "CASH_FLOW",
    "SAVINGS_RATE",
    "EMERGENCY_FUND",
    "DEBT_HEALTH",
    "CREDIT_UTILIZATION",
    "INVESTMENT_DIVERSIFICATION",
    "BILL_DISCIPLINE",
    "SPENDING_DISCIPLINE",
  ];

  const componentsList: HealthDimensionDetail[] = ALL_KEYS.map((key) => {
    const val = rawComponents[key];
    return {
      code: key,
      label: val?.label || HEALTH_DIMENSION_LABELS[key] || key,
      score: typeof val?.score === "number" ? val.score : 0,
      stars: typeof val?.stars === "number" ? val.stars : 1,
      why: val?.why || val?.reason || "Calculated based on recent financial metrics.",
      metrics: val?.metrics,
      recommendations: val?.recommendations,
    };
  });

  const handleDimensionClick = (key: HealthDimensionKey) => {
    setSelectedDimensionKey(key);
    setDrawerOpen(true);
  };

  const getRatingColor = (rating?: string) => {
    if (!rating) return "text-rose-400 border-rose-500/30 bg-rose-500/10";
    switch (rating.toUpperCase()) {
      case "EXCEPTIONAL":
      case "EXCELLENT":
        return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
      case "GOOD":
        return "text-indigo-400 border-indigo-500/30 bg-indigo-500/10";
      case "NEEDS_ATTENTION":
        return "text-amber-400 border-amber-500/30 bg-amber-500/10";
      case "POOR":
      case "CRITICAL":
      default:
        return "text-rose-400 border-rose-500/30 bg-rose-500/10";
    }
  };

  const topRecs = health.topRecommendations || [];

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-indigo-950/30 to-slate-950 border border-indigo-500/20 p-6 md:p-8 shadow-2xl space-y-6">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100 font-sans tracking-tight">Financial Health Score</h2>
                <span className="text-[10px] font-extrabold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 uppercase tracking-widest">
                  Primary KPI
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                The Financial Credit Score for Yourself • Calculated continuously
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedDimensionKey(undefined);
                setDrawerOpen(true);
              }}
              type="button"
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700/60 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Why {health.overallScore} and not 100?</span>
            </button>

            <button
              onClick={() => recalculateMutation.mutate()}
              disabled={recalculateMutation.isPending}
              type="button"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition-all cursor-pointer"
              title="Recalculate Score"
            >
              <RotateCcw className={`w-4 h-4 ${recalculateMutation.isPending ? "animate-spin text-indigo-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Main Grid: Score Gauge vs Dimension Stars & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Score Gauge (4 Cols) */}
          <div className="lg:col-span-4 p-6 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between items-center text-center relative overflow-hidden shadow-xl">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overall Financial Health</span>
              {typeof health.monthlyTrend === "number" && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-semibold pt-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>+{health.monthlyTrend} pts this month</span>
                </div>
              )}
            </div>

            {/* Score Ring Gauge */}
            <div className="relative w-44 h-44 my-4 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8" className="text-slate-800" fill="transparent" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="url(#score-gradient)"
                  strokeWidth="8"
                  strokeDasharray="264"
                  initial={{ strokeDashoffset: 264 }}
                  animate={{ strokeDashoffset: 264 - (264 * health.overallScore) / 100 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  strokeLinecap="round"
                  fill="transparent"
                />
                <defs>
                  <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold text-white tracking-tight font-sans">{health.overallScore}</span>
                <span className="text-xs font-semibold text-slate-400">/ 100</span>
              </div>
            </div>

            {/* Rating Badge & CTA */}
            <div className="space-y-3 w-full">
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold ${getRatingColor(health.rating)}`}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{getRatingLabel(health.rating)} Rating</span>
              </div>

              <button
                onClick={() => setDrawerOpen(true)}
                type="button"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white border border-slate-800 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>View Full Breakdown</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: 8 Dimension Stars Grid & Top Improvements (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
            {/* 8 Dimension Stars Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">8 Financial Dimensions</h3>
                <span className="text-[11px] text-slate-400">Click dimension for details</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {componentsList.map((comp) => {
                  return (
                    <button
                      key={comp.code}
                      onClick={() => handleDimensionClick(comp.code)}
                      type="button"
                      className="p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 text-left transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                        <span className="truncate">{comp.label}</span>
                        <span className="text-[11px] font-extrabold text-slate-400">{comp.score}</span>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5 mt-1.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < comp.stars ? "fill-amber-400 text-amber-400" : "fill-slate-800 text-slate-800"
                            }`}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Top Recommended Actions Box */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Top High-Impact Improvements</span>
                </h4>
                <span className="text-[11px] text-emerald-400 font-semibold">Expected Impact</span>
              </div>

              {topRecs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {topRecs.slice(0, 3).map((rec, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="text-xs font-bold text-slate-100 line-clamp-2">{rec.text || rec.title || "Recommendation"}</h5>
                        <span className="text-[11px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                          +{rec.estimatedImpact || rec.scoreImpact || 0} Score
                        </span>
                      </div>
                      {rec.component && (
                        <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
                          {HEALTH_DIMENSION_LABELS[rec.component as HealthDimensionKey] || rec.component}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No pending high-impact recommendations. Your financial health score is optimal!</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Slide-over Health Detail Drawer */}
      <FinancialHealthDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        healthData={health}
        selectedKey={selectedDimensionKey}
      />
    </>
  );
};
