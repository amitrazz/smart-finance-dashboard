import React from "react";
import { Wallet, ArrowRight, PlusCircle } from "lucide-react";
import { formatCurrency } from "../../../utils/formatters";
import { useBudgets } from "../../../hooks/useFinanceQueries";
import { useUIStore } from "../../../store/useUIStore";
import { Budget } from "../../../types";

export const BudgetProgressCard: React.FC = () => {
  const { data: budgetsRaw = [], isLoading } = useBudgets();
  const { setActiveTab } = useUIStore();

  const budgets = budgetsRaw.filter((b) => parseFloat(b.totalLimit?.amount || "0") > 0);

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6 h-full flex flex-col justify-between w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-md">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-100 font-sans tracking-tight">
              Category Budgets & Discipline
            </h3>
            <p className="text-xs text-slate-400">Monthly budget thresholds and remaining limits</p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab("planning", "budgets")}
          className="px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-800 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <span>Manage Budgets</span>
          <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
        </button>
      </div>

      {/* Progress Cards Grid */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse flex-1">
          <div className="h-16 bg-slate-950 rounded-2xl border border-slate-800" />
          <div className="h-16 bg-slate-950 rounded-2xl border border-slate-800" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-3 flex-1 flex flex-col justify-center items-center">
          <p className="text-xs text-slate-300 font-bold">No Active Budgets Set</p>
          <p className="text-[11px] text-slate-400 max-w-xs">Set budget limits to monitor monthly category spending discipline.</p>
          <button
            onClick={() => setActiveTab("planning", "budgets")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create First Budget</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3 flex-1 flex flex-col justify-center">
          {budgets.slice(0, 4).map((b: Budget) => {
            const limit = parseFloat(b.totalLimit?.amount || "0");
            const spent = parseFloat(b.totalSpent?.amount || "0");
            const percent = limit > 0 ? (spent / limit) * 100 : 0;
            const currency = b.totalLimit?.currency || "INR";

            let status: "healthy" | "warning" | "exceeded" = "healthy";
            if (percent > 100) status = "exceeded";
            else if (percent >= 80) status = "warning";

            return (
              <div
                key={b.id}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-100 truncate">{b.name}</span>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-slate-300">
                      {formatCurrency({ amount: String(spent), currency })} / {formatCurrency({ amount: String(limit), currency })}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${
                        status === "healthy"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : status === "warning"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}
                    >
                      {percent.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Bar */}
                <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      status === "healthy"
                        ? "bg-emerald-500"
                        : status === "warning"
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.min(100, percent)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
