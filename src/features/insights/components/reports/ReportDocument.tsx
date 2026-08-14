import React from "react";
import { Money as MoneyType } from "../../../../types";
import { Money } from "../../../../components/common/Money";
import { NO_DATA_LABEL, healthStatus, shortPeriodLabel } from "../../utils/insightsFormat";
import { ReportRow } from "../../utils/reportExport";
import {
  useBudgetAnalytics,
  useCashFlowAnalytics,
  useDebtAnalytics,
  useFinancialHealth,
  useGoalAnalytics,
  useIncomeAnalytics,
  useInvestmentAnalytics,
  useIntelligenceFeed,
  useNetWorthAnalytics,
  useSpendingAnalytics,
  useSubscriptionAnalytics,
} from "../../hooks/useInsightsQueries";
import { InsightsEmptyState } from "../primitives/States";
import { ReportSectionId } from "./reportSections";

interface Line {
  metric: string;
  /** `null` renders as "Not enough data" — a report is the last place to imply a zero. */
  money?: MoneyType | null;
  text?: string | null;
  note?: string;
}

interface Block {
  id: ReportSectionId;
  title: string;
  lines: Line[];
}

/**
 * A report reads as a document, not as a dashboard that lost its colour.
 *
 * Definition lists, one figure per line, section headings in document order —
 * the shape of something you would hand to an accountant. Dumping the dashboard
 * cards into a print stylesheet was the obvious cheap option and it produces a
 * paper dashboard: eight rounded panels, four charts and no reading order.
 *
 * Every line is a figure a mapper already produced, so a report and the section
 * it summarises can never disagree. Absent figures print as "Not enough data"
 * for the same reason they do on screen.
 */
export const ReportDocument = React.forwardRef<
  HTMLDivElement,
  {
    title: string;
    sections: ReportSectionId[];
    periodLabel: string;
    onRowsChange?: (rows: ReportRow[]) => void;
  }
