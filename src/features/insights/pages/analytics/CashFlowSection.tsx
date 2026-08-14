import React from "react";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { useCashFlowAnalytics } from "../../hooks/useInsightsQueries";
import { AnalyticsSection } from "../../components/common/AnalyticsSection";
import { FinancialMetric, MetricRow } from "../../components/primitives/FinancialMetric";
import { ChartFrame, ChartLegendItem, MoneyTooltip } from "../../components/charts/ChartFrame";
import { CHART_AXIS, CHART_GRID, useCompactMoneyAxis } from "../../components/charts/chartConfig";
import { ChartSkeleton, InsightsEmptyState } from "../../components/primitives/States";
import { Money } from "../../../../components/common/Money";
import { shortPeriodLabel } from "../../utils/insightsFormat";
import { CashFlowAnalytics } from "../../types/insightsTypes";
import { useUIStore } from "../../../../store/useUIStore";

/**
 * Cash flow: what came in, what went out, and what was left.
 *
 * Restructured around a single primary figure. The previous layout gave income,
 * expenses, net and savings rate four identical cards of equal weight, which
 * left the reader to work out which one was the answer — and the answer, for a
 * page called Cash flow, is the net figure. It leads; the other three explain it.
 *
 * The chart states its headline in a visible sentence before it draws anything.
 * A reader who takes nothing from the plot still leaves with the finding, and
 * screen-reader users get the same sentence rather than an `<svg>`.
 */
export const CashFlowSection: React.FC = () => {
  const cashFlow = useCashFlowAnalytics();
  const navigateToRoute = useUIStore((s) => s.navigateToRoute);

  return (
    <div className="space-y-5">
      <AnalyticsSection
        title="Cash flow"
        description="What came in, what went out, and what was left."
        result={cashFlow}
        link={{ label: "Transactions", onClick: () => navigateToRoute("transactions") }}
        emptyTitle="No cash-flow snapshot yet"
        emptyMessage="Cash flow is computed from recorded income and expenses. Import a statement or add transactions to begin."
        emptyAction={{ label: "Import statement", onClick: () => navigateToRoute("imports") }}
      >
        {(data) => (
          <div className="space-y-5">
            <FinancialMetric
              label={`Net cash flow · ${shortPeriodLabel(data.period)}`}
              value={data.netCashFlow}
              money
              size="lg"
              tone={
                data.netCashFlow && Number(data.netCashFlow.amount) < 0 ? "negative" : undefined
              }
              change={
                data.savingsRateChangePoints !== null
                  ? {
                      points: data.savingsRateChangePoints,
                      upIsGood: true,
                      caption: "savings rate vs previous period",
                    }
                  : null
              }
            />

            <div className="border-t border-slate-800/70 pt-4">
              <MetricRow columns={3}>
                <FinancialMetric label="Income" value={data.totalIncome} money />
                <FinancialMetric label="Expenses" value={data.totalExpenses} money />
                <FinancialMetric
                  label="Savings rate"
                  value={data.savingsRatePercent}
                  suffix="%"
                  tone={
                    data.savingsRatePercent !== null && data.savingsRatePercent < 0
                      ? "negative"
                      : undefined
                  }
                />
              </MetricRow>
            </div>
          </div>
        )}
      </AnalyticsSection>

      <AnalyticsSection
        title="Month by month"
        description="Income against expenses across the selected window."
        result={cashFlow}
        skeleton={<ChartSkeleton height={240} />}
        emptyReason="insufficient-history"
      >
        {(data) => <CashFlowHistory data={data} />}
      </AnalyticsSection>

      <AnalyticsSection
        title="Largest contributors"
        description="The biggest single source on each side of the ledger this period."
        result={cashFlow}
      >
        {(data) =>
          !data.largestIncomeSource && !data.largestExpenseCategory ? (
            <InsightsEmptyState
              reason="no-data"
              title="No breakdown for this period"
              message="The snapshot carried no category breakdown, and no income source is recorded."
            />
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              {data.largestIncomeSource && (
                <div className="min-w-0">
                  <dt className="text-[11px] text-slate-500">Largest income source</dt>
                  <dd className="mt-0.5 space-y-0.5">
                    <p className="truncate text-sm text-slate-200">
                      {data.largestIncomeSource.name}
                    </p>
                    <p className="text-base font-semibold tabular-nums text-emerald-400">
                      <Money value={data.largestIncomeSource.amount} fractionDigits={0} />
                    </p>
                  </dd>
                </div>
              )}
              {data.largestExpenseCategory && (
                <div className="min-w-0">
                  <dt className="text-[11px] text-slate-500">Largest expense category</dt>
                  <dd className="mt-0.5 space-y-0.5">
                    <p className="truncate text-sm text-slate-200">
                      {data.largestExpenseCategory.name}
                    </p>
                    <p className="text-base font-semibold tabular-nums text-rose-400">
                      <Money value={data.largestExpenseCategory.amount} fractionDigits={0} />
                    </p>
                  </dd>
                </div>
              )}
            </dl>
          )
        }
      </AnalyticsSection>
    </div>
  );
};

// ---------------------------------------------------------------------------

const CashFlowHistory: React.FC<{ data: CashFlowAnalytics }> = ({ data }) => {
  const formatAxis = useCompactMoneyAxis();

  if (data.history.length < 2) {
    return (
      <InsightsEmptyState
        reason="insufficient-history"
        message="Charting income against expenses needs at least two recorded periods."
      />
    );
  }

  const latest = data.history[data.history.length - 1];
  const surplusMonths = data.history.filter((point) => point.netCashFlow > 0).length;
  const headline =
    surplusMonths === data.history.length
      ? `Every one of the last ${data.history.length} periods ended in surplus.`
      : surplusMonths === 0
        ? `None of the last ${data.history.length} periods ended in surplus.`
        : `${surplusMonths} of the last ${data.history.length} periods ended in surplus; ${
            data.history.length - surplusMonths
          } did not.`;

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-300">{headline}</p>

      <ChartFrame
        height={240}
        description={`${headline} Income and expenses by period, ending ${shortPeriodLabel(latest.month)}.`}
        legend={
          <>
            <ChartLegendItem color="#34d399" label="Income" />
            <ChartLegendItem color="#fb7185" label="Expenses" />
          </>
        }
      >
        <BarChart data={data.history} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid {...CHART_GRID} />
          <XAxis dataKey="month" {...CHART_AXIS} tickFormatter={shortPeriodLabel} minTickGap={12} />
          <YAxis {...CHART_AXIS} tickFormatter={formatAxis} width={56} />
          <Tooltip
            cursor={{ fill: "rgba(148,163,184,0.06)" }}
            content={
              <MoneyTooltip
                currency={data.totalIncome?.currency}
                labelFormatter={shortPeriodLabel}
              />
            }
          />
          <Bar dataKey="income" name="Income" fill="#34d399" radius={[3, 3, 0, 0]} />
          <Bar dataKey="expenses" name="Expenses" fill="#fb7185" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ChartFrame>
    </div>
  );
};
