import React from "react";
import { Money } from "../../../../components/common/Money";
import { CashFlowAnalytics } from "../../types/insightsTypes";
import { InsightsEmptyState } from "../primitives/States";

interface Segment {
  id: string;
  label: string;
  value: number;
  /** Share of income, already clamped for rendering. */
  share: number;
  fill: string;
  text: string;
}

/**
 * Where the money went, as one proportional bar.
 *
 * This replaces nothing — the workspace had no answer to "of what came in, how
 * much stayed?" that didn't require reading a bar chart's two series against
 * each other and doing the subtraction. Here the whole bar *is* income, and what
 * fills it is where that income went.
 *
 * Three things it refuses to do:
 *
 * - **Disagree with the metric above it.** "Kept" is the backend's own net
 *   figure whenever the snapshot reports one, so this bar and the Net cash flow
 *   metric can never tell different stories. Only when the snapshot omits it
 *   does this fall back to the difference of two reported figures — the same
 *   single class of derivation `diffMoney` is allowed.
 * - **Hide an overspend.** When expenses exceed income the bar doesn't clamp
 *   into a tidy full green; the overspend renders as its own segment past the
 *   income line, which is the shape of the actual problem.
 * - **Leak amounts.** Every figure renders through `<Money>`, and the widths —
 *   which are ratios, not balances — are what remain visible under privacy mode.
 */
export const MoneyFlow: React.FC<{ cashFlow: CashFlowAnalytics }> = ({ cashFlow }) => {
  const income = Number(cashFlow.totalIncome?.amount ?? 0);
  const expenses = Number(cashFlow.totalExpenses?.amount ?? 0);
  const net = cashFlow.netCashFlow ? Number(cashFlow.netCashFlow.amount) : null;

  if (!Number.isFinite(income) || income <= 0) {
    return (
      <InsightsEmptyState
        reason="no-data"
        title="No income recorded for this period"
        message="The flow from income to savings needs a recorded income figure for the period."
      />
    );
  }

  const spentWithinIncome = Math.min(expenses, income);
  const overspend = Math.max(0, expenses - income);
  const kept = net !== null && net > 0 ? Math.min(net, income) : Math.max(0, income - expenses);
  const currency = cashFlow.totalIncome?.currency ?? "INR";
  const asMoney = (value: number) => ({ amount: String(value), currency });

  // Widths are shares of the wider of income and expenses, so an overspend is
  // visibly *past* the income line rather than silently rescaled to fit.
  const scale = Math.max(income, expenses);
  const segments: Segment[] = [
    {
      id: "spent",
      label: "Spent",
      value: spentWithinIncome,
      share: (spentWithinIncome / scale) * 100,
      fill: "bg-rose-500/70",
      text: "text-rose-300",
    },
    ...(kept > 0
      ? [
          {
            id: "kept",
            label: "Kept",
            value: kept,
            share: (kept / scale) * 100,
            fill: "bg-emerald-500/70",
            text: "text-emerald-300",
          },
        ]
      : []),
    ...(overspend > 0
      ? [
          {
            id: "overspend",
            label: "Beyond income",
            value: overspend,
            share: (overspend / scale) * 100,
            fill: "bg-rose-500/40 [background-image:repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,0.12)_4px,rgba(255,255,255,0.12)_8px)]",
            text: "text-rose-300",
          },
        ]
      : []),
  ];

  const percentOfIncome = Math.round((expenses / income) * 100);

  /**
   * The figure list states *total* spending, not the bar's clamped first
   * segment. Visual QA caught the earlier version listing "Income ₹2,68,315"
   * beside "Spent ₹2,68,315" on a period where ₹4,55,637 was actually spent:
   * the segment widths are a drawing detail, and printing one of them under the
   * label "Spent" published a number that was simply not the amount spent.
   */
  const figures = [
    { id: "income", label: "Income", value: income, tone: "text-slate-100" },
    { id: "spent", label: "Spent", value: expenses, tone: "text-rose-300" },
    ...(kept > 0 ? [{ id: "kept", label: "Kept", value: kept, tone: "text-emerald-300" }] : []),
    ...(overspend > 0
      ? [{ id: "overspend", label: "Beyond income", value: overspend, tone: "text-rose-300" }]
      : []),
  ];

  const ratioText = (expenses / income).toFixed(2);

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-300">
        {overspend > 0 ? (
          <>
            You spent <span className="font-semibold tabular-nums text-rose-400">₹{ratioText}</span> for every <span className="font-semibold">₹1</span> earned this period (spending was <span className="font-semibold tabular-nums text-rose-300">{percentOfIncome}%</span> of income).
          </>
        ) : (
          <>
            You spent <span className="font-semibold tabular-nums text-slate-100">₹{ratioText}</span> for every <span className="font-semibold font-sans">₹1</span> earned this period (spending took <span className="font-semibold text-slate-100">{percentOfIncome}%</span> of income; the rest stayed).
          </>
        )}
      </p>

      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-slate-800"
        role="img"
        aria-label={
          overspend > 0
            ? `Spending was ${percentOfIncome} percent of income for this period, exceeding it.`
            : `Spending was ${percentOfIncome} percent of income for this period; the remainder was kept.`
        }
      >
        {segments.map((segment) => (
          <div
            key={segment.id}
            className={segment.fill}
            style={{ width: `${Math.max(segment.share, segment.value > 0 ? 2 : 0)}%` }}
          />
        ))}
      </div>

      <dl className="flex flex-wrap gap-x-6 gap-y-2">
        {figures.map((figure) => (
          <div key={figure.id} className="min-w-0">
            <dt className="text-[11px] text-slate-500">{figure.label}</dt>
            <dd className={`text-sm font-semibold tabular-nums ${figure.tone}`}>
              <Money value={asMoney(figure.value)} fractionDigits={0} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};