>(({ title, sections, periodLabel, onRowsChange }, ref) => {
  // Reports is the one page where fetching every domain is the point, so the
  // hooks run unconditionally and the selection decides what prints. They all
  // read the shared endpoint cache, so a section already visited costs nothing.
  const cashFlow = useCashFlowAnalytics();
  const spending = useSpendingAnalytics();
  const income = useIncomeAnalytics();
  const netWorth = useNetWorthAnalytics();
  const debt = useDebtAnalytics();
  const investments = useInvestmentAnalytics();
  const goals = useGoalAnalytics();
  const budget = useBudgetAnalytics();
  const subscriptions = useSubscriptionAnalytics();
  const health = useFinancialHealth();
  const feed = useIntelligenceFeed();

  const blocks: Block[] = [];

  if (sections.includes("cash-flow") && cashFlow.data) {
    blocks.push({
      id: "cash-flow",
      title: "Cash flow",
      lines: [
        { metric: "Income", money: cashFlow.data.totalIncome },
        { metric: "Expenses", money: cashFlow.data.totalExpenses },
        { metric: "Net cash flow", money: cashFlow.data.netCashFlow },
        {
          metric: "Savings rate",
          text:
            cashFlow.data.savingsRatePercent !== null
              ? `${cashFlow.data.savingsRatePercent.toFixed(1)}%`
              : null,
        },
        {
          metric: "Period",
          text: shortPeriodLabel(cashFlow.data.period) || cashFlow.data.period,
        },
      ],
    });
  }

  if (sections.includes("spending") && spending.data) {
    blocks.push({
      id: "spending",
      title: "Spending",
      lines: [
        { metric: "Total spent", money: spending.data.totalSpent },
        ...spending.data.categories.slice(0, 8).map((category) => ({
          metric: category.categoryName,
          money: category.amount,
          note: category.percentage !== null ? `${Math.round(category.percentage)}% of spend` : undefined,
        })),
      ],
    });
  }

  if (sections.includes("income") && income.data) {
    blocks.push({
      id: "income",
      title: "Income",
      lines: [
        { metric: "Income this period", money: income.data.totalIncomeThisPeriod },
        {
          metric: "Growth across window",
          text: income.data.growthPercent !== null ? `${income.data.growthPercent.toFixed(1)}%` : null,
        },
        ...income.data.sources.slice(0, 6).map((source) => ({
          metric: source.name,
          money: source.expectedAmount,
          note: source.frequency ?? undefined,
        })),
      ],
    });
  }

  if (sections.includes("net-worth") && netWorth.data) {
    blocks.push({
      id: "net-worth",
      title: "Net worth",
      lines: [
        { metric: "Net worth", money: netWorth.data.currentNetWorth },
        { metric: "Total assets", money: netWorth.data.totalAssets },
        { metric: "Total liabilities", money: netWorth.data.totalLiabilities },
        { metric: "Change vs previous snapshot", money: netWorth.data.periodChangeAmount },
        { metric: "Change across window", money: netWorth.data.windowChangeAmount },
      ],
    });
  }

  if (sections.includes("debt") && debt.data) {
    blocks.push({
      id: "debt",
      title: "Debt",
      lines: [
        { metric: "Total debt", money: debt.data.totalDebt },
        { metric: "Monthly EMI", money: debt.data.totalMonthlyEMI },
        {
          metric: "Debt-to-income",
          text:
            debt.data.debtToIncomeRatioPercent !== null
              ? `${debt.data.debtToIncomeRatioPercent.toFixed(1)}%`
              : null,
        },
        ...debt.data.debts.slice(0, 6).map((item) => ({
          metric: item.name,
          money: item.principalOutstanding,
          note: item.interestRatePercent !== null ? `${item.interestRatePercent}% p.a.` : undefined,
        })),
      ],
    });
  }

  if (sections.includes("investments") && investments.data) {
    blocks.push({
      id: "investments",
      title: "Investments",
      lines: [
        { metric: "Portfolio valuation", money: investments.data.totalValuation },
        { metric: "Unrealised gain", money: investments.data.totalGain },
        {
          metric: "Return",
          text:
            investments.data.totalGainPercent !== null
              ? `${investments.data.totalGainPercent.toFixed(1)}%`
              : null,
        },
        {
          metric: "XIRR",
          text: investments.data.xirrPercent !== null ? `${investments.data.xirrPercent.toFixed(1)}%` : null,
        },
      ],
    });
  }

  if (sections.includes("goals") && goals.data) {
    blocks.push({
      id: "goals",
      title: "Goals",
      lines: [
        { metric: "Goals tracked", text: String(goals.data.totalGoalsCount) },
        { metric: "On track", text: goals.data.onTrackCount !== null ? String(goals.data.onTrackCount) : null },
        { metric: "Behind", text: goals.data.behindCount !== null ? String(goals.data.behindCount) : null },
        ...goals.data.goals.slice(0, 6).map((goal) => ({
          metric: goal.name,
          money: goal.currentAmount,
          note:
            goal.progressPercent !== null
              ? `${Math.round(goal.progressPercent)}% of target`
              : undefined,
        })),
      ],
    });
  }

  if (sections.includes("budget") && budget.data) {
    blocks.push({
      id: "budget",
      title: "Budget",
      lines: [
        { metric: "Budgeted", money: budget.data.totalBudgeted },
        { metric: "Spent", money: budget.data.totalSpent },
        {
          metric: "Utilisation",
          text:
            budget.data.overallPercentUsed !== null
              ? `${budget.data.overallPercentUsed.toFixed(1)}%`
              : null,
        },
        ...budget.data.budgets.slice(0, 6).map((item) => ({
          metric: item.name,
          money: item.spentAmount,
          // An unmeasured budget says so in the report too, rather than printing
          // "0% of unknown limit" as though it were an observation.
          note:
            item.percentUsed === null
              ? "spend not reported"
              : `${Math.round(item.percentUsed)}% of limit`,
        })),
      ],
    });
  }

  if (sections.includes("subscriptions") && subscriptions.data) {
    blocks.push({
      id: "subscriptions",
      title: "Subscriptions",
      lines: [
        { metric: "Monthly recurring cost", money: subscriptions.data.totalMonthlyCost },
        { metric: "Active subscriptions", text: String(subscriptions.data.totalSubscriptionsCount) },
        ...subscriptions.data.subscriptions.slice(0, 8).map((item) => ({
          metric: item.name,
          money: item.amount,
          note: item.billingCycle ?? undefined,
        })),
      ],
    });
  }

  if (sections.includes("health") && health.data) {
    blocks.push({
      id: "health",
      title: "Financial health",
      lines: [
        { metric: "Overall score", text: `${health.data.overallScore} / 100` },
        { metric: "Rating", text: healthStatus(health.data.rating).label },
        ...health.data.dimensions.map((dimension) => ({
          metric: dimension.label,
          text: dimension.score !== null ? `${dimension.score} / 100` : null,
        })),
      ],
    });
  }

  if (sections.includes("intelligence") && feed.data) {
    blocks.push({
      id: "intelligence",
      title: "Key findings",
      lines: feed.data.slice(0, 8).map((item) => ({
        metric: item.title,
        money: item.financialImpact,
        note: item.category,
      })),
    });
  }

  // Kept in sync as a side effect of rendering, so the CSV is a serialisation of
  // exactly what the document shows — including its gaps.
  const rows: ReportRow[] = blocks.flatMap((block) =>
    block.lines.map((line) => ({
      section: block.title,
      metric: line.metric,
      value: line.money ? line.money.amount : (line.text ?? NO_DATA_LABEL),
      currency: line.money?.currency,
      note: line.note,
    })),
  );

  React.useEffect(() => {
    onRowsChange?.(rows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(rows)]);

  const isLoading = [cashFlow, netWorth, health].some((result) => result.isLoading);

  return (
    <div ref={ref} className="space-y-8 bg-slate-950/20 px-5 py-6 sm:px-8 sm:py-8">
      <header className="space-y-1 border-b border-slate-800 pb-4">
        <h2 className="text-lg font-semibold tracking-tight text-slate-50">{title}</h2>
        <p className="text-xs text-slate-500">
          {periodLabel} · prepared {new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}
        </p>
      </header>

      {isLoading ? (
        <p className="text-sm text-slate-500">Gathering your figures…</p>
      ) : blocks.length === 0 ? (
        <InsightsEmptyState
          reason="no-data"
          title="Nothing to report yet"
          message="None of the selected sections has data for this account."
        />
      ) : (
        blocks.map((block) => (
          <section key={block.id} className="space-y-2 break-inside-avoid">
            <h3 className="text-sm font-semibold tracking-tight text-slate-100">{block.title}</h3>
            <dl className="divide-y divide-slate-800/60">
              {block.lines.map((line, index) => (
                <div
                  key={`${block.id}-${line.metric}-${index}`}
                  className="flex items-baseline justify-between gap-4 py-1.5"
                >
                  <dt className="min-w-0 text-xs text-slate-400">
                    {line.metric}
                    {line.note && <span className="text-slate-600"> · {line.note}</span>}
                  </dt>
                  <dd className="shrink-0 text-sm font-medium tabular-nums text-slate-100">
                    {line.money ? (
                      <Money value={line.money} fractionDigits={0} />
                    ) : line.text ? (
                      line.text
                    ) : (
                      <span className="text-xs font-normal text-slate-500">{NO_DATA_LABEL}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))
      )}

      <footer className="border-t border-slate-800 pt-3 text-[11px] leading-relaxed text-slate-500">
        Every figure is as reported by pFOS for this account. Blank figures are reported as "not
        enough data" rather than as zero. Amounts in non-base currencies are excluded from totals
        until FX conversion is available.
      </footer>
    </div>
  );
});

ReportDocument.displayName = "ReportDocument";
