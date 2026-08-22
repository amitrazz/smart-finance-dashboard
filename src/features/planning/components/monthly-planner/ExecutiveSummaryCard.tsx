import React from "react";
import { Wallet, TrendingDown, ShieldCheck, PiggyBank, Wallet2, TrendingUp } from "lucide-react";
import { MetricCard } from "../../../../components/common/MetricCard";
import { formatCurrency, formatPercent } from "../../../../utils/formatters";
import { MonthlyFinancialPlan } from "../../../../types";

interface ExecutiveSummaryCardProps {
  plan: MonthlyFinancialPlan;
  onNavigateBudget?: () => void;
}

/** Spec §5 — the top-of-page glance: income, outflow, safe-to-spend, closing cash, budget used, savings rate. All values come straight from the backend response, never recomputed. */
export const ExecutiveSummaryCard: React.FC<ExecutiveSummaryCardProps> = ({ plan, onNavigateBudget }) => {
  const closingCash = plan.cashFlow?.expectedClosingCash;
  const isClosingNegative = closingCash ? parseFloat(closingCash.amount) < 0 : false;
  const safeToSpend = plan.safeToSpend?.safeToSpend;
  const isSafeToSpendNegative = safeToSpend ? parseFloat(safeToSpend.amount) < 0 : false;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <MetricCard
        title="Expected Income"
        value={plan.income.actual ?? plan.income.planned}
        icon={<Wallet className="w-4 h-4" />}
        accentColor="emerald"
        subtitle={plan.income.actual ? `Planned ${formatCurrency(plan.income.planned)}` : "Projected"}
      />
      <MetricCard
        title="Planned Outflow"
        value={formatCurrency(plan.cashFlow?.expectedOutflow)}
        icon={<TrendingDown className="w-4 h-4" />}
        accentColor="amber"
        subtitle="Fixed + debt + savings + investments"
      />
      <MetricCard
        title="Safe to Spend"
        value={safeToSpend ?? "—"}
        icon={<ShieldCheck className="w-4 h-4" />}
        accentColor={isSafeToSpendNegative ? "rose" : "indigo"}
        subtitle={isSafeToSpendNegative ? "Below zero this month" : "After every commitment"}
      />
      <MetricCard
        title="Expected Closing Cash"
        value={closingCash ?? "—"}
        icon={<Wallet2 className="w-4 h-4" />}
        accentColor={isClosingNegative ? "rose" : "sky"}
        subtitle={plan.cashFlow?.openingCashBasis === "NOT_AVAILABLE" ? "Not available for this month" : undefined}
      />
      <MetricCard
        title="Budget Used"
        value={plan.budget.utilizationPercent !== undefined ? `${plan.budget.utilizationPercent}%` : "—"}
        icon={<PiggyBank className="w-4 h-4" />}
        accentColor="purple"
        progressPercent={plan.budget.utilizationPercent}
        progressBarColor={(plan.budget.utilizationPercent ?? 0) >= 90 ? "bg-rose-500" : "bg-indigo-500"}
        onClick={onNavigateBudget}
      />
      <MetricCard
        title="Savings Rate"
        value={formatPercent(plan.savingsRatePercent, 1)}
        icon={<TrendingUp className="w-4 h-4" />}
        accentColor="emerald"
        subtitle="Savings + investments vs. actual income"
      />
    </div>
  );
};

export default ExecutiveSummaryCard;
