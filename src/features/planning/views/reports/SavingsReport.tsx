import React, { useState, useEffect } from "react";
import { useGoalDashboard, useCashFlowAnalytics, useGoals, useGoalAnalytics } from "../../../../hooks/useFinanceQueries";
import { PlanningHeader } from "../../../../components/planning/PlanningHeader";
import { ReportActions } from "../../components/ReportActions";
import { SavingsWidget } from "../../../../components/planning/SavingsWidget";
import { LoadingSkeleton } from "../../../../components/common/LoadingSkeleton";
import { ErrorState } from "../../../../components/common/ErrorState";
import { EmptyState } from "../../../../components/common/EmptyState";
import { formatCurrency, formatPercent } from "../../../../utils/formatters";
import { toCsv } from "../../utils/reportExport";

export const SavingsReport: React.FC = () => {
  const { data: dashboard, isLoading, isError, refetch } = useGoalDashboard();
  const { data: cashFlow = [] } = useCashFlowAnalytics({ limit: 1 });
  const { data: goals = [] } = useGoals();
  const [selectedGoalId, setSelectedGoalId] = useState("");

  useEffect(() => {
    if (!selectedGoalId && goals.length > 0) {
      setSelectedGoalId(goals.find((g) => g.status === "ACTIVE")?.id ?? goals[0].id);
    }
  }, [goals, selectedGoalId]);

  const { data: goalAnalytics } = useGoalAnalytics(selectedGoalId);

  if (isLoading) return <LoadingSkeleton type="cards" rows={3} />;
  if (isError) return <ErrorState title="Failed to Load Savings Report" onRetry={() => refetch()} />;
  if (!dashboard) return <EmptyState title="No Savings Data" message="Create a goal to generate this report." />;

  const latestCashFlow = cashFlow[0];
  const contributionTrend = goalAnalytics?.contributionTrend ?? [];

  const handleExport = () =>
    toCsv(
      contributionTrend.map((c) => ({
        month: c.month,
        contribution: formatCurrency(c.amount),
      })),
      "savings-report"
    );

  return (
    <div className="print-report space-y-6">
      <div className="flex items-center justify-between gap-4">
        <PlanningHeader title="Savings Report" breadcrumb={["Planning", "Reports"]} />
        <ReportActions onExportCsv={handleExport} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SavingsWidget
          totalCurrentCorpus={{ amount: dashboard.totalCorpus, currency: "INR" }}
          totalTargetCorpus={{ amount: dashboard.targetCorpus, currency: "INR" }}
          monthlyContribution={{ amount: dashboard.monthlyContributionTotal, currency: "INR" }}
        />
        {latestCashFlow ? (
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Savings Rate ({latestCashFlow.period})</p>
            <p className="text-2xl font-extrabold text-slate-100">{formatPercent(latestCashFlow.savingsRate)}</p>
            <p className="text-xs text-slate-500">
              {formatCurrency(latestCashFlow.netSavings)} saved of {formatCurrency(latestCashFlow.totalIncome)} income
            </p>
          </div>
        ) : (
          <EmptyState title="No Cash Flow Data" message="Savings rate isn't available yet — it's derived from your income and expense history." />
        )}
      </div>

      <div className="rounded-3xl border border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/60 border-b border-slate-800">
          <span className="text-[11px] text-slate-400 font-bold uppercase">Monthly Contribution Trend</span>
          {goals.length > 0 && (
            <select
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
              className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-[11px] font-bold focus:outline-none"
            >
              {goals.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          )}
        </div>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase bg-slate-900/60">
              <th className="py-2.5 px-4">Month</th>
              <th className="py-2.5 px-4 text-right">Contribution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {contributionTrend.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-6 px-4 text-center text-slate-500">No contribution history for this goal.</td>
              </tr>
            ) : (
              contributionTrend.map((c, i) => (
                <tr key={i}>
                  <td className="py-3 px-4 font-bold text-slate-100">{c.month}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(c.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SavingsReport;
