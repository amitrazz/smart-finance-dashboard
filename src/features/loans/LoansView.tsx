import React from "react";
import { useLoans, useEmiSchedule, useMarkEmiPaid } from "../../hooks/useFinanceQueries";
import { formatCurrency } from "../../utils/formatters";
import { Loan, EmiSchedule } from "../../types";
import { ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw, CreditCard } from "lucide-react";

export const LoansView: React.FC = () => {
  const { data: loans = [], isLoading, isError, error, refetch } = useLoans();
  const [selectedLoanId, setSelectedLoanId] = React.useState<string | null>(null);

  const currentLoanId = selectedLoanId || loans[0]?.id || "";
  const { data: emiSchedule = [], isLoading: isLoadingSchedule } = useEmiSchedule(currentLoanId);
  const markPaidMutation = useMarkEmiPaid();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-44 bg-slate-900/60 rounded-3xl border border-slate-800"></div>
          <div className="h-44 bg-slate-900/60 rounded-3xl border border-slate-800"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Failed to Load Loans</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not retrieve loan data from the server."}
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Loans & Debt Repayment Schedules</h2>
        <p className="text-xs text-slate-400">Unified liability view, interest rate tracking, and interactive EMI schedules</p>
      </div>

      {loans.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <CreditCard className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">No Active Loans Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You currently have no outstanding loan liabilities registered in your account.
          </p>
        </div>
      ) : (
        <>
          {/* Loan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loans.map((loan: Loan) => {
              const isSelected = loan.id === currentLoanId;
              return (
                <div
                  key={loan.id}
                  onClick={() => setSelectedLoanId(loan.id)}
                  className={`p-6 rounded-3xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-slate-900 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/5"
                      : "bg-slate-900/60 border border-slate-800 hover:border-slate-700"
                  } space-y-4`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-slate-100">{loan.name}</h3>
                      <p className="text-xs text-slate-400">
                        {loan.lenderName} • {loan.interestRate}% Interest Rate
                      </p>
                    </div>
                    <span className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
                      <ShieldAlert className="w-5 h-5" />
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-800 py-4">
                    <div>
                      <p className="text-xs text-slate-400">Outstanding Principal</p>
                      <p className="text-xl font-extrabold text-slate-100">{formatCurrency(loan.outstandingBalance)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Monthly EMI</p>
                      <p className="text-xl font-extrabold text-rose-400">{formatCurrency(loan.emiAmount)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Next Due: <strong className="text-slate-200">{loan.nextDueDate}</strong>
                    </span>
                    <span>
                      Tenure Remaining: <strong className="text-slate-200">{loan.remainingTenureMonths} months</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* EMI Repayment Schedule */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-slate-100">EMI Repayment Schedule & Amortization</h3>
            {isLoadingSchedule ? (
              <div className="py-8 text-center text-slate-400">Loading EMI Schedule...</div>
            ) : emiSchedule.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
                No EMI schedule entries available for this loan.
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-4">Installment #</th>
                      <th className="p-4">Due Date</th>
                      <th className="p-4">Total EMI</th>
                      <th className="p-4">Principal Component</th>
                      <th className="p-4">Interest Component</th>
                      <th className="p-4 text-right">Status & Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {emiSchedule.map((emi: EmiSchedule) => (
                      <tr key={emi.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-mono text-xs font-bold text-slate-300">#{emi.installmentNo}</td>
                        <td className="p-4 text-xs font-medium text-slate-200">{emi.dueDate}</td>
                        <td className="p-4 font-bold text-slate-100">{formatCurrency(emi.emiAmount)}</td>
                        <td className="p-4 text-xs text-emerald-400 font-medium">
                          {formatCurrency(emi.principalComponent)}
                        </td>
                        <td className="p-4 text-xs text-rose-400 font-medium">
                          {formatCurrency(emi.interestComponent)}
                        </td>
                        <td className="p-4 text-right">
                          {emi.status === "PAID" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" /> PAID
                            </span>
                          ) : (
                            <button
                              onClick={() => markPaidMutation.mutate({ loanId: currentLoanId, emiId: emi.id })}
                              disabled={markPaidMutation.isPending}
                              className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
                            >
                              Mark as Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
