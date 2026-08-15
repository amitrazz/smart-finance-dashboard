import React from "react";
import { PiggyBank, Wallet, TrendingUp, Landmark } from "lucide-react";
import { formatCurrency } from "../../../utils/formatters";
import { Money as MoneyDisplay } from "../../../components/common/Money";
import { PRODUCT_TYPE_CONFIG } from "../constants/productTypes";
import { useRetirementSummary } from "../hooks/useRetirementQueries";
import { useNetWorth } from "../../../hooks/useFinanceQueries";
import { EmptyState } from "../../../components/common/EmptyState";

interface RetirementOverviewProps {
  onAddAccount: () => void;
}

export const RetirementOverview: React.FC<RetirementOverviewProps> = ({ onAddAccount }) => {
  const { data: summary, isLoading, isError, refetch } = useRetirementSummary();
  const { data: netWorth } = useNetWorth();

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 rounded-3xl bg-slate-900/60 border border-slate-800" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="p-8 rounded-3xl bg-rose-500/5 border border-rose-500/20 text-center space-y-3">
        <p className="text-sm text-rose-400 font-semibold">Failed to load retirement summary.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  const hasAccounts = summary.byProductType.length > 0;
  // No cross-currency sum exists by design (no FX conversion path on the
  // backend) — when the user only has one currency, this still renders a
  // clean single headline figure; with multiple currencies it lists each
  // total separately rather than fabricating a blended number.
  const singleCurrencyTotal = summary.totalCorpus.length === 1 ? summary.totalCorpus[0] : null;

  const retirementShareOfNetWorth =
    netWorth && parseFloat(netWorth.netWorth.amount) > 0
      ? (parseFloat(netWorth.breakdown.retirement) / parseFloat(netWorth.netWorth.amount)) * 100
      : null;

  if (!hasAccounts) {
    return (
      <EmptyState
        icon={<PiggyBank className="w-8 h-8" aria-hidden="true" />}
        title="No retirement accounts yet"
        message="Add your EPF, PPF, NPS, or VPF account to track your retirement corpus."
        actionLabel="Add Retirement Account"
        actionIcon={<PiggyBank className="w-4 h-4" />}
        onAction={onAddAccount}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Corpus Hero */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-violet-950/60 to-slate-900 border border-violet-500/20 shadow-2xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-extrabold text-violet-400 uppercase tracking-widest">
          <PiggyBank className="w-3.5 h-3.5" /> Retirement Corpus
        </div>
        {singleCurrencyTotal ? (
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            <MoneyDisplay value={{ amount: singleCurrencyTotal.totalBalance, currency: singleCurrencyTotal.currency }} />
          </h2>
        ) : (
          <div className="flex flex-wrap gap-4">
            {summary.totalCorpus.map((t) => (
              <h2 key={t.currency} className="text-2xl font-extrabold text-white tracking-tight">
                <MoneyDisplay value={{ amount: t.totalBalance, currency: t.currency }} />
              </h2>
            ))}
          </div>
        )}
        {retirementShareOfNetWorth !== null && (
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
            {retirementShareOfNetWorth.toFixed(1)}% of your net worth
          </p>
        )}
        <p className="text-xs text-slate-400 leading-relaxed">
          Kept separate from Market Investments — retirement accounts are balance-tracked (no lots or cost basis) and
          are never double-counted in your investment totals.
        </p>
      </div>

      {/* Per-product breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summary.byProductType.map((row) => {
          const cfg = PRODUCT_TYPE_CONFIG[row.productType];
          return (
            <div key={`${row.productType}-${row.currency}`} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <span
                className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border"
                style={{ backgroundColor: `${cfg.color}1a`, borderColor: `${cfg.color}40`, color: cfg.color }}
              >
                {cfg.shortLabel}
              </span>
              <p className="text-lg font-extrabold text-slate-100">
                {formatCurrency({ amount: row.totalBalance, currency: row.currency })}
              </p>
              <p className="text-[11px] text-slate-500">
                {row.accountCount} account{row.accountCount === 1 ? "" : "s"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Net worth context */}
      {netWorth && (
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Landmark className="w-4 h-4" /> Net Worth Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Cash</span>
              <span className="font-bold text-slate-200">{formatCurrency({ amount: netWorth.breakdown.liquidCash, currency: netWorth.netWorth.currency })}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Investments</span>
              <span className="font-bold text-slate-200">{formatCurrency({ amount: netWorth.breakdown.investments, currency: netWorth.netWorth.currency })}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <span className="text-violet-300 font-semibold flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" /> Retirement
              </span>
              <span className="font-bold text-violet-200">{formatCurrency({ amount: netWorth.breakdown.retirement, currency: netWorth.netWorth.currency })}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
