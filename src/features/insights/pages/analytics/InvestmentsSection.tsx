import React from "react";
import { useInvestmentAnalytics } from "../../hooks/useInsightsQueries";
import { AnalyticsSection } from "../../components/common/AnalyticsSection";
import { AnalyticsKpi, AnalyticsKpiRow } from "../../components/common/AnalyticsKpi";
import { BreakdownList } from "./BreakdownList";
import { directionOf, formatPercentDelta } from "../../utils/insightsFormat";
import { useUIStore } from "../../../../store/useUIStore";

/**
 * Portfolio valuation, return and allocation.
 *
 * Four KPI tiles were removed rather than restyled: Sharpe ratio, volatility,
 * allocation drift and CAGR. `/analytics/investment-returns` exposes none of
 * them, so the mapper hardcoded each to `0` and the page rendered "0 Sharpe",
 * "0% Drift" and a caption reading "Rebalancing alert active" — four risk
 * signals invented by a default value. What the endpoint does return is here.
 */
export const InvestmentsSection: React.FC = () => {
  const investments = useInvestmentAnalytics();
  const navigateToRoute = useUIStore((s) => s.navigateToRoute);

  return (
    <AnalyticsSection
      title="Investments"
      description="Valuation, unrealised return and allocation across your portfolios."
      result={investments}
      link={{ label: "Investments", onClick: () => navigateToRoute("investments") }}
      emptyTitle="No portfolios"
      emptyMessage="Add holdings under Investments and their returns will be reported here."
    >
      {(data) => (
        <div className="space-y-6">
          <AnalyticsKpiRow>
            <AnalyticsKpi label="Valuation" value={data.totalValuation} money />
            <AnalyticsKpi
              label="Unrealised gain"
              value={data.totalGain}
              money
              delta={formatPercentDelta(data.totalGainPercent)}
              direction={directionOf(data.totalGainPercent)}
            />
            <AnalyticsKpi
              label="XIRR"
              value={data.xirrPercent}
              suffix="%"
              caption={
                data.xirrPercent === null
                  ? "Not combinable across portfolios"
                  : "Money-weighted return"
              }
            />
            <AnalyticsKpi
              label="Asset classes"
              value={data.allocation.length > 0 ? data.allocation.length : null}
              precision={0}
            />
          </AnalyticsKpiRow>

          <div className="grid gap-6 lg:grid-cols-2">
            <BreakdownList
              title="Allocation"
              items={data.allocation.map((a) => ({
                category: a.label,
                value: a.value,
                percentage: a.percentage,
              }))}
              accent="#a78bfa"
              emptyMessage="Asset allocation isn't available for this account."
            />

            <div className="space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Return extremes
              </h3>
              {!data.bestHolding && !data.worstHolding ? (
                <p className="text-xs text-slate-500">
                  No holdings report a return percentage yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.bestHolding && (
                    <li className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Best</p>
                        <p className="truncate text-xs text-slate-200">
                          {data.bestHolding.name}
                          {data.bestHolding.symbol && (
                            <span className="text-slate-500"> · {data.bestHolding.symbol}</span>
                          )}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-medium tabular-nums text-emerald-400">
                        {formatPercentDelta(data.bestHolding.returnPercent)}
                      </span>
                    </li>
                  )}
                  {data.worstHolding && (
                    <li className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Worst</p>
                        <p className="truncate text-xs text-slate-200">
                          {data.worstHolding.name}
                          {data.worstHolding.symbol && (
                            <span className="text-slate-500"> · {data.worstHolding.symbol}</span>
                          )}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-sm font-medium tabular-nums ${
                          data.worstHolding.returnPercent < 0 ? "text-rose-400" : "text-slate-300"
                        }`}
                      >
                        {formatPercentDelta(data.worstHolding.returnPercent)}
                      </span>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </AnalyticsSection>
  );
};
