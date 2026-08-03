import React from "react";
import { Layers, RefreshCw, AlertTriangle } from "lucide-react";
import { useCardEmis } from "../hooks/useCreditCardQueries";
import { CreditCardEmi } from "../../../types";
import { formatCurrency } from "../../../utils/formatters";
import { useUIStore } from "../../../store/useUIStore";

interface CardEmisTabProps {
  cardId: string;
}

export const CardEmisTab: React.FC<CardEmisTabProps> = ({ cardId }) => {
  const { data: emis = [], isLoading, isError, error, refetch } = useCardEmis(cardId);
  const { showToast } = useUIStore();

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 bg-slate-900/60 rounded-3xl border border-slate-800" />
        <div className="h-44 bg-slate-900/60 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-100">Failed to Load Credit Card EMIs</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not retrieve EMI conversion plans."}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const getVal = (val: unknown): number => {
    if (val !== null && typeof val === "object" && "amount" in val) {
      return parseFloat(String((val as { amount?: unknown }).amount || "0")) || 0;
    }
    if (typeof val === "number") return val;
    if (typeof val === "string") return parseFloat(val) || 0;
    return 0;
  };

  const totalOriginalPrincipal = emis.reduce((sum, e) => sum + getVal(e.originalPrincipal || e.purchaseAmount), 0);
  const totalRemainingPrincipal = emis.reduce((sum, e) => sum + getVal(e.remainingPrincipal || e.outstandingPrincipal), 0);
  const totalMonthlyEmi = emis.reduce((sum, e) => sum + getVal(e.monthlyEmiAmount || e.monthlyEmi), 0);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Total Outstanding EMI Principal</p>
          <p className="text-2xl font-extrabold text-slate-100 mt-1">
            {formatCurrency({ amount: totalRemainingPrincipal.toFixed(2), currency: "INR" })}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Original Total: {formatCurrency({ amount: totalOriginalPrincipal.toFixed(2), currency: "INR" })}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Monthly EMI Commitment</p>
          <p className="text-2xl font-extrabold text-indigo-400 mt-1">
            {formatCurrency({ amount: totalMonthlyEmi.toFixed(2), currency: "INR" })}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Active Installment Plans</p>
          <p className="text-2xl font-extrabold text-slate-100 mt-1">{emis.length}</p>
        </div>
      </div>

      {/* EMI Conversion Banner */}
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-200">Convert Large Transactions into EMIs</h4>
          <p className="text-xs text-slate-400">
            Convert eligible purchases above ₹2,500 into low-interest flexible monthly EMIs.
          </p>
        </div>
        <button
          onClick={() => showToast("EMI Conversion API Ready - Select an eligible transaction from the Transactions tab.", "info")}
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-all shrink-0"
        >
          + Convert to EMI
        </button>
      </div>

      {/* EMI Cards List */}
      {emis.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
          <Layers className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No Active EMI Plans</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You do not have any active installment plans running on this credit card.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {emis.map((emi: CreditCardEmi) => {
            const totalTenure = emi.totalTenureMonths || emi.totalInstallments || 1;
            const remainingTenure = emi.remainingTenureMonths || emi.remainingInstallments || 0;
            const paidInst = emi.completedInstallments ?? (totalTenure - remainingTenure);
            const pct = Math.min(Math.round((paidInst / Math.max(1, totalTenure)) * 100), 100);

            return (
              <div key={emi.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">{emi.merchantName || emi.merchant}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{emi.originalTransactionDescription || emi.merchant}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-bold text-xs border border-indigo-500/20">
                    {emi.annualInterestRatePercent || emi.interestRate}% p.a.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-800/60">
                  <div>
                    <span className="text-slate-400">Monthly EMI</span>
                    <p className="font-extrabold text-slate-100 text-sm mt-0.5">{formatCurrency(emi.monthlyEmiAmount || emi.monthlyEmi)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400">Remaining Balance</span>
                    <p className="font-extrabold text-amber-400 text-sm mt-0.5">{formatCurrency(emi.remainingPrincipal || emi.outstandingPrincipal)}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">
                      Installment {paidInst} of {totalTenure}
                    </span>
                    <span className="text-emerald-400">{pct}% Paid</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                  <span>Next Due: {emi.nextDueDate}</span>
                  <span>End: {emi.expectedEndDate || "—"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
