import React, { useState } from "react";
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Grid,
  CreditCard,
  BarChart3,
  History,
  Activity,
  Trash2,
} from "lucide-react";
import { useBudget, useDeleteBudget, useBudgetCategories } from "../hooks/useBudgetQueries";
import { formatCurrency } from "../../../utils/formatters";
import { BudgetTransactionsTab } from "./BudgetTransactionsTab";

interface BudgetDetailViewProps {
  budgetId: string;
  onBack: () => void;
}

type DetailTab = "overview" | "categories" | "transactions" | "forecast" | "analytics" | "history" | "activity";

export const BudgetDetailView: React.FC<BudgetDetailViewProps> = ({ budgetId, onBack }) => {
  const { data: budget, isLoading, isError, error } = useBudget(budgetId);
  const deleteMutation = useDeleteBudget();
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const { data: categoryLines = [] } = useBudgetCategories(budgetId);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/4" />
        <div className="h-44 bg-slate-900/60 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  if (isError || !budget) {
    return (
      <div className="p-12 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4 max-w-lg mx-auto">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-xl font-extrabold text-slate-100">Budget Not Found</h3>
        <p className="text-xs text-slate-400">
          {(error as Error)?.message || "The requested budget plan could not be retrieved."}
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to My Budgets
        </button>
      </div>
    );
  }

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete budget "${budget.name}"?`)) {
      deleteMutation.mutate({ id: budget.id }, { onSuccess: () => onBack() });
    }
  };

  const tabs: Array<{ id: DetailTab; label: string; icon: React.ReactNode }> = [
    { id: "overview", label: "Overview", icon: <Wallet className="w-4 h-4" /> },
    { id: "categories", label: "Categories", icon: <Grid className="w-4 h-4" /> },
    { id: "transactions", label: "Transactions", icon: <CreditCard className="w-4 h-4" /> },
    { id: "forecast", label: "Forecast", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "history", label: "History", icon: <History className="w-4 h-4" /> },
    { id: "activity", label: "Activity", icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase">
                {budget.period} PLAN
              </span>
              <span className="text-xs text-slate-400">• Health: {budget.budgetHealthGrade || "—"}</span>
            </div>
            <h2 className="text-2xl font-black text-slate-100 tracking-tight mt-0.5">{budget.name}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Delete Plan
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Budget</p>
          <p className="text-sm font-extrabold text-slate-100">{formatCurrency(budget.totalLimit)}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Spent</p>
          <p className="text-sm font-extrabold text-amber-400">{formatCurrency(budget.totalSpent)}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Remaining</p>
          <p className="text-sm font-extrabold text-emerald-400">{formatCurrency(budget.remainingAmount)}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Available</p>
          <p className="text-sm font-extrabold text-cyan-400">{formatCurrency(budget.availableAmount || budget.remainingAmount)}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Daily Budget</p>
          <p className="text-sm font-extrabold text-slate-200">
            {budget.safeDailySpend ? `${formatCurrency(budget.safeDailySpend)}/d` : "—"}
          </p>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Forecast</p>
          <p className="text-sm font-extrabold text-purple-400">
            {budget.forecastMonthEndSpend ? formatCurrency(budget.forecastMonthEndSpend) : "—"}
          </p>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Health</p>
          <p className="text-sm font-extrabold text-emerald-400">
            {budget.budgetHealthScore !== undefined ? `${budget.budgetHealthScore}/100` : "—"}
          </p>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Days Left</p>
          <p className="text-sm font-extrabold text-slate-100">
            {budget.daysRemaining !== undefined ? `${budget.daysRemaining} days` : "—"}
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Lazy Tab Views */}
      <div className="space-y-6">
        {activeTab === "overview" && (
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
            <h3 className="text-lg font-extrabold text-slate-100">Executive Plan Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400">Budget Progress Pace</p>
                <div className="w-full h-4 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-indigo-500"
                    style={{ width: `${Math.min(100, Math.max(0, budget.utilizationPercent ?? 0))}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>{budget.utilizationPercent !== undefined ? `${budget.utilizationPercent}%` : "—"} Used</span>
                  <span>{formatCurrency(budget.remainingAmount)} Left</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Financial Discipline Grade
                </p>
                <p className="text-xs text-slate-400">
                  Budget health is strictly evaluated based on spend pace, category caps, daily allowances, and month-end projections.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-slate-100">Category Spend Caps</h3>
            {categoryLines.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryLines.map((line) => (
                  <div key={line.categoryId} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-100">{line.categoryName || "Category"}</h4>
                      <span className="text-xs font-bold text-slate-300">
                        {formatCurrency(line.spentAmount)} / {formatCurrency(line.allocatedAmount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
                No category caps attached to this budget plan.
              </div>
            )}
          </div>
        )}

        {activeTab === "transactions" && (
          <BudgetTransactionsTab budget={budget} categoryLines={categoryLines} />
        )}

        {activeTab === "forecast" && (
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 text-center">
            Backend-driven forecast curve and overspend risk assessment.
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 text-center">
            Category spend breakdown and rolling variance analytics.
          </div>
        )}

        {activeTab === "history" && (
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 text-center">
            Historical period performance and carry-over records.
          </div>
        )}

        {activeTab === "activity" && (
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 text-center">
            Audit log of allocation updates and automatic adjustments.
          </div>
        )}
      </div>
    </div>
  );
};
