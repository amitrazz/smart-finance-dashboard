import React from "react";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { useCashFlowAnalytics } from "../../hooks/useInsightsQueries";
import { AnalyticsSection } from "../../components/common/AnalyticsSection";
import { AnalyticsKpi, AnalyticsKpiRow } from "../../components/common/AnalyticsKpi";
import { ChartFrame, ChartLegendItem, MoneyTooltip } from "../../components/charts/ChartFrame";
import { CHART_AXIS, CHART_GRID, useCompactMoneyAxis } from "../../components/charts/chartConfig";
import { EmptyAnalyticsState } from "../../components/common/AnalyticsStates";
import { Money } from "../../../../components/common/Money";
import { directionOf, formatPoints, shortPeriodLabel } from "../../utils/insightsFormat";
import { useUIStore } from "../../../../store/useUIStore";
import { ArrowDownLeft, ArrowUpRight, DollarSign, PiggyBank } from "lucide-react";

/** Income against expenses, month by month, with the period's headline figures. */
export const CashFlowSection: React.FC = () => {
  const cashFlow = useCashFlowAnalytics();
  const formatAxis = useCompactMoneyAxis();
  const navigateToRoute = useUIStore((s) => s.navigateToRoute);

  return (
    <AnalyticsSection
      title="Cash flow"
      description="What came in, what went out, and what was left."
      result={cashFlow}
      link={{ label: "Transactions", onClick: () => navigateToRoute("transactions") }}
      emptyTitle="No cash-flow snapshots"
      emptyMessage="Cash flow is computed from recorded income and expenses. Import or add transactions to begin."
    >
      {(data) => (
        <div className="space-y-6">
          <AnalyticsKpiRow>
            <AnalyticsKpi
              label="Income"
              value={data.totalIncome}
              money
              caption={data.period}
              accent="emerald"
              icon={<ArrowDownLeft className="h-6 w-6 text-emerald-400" aria-hidden="true" />}
            />
            <AnalyticsKpi
              label="Expenses"
              value={data.totalExpenses}
              money
              upIsGood={false}
              caption={data.period}
              accent="rose"
              icon={<ArrowUpRight className="h-6 w-6 text-rose-400" aria-hidden="true" />}
            />
            <AnalyticsKpi
              label="Net cash flow"
              value={data.netCashFlow}
              money
              accent="indigo"
              icon={<DollarSign className="h-6 w-6 text-indigo-400" aria-hidden="true" />}
            />
            <AnalyticsKpi
              label="Savings rate"
              value={data.savingsRatePercent}
              suffix="%"
              delta={formatPoints(data.savingsRateChangePoints)}
              direction={directionOf(data.savingsRateChangePoints)}
              accent="purple"
              icon={<PiggyBank className="h-6 w-6 text-purple-400" aria-hidden="true" />}
            />
          </AnalyticsKpiRow>

          {data.history.length >= 2 ? (
            <ChartFrame
              height={260}
              description={`Monthly income and expenses across ${data.history.length} periods, ending ${data.period}.`}
              legend={
                <>
                  <ChartLegendItem color="#34d399" label="Income" />
                  <ChartLegendItem color="#fb7185" label="Expenses" />
                </>
              }
            >
              <BarChart data={data.history} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid {...CHART_GRID} />
                <XAxis
                  dataKey="month"
                  {...CHART_AXIS}
                  tickFormatter={shortPeriodLabel}
                  minTickGap={12}
                />
                <YAxis {...CHART_AXIS} tickFormatter={formatAxis} width={56} />
                <Tooltip
                  cursor={{ fill: "rgba(148,163,184,0.06)" }}
                  content={
                    <MoneyTooltip
                      currency={data.totalIncome.currency}
                      labelFormatter={shortPeriodLabel}
                    />
                  }
                />
                <Bar dataKey="income" name="Income" fill="#34d399" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#fb7185" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartFrame>
          ) : (
            <EmptyAnalyticsState
              title="Not enough history to chart"
              message="Charting income against expenses needs at least two recorded periods."
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {data.largestIncomeSource && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Largest income source
                </p>
                <p className="mt-1 truncate text-sm text-slate-200">
                  {data.largestIncomeSource.name}
                </p>
                <p className="text-sm font-medium tabular-nums text-emerald-400">
                  <Money value={data.largestIncomeSource.amount} />
                </p>
              </div>
            )}
            {data.largestExpenseCategory && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Largest expense category
                </p>
                <p className="mt-1 truncate text-sm text-slate-200">
                  {data.largestExpenseCategory.name}
                </p>
                <p className="text-sm font-medium tabular-nums text-rose-400">
                  <Money value={data.largestExpenseCategory.amount} />
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </AnalyticsSection>
  );
};
