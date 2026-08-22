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
  const isShortfall = plan.safeToSpend ? parseFloat(plan.safeToSpend.shortfall.amount) > 0 : false;
  const isBudgetExceeded = plan.budget.status === "EXCEEDED";
  // Prefer the canonical Financial Health actual rate when it's been
  // computed for this month; fall back to the planner's own forward-looking
  // projection when no snapshot exists yet (never a fabricated 0%).
  const savingsRateValue = plan.savingsRate.actualPercent ?? plan.savingsRate.projectedPercent;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <MetricCard
        title="Expected Income"
        value={plan.income.actualToDate ?? plan.income.expectedFullPeriod}
        icon={<Wallet className="w-4 h-4" />}
        accentColor="emerald"
        subtitle={
          plan.income.actualToDate
            ? `${formatCurrency(plan.income.remainingExpected)} remaining of ${formatCurrency(plan.income.expectedFullPeriod)}`
            : "Projected"
        }
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
        value={plan.safeToSpend ? formatCurrency(plan.safeToSpend.available) : "—"}
        icon={<ShieldCheck className="w-4 h-4" />}
        accentColor={isShortfall ? "rose" : "indigo"}
        subtitle={isShortfall ? `Shortfall ${formatCurrency(plan.safeToSpend!.shortfall)}` : "After every commitment"}
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
        progressBarColor={isBudgetExceeded ? "bg-rose-500" : "bg-indigo-500"}
        subtitle={isBudgetExceeded && plan.budget.overrun ? `Over by ${formatCurrency(plan.budget.overrun)}` : undefined}
        onClick={onNavigateBudget}
      />
      <MetricCard
        title="Savings Rate"
        value={savingsRateValue !== null ? formatPercent(savingsRateValue, 1) : "—"}
        icon={<TrendingUp className="w-4 h-4" />}
        accentColor="emerald"
        subtitle={plan.savingsRate.actualPercent !== null ? "Actual (savings + investments)" : "Projected (savings + investments)"}
      />
    </div>
  );
};

export default ExecutiveSummaryCard;
