import React from "react";
import { Info } from "lucide-react";
import { useDebtAnalytics } from "../../hooks/useInsightsQueries";
import { AnalyticsSection } from "../../components/common/AnalyticsSection";
import { AnalyticsKpi, AnalyticsKpiRow } from "../../components/common/AnalyticsKpi";
import { MetricValue } from "../../components/common/MetricValue";
import { BreakdownList } from "./BreakdownList";
import { useUIStore } from "../../../../store/useUIStore";

/**
 * Outstanding debt and its monthly load.
 *
 * The "Debt Payoff Strategy Engine" that used to sit here is gone. It ran a
 * 480-month amortisation loop in the browser against an "extra budget" it
 * invented as half of current EMI outflow, then presented the output as
 * "Debt free in N months" and "₹X interest saved" — figures with no backend
 * source, derived from a budget the user never stated, rendered with the same
 * authority as an account balance. Amortisation belongs to Loans & Debt, which
 * has the schedules; this section reports the position and links there.
 */
export const DebtSection: React.FC = () => {
  const debt = useDebtAnalytics();
  const navigateToRoute = useUIStore((s) => s.navigateToRoute);

  return (
    <AnalyticsSection
      title="Debt"
      description="What you owe, at what rate, and what it costs each month."
      result={debt}
      link={{ label: "Loans & Debt", onClick: () => navigateToRoute("loans") }}
      emptyTitle="No debt recorded"
      emptyMessage="Active loans and card balances appear here once they're tracked."
    >
      {(data) => {
        const totalDebtValue = Number(data.totalDebt.amount) || 0;
        return (
        <div className="space-y-6">
          <AnalyticsKpiRow columns={3}>
            <AnalyticsKpi label="Total debt" value={data.totalDebt} money upIsGood={false} />
            <AnalyticsKpi
              label="Monthly EMI"
              value={data.totalMonthlyEMI}
              money
              upIsGood={false}
              caption="Across loans reporting one"
            />
            <AnalyticsKpi
              label="Debt to income"
              value={data.debtToIncomeRatioPercent}
              suffix="%"
              upIsGood={false}
            />
          </AnalyticsKpiRow>

          {/*
            What the total is made of, before the loan detail. Without this the
            page states a total that its own rows don't add up to — the
            difference being card balances, which `getLoans` doesn't return and
            which usually carry the highest rate on the page.
          */}
          {data.composition.length > 0 && (
            <BreakdownList
              title="What you owe"
              items={data.composition.map((item) => ({
                category:
                  item.interestRatePercent !== null
                    ? `${item.name} · ${item.interestRatePercent}% p.a.`
                    : item.name,
                value: item.amount,
                percentage:
                  totalDebtValue > 0
                    ? (Number(item.amount.amount) / totalDebtValue) * 100
                    : null,
              }))}
              accent="#fb7185"
            />
          )}

          {data.debts.length === 0 ? (
            <p className="text-xs text-slate-500">
              A total is recorded, but no individual loans were returned.
            </p>
          ) : (
            <ul className="divide-y divide-slate-800/70">
              {data.debts.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-200">{item.name}</p>
                    <p className="truncate text-[11px] text-slate-500">
                      {[
                        item.type,
                        item.interestRatePercent !== null
                          ? `${item.interestRatePercent}% p.a.`
                          : null,
                        item.remainingTenureMonths !== null
                          ? `${item.remainingTenureMonths} months left`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium tabular-nums text-slate-100">
                      <MetricValue
                        value={item.principalOutstanding}
                        money
                        fractionDigits={0}
                        emptyClassName="text-xs font-normal text-slate-500"
                      />
                    </p>
                    <p className="text-[11px] tabular-nums text-slate-500">
                      <MetricValue value={item.monthlyEMI} money fractionDigits={0} /> / month
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <p className="flex items-start gap-2 rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
            <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              Payoff schedules, prepayment modelling and interest projections live in Loans & Debt,
              which holds the amortisation schedules these figures come from.
            </span>
          </p>
        </div>
        );
      }}
    </AnalyticsSection>
  );
};
