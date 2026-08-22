import React from "react";
import { formatCurrency } from "../../../../utils/formatters";
import { Money, MonthlyFinancialPlan } from "../../../../types";

interface PlanVsActualTableProps {
  plan: MonthlyFinancialPlan;
}

interface Row {
  label: string;
  planned: Money;
  actual?: Money;
  variance?: Money;
}

/** Spec §14 — the core monthly review: planned vs. actual vs. variance, built directly from the variance fields the backend already computed (income/fixedCommitments/debtCommitments/budget/savings/investments) — never recalculated here. */
export const PlanVsActualTable: React.FC<PlanVsActualTableProps> = ({ plan }) => {
  const rows: Row[] = [
    { label: "Income", planned: plan.income.planned, actual: plan.income.actual, variance: plan.income.variance },
    {
      label: "Fixed Commitments",
      planned: plan.fixedCommitments.planned,
      actual: plan.fixedCommitments.actual,
      variance: plan.fixedCommitments.variance,
    },
    // Unlike income/fixedCommitments/savings/investments, the backend's
    // top-level `budget` object carries no `variance` field — showing one
    // here would mean computing actual-minus-planned money arithmetic in
    // React, which this app never does. Flagged as a backend gap instead.
    {
      label: "Budget Spending",
      planned: plan.budget.allocated,
      actual: plan.budget.actual,
    },
    // The backend's debt-commitments projection carries no separate
    // "actually paid" figure (only what's due this month) — showing an
    // actual/variance here would be fabricated, not backend data.
    { label: "Debt", planned: plan.debtCommitments.total },
    { label: "Savings", planned: plan.savings.planned, actual: plan.savings.actual, variance: plan.savings.variance },
    {
      label: "Investments",
      planned: plan.investments.planned,
      actual: plan.investments.actual,
      variance: plan.investments.variance,
    },
  ];

  return (
    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
      <h3 className="text-sm font-bold text-slate-100">Plan vs. Actual</h3>
      <div className="rounded-2xl border border-slate-800 overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase bg-slate-950/40">
              <th scope="col" className="py-2.5 px-4">Category</th>
              <th scope="col" className="py-2.5 px-4 text-right">Planned</th>
              <th scope="col" className="py-2.5 px-4 text-right">Actual</th>
              <th scope="col" className="py-2.5 px-4 text-right">Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {rows.map((row) => {
              const varianceValue = row.variance ? parseFloat(row.variance.amount) : undefined;
              return (
                <tr key={row.label}>
                  <td className="py-3 px-4 font-semibold text-slate-100">{row.label}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{formatCurrency(row.planned)}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{row.actual ? formatCurrency(row.actual) : "—"}</td>
                  <td
                    className={`py-3 px-4 text-right font-semibold ${
                      varianceValue === undefined
                        ? "text-slate-500"
                        : varianceValue > 0
                          ? "text-rose-400"
                          : varianceValue < 0
                            ? "text-emerald-400"
                            : "text-slate-400"
                    }`}
                  >
                    {row.variance ? `${varianceValue! > 0 ? "+" : ""}${formatCurrency(row.variance)}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlanVsActualTable;
