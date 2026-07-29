import React from "react";
import { useFinancialHealth, useInsights, useDismissInsight } from "../../hooks/useFinanceQueries";
import { Insight } from "../../types";
import { ShieldCheck, AlertCircle, CheckCircle2, X, AlertTriangle, RefreshCw } from "lucide-react";

export const InsightsView: React.FC = () => {
  const { data: health, isLoading: loadingHealth, isError: healthError, error: hErr, refetch: refetchHealth } = useFinancialHealth();
  const { data: insights = [], isLoading: loadingInsights, isError: insightsError, error: iErr, refetch: refetchInsights } = useInsights();
  const dismissMutation = useDismissInsight();

  if (loadingHealth || loadingInsights) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3" />
        <div className="h-32 bg-slate-900/60 rounded-3xl border border-slate-800" />
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-28 bg-slate-900/60 rounded-2xl border border-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  if (healthError || insightsError || !health) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Failed to Load Financial Health & Insights</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {((hErr || iErr) as Error)?.message || "Could not retrieve financial health score or active insights."}
        </p>
        <button
          onClick={() => {
            refetchHealth();
            refetchInsights();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const componentMetrics = [
    { name: "Emergency Fund", weight: "25%", score: health.componentScores?.emergencyFund ?? 0, detail: `${health.emergencyFundMonths ?? 0} months covered` },
    { name: "Savings Rate", weight: "25%", score: health.componentScores?.savingsRate ?? 0, detail: `${health.savingsRatePercent ?? 0}% saved` },
    { name: "Debt-to-Income", weight: "20%", score: health.componentScores?.debtToIncome ?? 0, detail: `${((health.debtToIncomeRatio ?? 0) * 100).toFixed(0)}% ratio` },
    { name: "Credit Utilization", weight: "15%", score: health.componentScores?.creditUtilization ?? 0, detail: `${health.avgCreditUtilization ?? 0}% avg utilization` },
    { name: "Goal Progress", weight: "15%", score: health.componentScores?.goalProgress ?? 0, detail: `On schedule` },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Financial Health Score & AI Insights</h2>
        <p className="text-xs text-slate-400">Composite score derived from precomputed snapshot signals & automated rule triggers</p>
      </div>

      {/* Composite Health Score Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-slate-950 border-4 border-emerald-500 flex flex-col items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-3xl font-extrabold text-slate-100">{health.overallScore}</span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase">/ 100</span>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" /> Financial Health Score
            </div>
            <h3 className="text-xl font-bold text-slate-100">Backend Snapshot Assessment</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Score precomputed by daily health scoring engine based on emergency fund, savings rate, and credit utilization.
            </p>
          </div>
        </div>
      </div>

      {/* 5 Component Breakdown Cards */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-slate-100">Score Component Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {componentMetrics.map((comp) => (
            <div key={comp.name} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-400">{comp.name}</span>
                <span className="text-[10px] text-slate-500">{comp.weight}</span>
              </div>
              <p className="text-2xl font-extrabold text-slate-100">{comp.score}</p>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${comp.score}%` }} />
              </div>
              <p className="text-[11px] text-emerald-400 font-medium">{comp.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active Insights List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-100">Automated Insights & Alerts</h3>
          <span className="text-xs font-semibold text-slate-400">{insights.length} Active Rules Triggered</span>
        </div>

        {insights.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
            No active insights or recommendations at present.
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight: Insight) => (
              <div key={insight.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-xl ${
                      insight.severity === "WARNING"
                        ? "bg-amber-500/10 text-amber-400"
                        : insight.severity === "CRITICAL"
                        ? "bg-rose-500/10 text-rose-400"
                        : "bg-emerald-500/10 text-emerald-400"
                    }`}
                  >
                    {insight.severity === "WARNING" ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-100 text-sm">{insight.title}</h4>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {insight.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{insight.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => dismissMutation.mutate(insight.id)}
                  disabled={dismissMutation.isPending}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                  title="Dismiss Insight"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
