import { useDashboard } from "../../hooks/useFinanceQueries";
import { formatCurrency } from "../../utils/formatters";

export default function DashboardCards() {
  const { data: dashboard, isLoading, isError } = useDashboard();

  if (isLoading) {
    return (
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        <div className="rounded-2xl p-4 bg-slate-900/60 border border-slate-800 h-24" />
        <div className="rounded-2xl p-4 bg-slate-900/60 border border-slate-800 h-24" />
        <div className="rounded-2xl p-4 bg-slate-900/60 border border-slate-800 h-24" />
      </section>
    );
  }

  if (isError || !dashboard) {
    return null;
  }

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="rounded-2xl p-4 bg-slate-900/60 border border-slate-800 shadow-md">
        <h2 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Cash Position</h2>
        <p className="text-2xl font-extrabold text-slate-100">{formatCurrency(dashboard.cashPosition)}</p>
      </div>

      <div className="rounded-2xl p-4 bg-slate-900/60 border border-slate-800 shadow-md">
        <h2 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Monthly Income</h2>
        <p className="text-2xl font-extrabold text-emerald-400">{formatCurrency(dashboard.monthlyIncome)}</p>
      </div>

      <div className="rounded-2xl p-4 bg-slate-900/60 border border-slate-800 shadow-md">
        <h2 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Monthly Expenses</h2>
        <p className="text-2xl font-extrabold text-rose-400">{formatCurrency(dashboard.monthlySpend)}</p>
      </div>
    </section>
  );
}
