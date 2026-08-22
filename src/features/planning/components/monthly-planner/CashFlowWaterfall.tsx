import React from "react";
import { ArrowDown, ArrowUp, Equal } from "lucide-react";
import { formatCurrency } from "../../../../utils/formatters";
import { Money, MonthlyCashFlowProjection } from "../../../../types";

interface CashFlowWaterfallProps {
  cashFlow?: MonthlyCashFlowProjection;
  fixedCommitmentsTotal?: Money;
  debtTotal?: Money;
  budgetActual?: Money;
  investmentsPlanned?: Money;
  savingsPlanned?: Money;
}

const OPENING_BASIS_LABEL: Record<MonthlyCashFlowProjection["openingCashBasis"], string> = {
  LIVE_BALANCE: "Live account balance",
  PROJECTED_FORWARD: "Projected from this month's plan",
  NOT_AVAILABLE: "Not available — no historical replay for past months",
};

/** Spec §7 — the month's cash trajectory in one vertical read. Every line uses a figure already present in the response; only the layout is new. */
export const CashFlowWaterfall: React.FC<CashFlowWaterfallProps> = ({
  cashFlow,
  fixedCommitmentsTotal,
  debtTotal,
  budgetActual,
  investmentsPlanned,
  savingsPlanned,
}) => {
  if (!cashFlow) {
    return (
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 text-sm text-slate-400">
        Cash-flow projection isn't available for this period.
      </div>
    );
  }

  const isClosingNegative = parseFloat(cashFlow.expectedClosingCash.amount) < 0;

  const rows: Array<{ label: string; value?: Money; icon: React.ReactNode }> = [
    { label: "Opening Cash", value: cashFlow.openingCash, icon: <Equal className="w-3.5 h-3.5" /> },
    { label: "Expected Income", value: cashFlow.expectedIncome, icon: <ArrowUp className="w-3.5 h-3.5 text-emerald-400" /> },
    { label: "Fixed Commitments", value: fixedCommitmentsTotal, icon: <ArrowDown className="w-3.5 h-3.5 text-rose-400" /> },
    { label: "Debt Payments", value: debtTotal, icon: <ArrowDown className="w-3.5 h-3.5 text-rose-400" /> },
    { label: "Budget Spending (reference)", value: budgetActual, icon: <ArrowDown className="w-3.5 h-3.5 text-slate-500" /> },
    { label: "Investments", value: investmentsPlanned, icon: <ArrowDown className="w-3.5 h-3.5 text-rose-400" /> },
    { label: "Savings", value: savingsPlanned, icon: <ArrowDown className="w-3.5 h-3.5 text-rose-400" /> },
  ];

  return (
    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-100">Cash Flow Projection</h3>
        <span className="text-[11px] text-slate-500">{OPENING_BASIS_LABEL[cashFlow.openingCashBasis]}</span>
      </div>

      <div className="space-y-1.5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between text-sm py-1.5 border-b border-slate-800/40 last:border-b-0"
          >
            <span className="flex items-center gap-2 text-slate-400">
              {row.icon}
              {row.label}
            </span>
            <span className="font-semibold text-slate-200">{row.value ? formatCurrency(row.value) : "—"}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-800 font-extrabold">
        <span className="text-slate-100">Expected Closing Cash</span>
        <span className={isClosingNegative ? "text-rose-400" : "text-emerald-400"}>
          {formatCurrency(cashFlow.expectedClosingCash)}
        </span>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">
        Budget spending is shown for reference only — it isn't added again on top of fixed commitments/debt/savings/investments,
        since those already reflect the same underlying transactions.
      </p>
    </div>
  );
};

export default CashFlowWaterfall;
