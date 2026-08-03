import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, ShieldCheck, TrendingUp, Zap, CheckCircle2 } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useFinancialHealthHistory, HEALTH_DIMENSION_LABELS, getRatingLabel } from "../hooks/useFinancialHealth";
import { DetailedFinancialHealthScore, HealthDimensionKey, HealthDimensionDetail } from "../../../types";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  healthData: DetailedFinancialHealthScore;
  selectedKey?: HealthDimensionKey;
}

const PERIODS = ["7d", "30d", "90d", "6m", "1y", "all"];

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

export const FinancialHealthDetailDrawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  healthData,
  selectedKey,
}) => {
  const [activePeriod, setActivePeriod] = useState("30d");
  const [activeDimension, setActiveDimension] = useState<HealthDimensionKey | "ALL">(
    selectedKey || "ALL"
  );

  const { data: historyData } = useFinancialHealthHistory(activePeriod);

  if (!isOpen) return null;

  const rawComponents = healthData.componentScores || healthData.components || {};

  const componentsList: HealthDimensionDetail[] = ALL_KEYS.map((key) => {
    const val = rawComponents[key];
    return {
      code: key,
      label: val?.label || HEALTH_DIMENSION_LABELS[key] || key,
      score: typeof val?.score === "number" ? val.score : 0,
      stars: typeof val?.stars === "number" ? val.stars : 1,
      why: val?.why || val?.reason || "Calculated based on current account balances and cash flows.",
      metrics: val?.metrics,
      recommendations: val?.recommendations,
    };
  });

  const activeDetail = activeDimension !== "ALL" ? componentsList.find((c) => c.code === activeDimension) : null;

  const historyList = Array.isArray(historyData) ? historyData : [];
  const formattedHistory = historyList.map((h) => ({
    date: h.date || h.snapshotDate || "—",
    score: typeof h.overallScore === "number" ? h.overallScore : typeof h.score === "number" ? h.score : 0,
    delta: h.delta,
    reasons: Array.isArray(h.reasons) ? h.reasons : [],
  }));

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
          className="relative w-full max-w-2xl bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col h-full shadow-2xl z-10 overflow-y-auto"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-md z-20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-100">Financial Health Analysis</h3>
                <p className="text-xs text-slate-400">Score Explainability & Historical Trend</p>
              </div>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 flex-1">
            {/* Why Score Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/80 to-slate-950 border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Score Explainability</span>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                    {getRatingLabel(healthData.rating)}
                  </span>
                </div>
                <span className="text-2xl font-extrabold text-white">{healthData.overallScore} / 100</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Your overall score of {healthData.overallScore}/100 is derived from 8 financial dimensions scored continuously. Key areas of growth are highlighted in your dimension recommendations below.
              </p>
            </div>

            {/* Historical Score Trend Chart */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Score History Trend</h4>
                </div>

                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  {PERIODS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setActivePeriod(p)}
                      type="button"
                      className={`px-2.5 py-1 text-[11px] font-bold uppercase rounded-lg transition-all ${
                        activePeriod === p
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart */}
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="health-chart-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }}
                      labelStyle={{ color: "#94a3b8" }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#health-chart-grad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Latest Reasons */}
              {formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].reasons?.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recent Changes:</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {formattedHistory[formattedHistory.length - 1].reasons.map((r, i) => (
                      <span key={i} className="text-[11px] text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dimension Filter Pills */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Dimension Analysis</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveDimension("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeDimension === "ALL"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800"
                  }`}
                >
                  All 8 Dimensions
                </button>
                {componentsList.map((comp) => (
                  <button
                    key={comp.code}
                    type="button"
                    onClick={() => setActiveDimension(comp.code)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      activeDimension === comp.code
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800"
                    }`}
                  >
                    {comp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dimension Breakdown Cards */}
            <div className="space-y-3">
              {(activeDetail ? [activeDetail] : componentsList).map((comp) => (
                <div key={comp.code} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100">{comp.label}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 uppercase tracking-wider font-semibold">
                        {comp.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < comp.stars ? "fill-amber-400 text-amber-400" : "fill-slate-800 text-slate-800"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-extrabold text-white">{comp.score}/100</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                    {comp.why}
                  </p>

                  {/* Metrics */}
                  {comp.metrics && Object.keys(comp.metrics).length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {Object.entries(comp.metrics).map(([mKey, metric]) => (
                        <div key={mKey} className="text-xs bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                          <span className="text-slate-400 font-medium">{metric.label}:</span>
                          <span className="text-slate-200 font-bold">
                            {metric.actual} <span className="text-slate-400 text-[10px] font-normal">(target: {metric.target})</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Component Recommendations */}
                  {comp.recommendations && comp.recommendations.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {comp.recommendations.map((rec, rIdx) => (
                        <div key={rIdx} className="flex items-center justify-between text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 font-semibold">
                          <span className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 shrink-0" />
                            {rec.text}
                          </span>
                          <span className="text-emerald-400 font-extrabold shrink-0">+{rec.estimatedImpact} Score</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
