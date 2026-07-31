import React, { useState } from "react";
import { useLoans, useEmiSchedule, useMarkEmiPaid } from "../../hooks/useFinanceQueries";
import { formatCurrency } from "../../utils/formatters";
import { Loan, EmiSchedule, Money } from "../../types";
import { Plus, CheckCircle2, Clock, Calendar, AlertTriangle, RefreshCw } from "lucide-react";
import { AddLoanModal } from "./components/AddLoanModal";

function calcEmi(principal: number, annualRate: number, tenureMonths: number): number {
  if (!principal || !tenureMonths || tenureMonths <= 0) return 0;
  if (!annualRate || annualRate <= 0) return principal / tenureMonths;
  const monthlyRate = annualRate / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

export const LoansView: React.FC = () => {
  const { data: loansResponse = [], isLoading, isError, error, refetch } = useLoans();
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loans: Loan[] = Array.isArray(loansResponse)
    ? loansResponse
    : (loansResponse as unknown as { data: Loan[] })?.data || [];
  const currentLoanId = selectedLoanId || loans[0]?.id || "";
  const selectedLoan = loans.find((l: Loan) => l.id === currentLoanId) || loans[0];
  const { data: scheduleResponse = [], isLoading: isLoadingSchedule } = useEmiSchedule(currentLoanId);
  const emiSchedule: EmiSchedule[] = Array.isArray(scheduleResponse)
    ? scheduleResponse
    : (scheduleResponse as unknown as { data: EmiSchedule[] })?.data || [];
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

  const selObj = (selectedLoan as unknown as Record<string, unknown>) || {};
  const selOutstanding = selObj.outstandingBalance ?? selObj.principalAmount ?? selObj.balance;
  const selP = typeof selOutstanding === "number" ? selOutstanding : parseFloat(String((selOutstanding as Record<string, unknown>)?.amount || selOutstanding || "0"));
  const selR = typeof selectedLoan?.interestRate === "number" ? selectedLoan.interestRate : parseFloat(String(selectedLoan?.interestRate || "0"));
  const selRemTenure = selectedLoan?.remainingTenureMonths ?? selObj.tenureMonths ?? selObj.totalTenureMonths ?? 12;
  const selN = typeof selRemTenure === "number" ? selRemTenure : parseInt(String(selRemTenure || "12"), 10);
  const selComputedEmi = calcEmi(selP, selR, selN);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Loan & Mortgage Management</h2>
          <p className="text-xs text-slate-400">Track liabilities, principal repayments & automated EMI payment schedules</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" /> Add Loan
        </button>
      </div>

      {loans.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-200">No Active Loans</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You currently have no active liabilities or mortgages recorded in your financial profile.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
          >
            Record New Loan
          </button>
        </div>
      ) : (
        <>
          {/* Loan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loans.map((loan: Loan) => {
              const isSelected = loan.id === currentLoanId;
              const loanObj = loan as unknown as Record<string, unknown>;
              const lender = loan.lenderName || (loanObj.type as string) || "Loan";
              const outstanding = loanObj.outstandingBalance ?? loanObj.principalAmount ?? loanObj.balance;
              const nextDue = loan.nextDueDate || (loanObj.startDate as string) || (loanObj.dueDate as string) || "—";
              const remainingTenure = loan.remainingTenureMonths ?? loanObj.tenureMonths ?? loanObj.totalTenureMonths ?? "—";

              const p = typeof outstanding === "number" ? outstanding : parseFloat(String((outstanding as Record<string, unknown>)?.amount || outstanding || "0"));
              const r = typeof loan.interestRate === "number" ? loan.interestRate : parseFloat(String(loan.interestRate || "0"));
              const n = typeof remainingTenure === "number" ? remainingTenure : parseInt(String(remainingTenure || "12"), 10);
              const computedEmi = calcEmi(p, r, n);

              const rawEmi = loanObj.emiAmount ?? loanObj.monthlyEmi;
              const parsedRawEmi = typeof rawEmi === "number" ? rawEmi : parseFloat(String((rawEmi as Record<string, unknown>)?.amount || rawEmi || "0"));
              const displayEmi = parsedRawEmi > 0 ? (rawEmi as unknown as string | Money) : computedEmi > 0 ? computedEmi.toFixed(2) : "0";

              return (
                <div
                  key={loan.id}
                  onClick={() => setSelectedLoanId(loan.id)}
                  className={`p-6 rounded-3xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-slate-900 border-2 border-indigo-500 shadow-xl shadow-indigo-500/10"
                      : "bg-slate-900/60 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-slate-100">{lender}</h3>
                      <p className="text-xs text-slate-400">{loan.name || "Mortgage Account"}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {loan.interestRate}% APR
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Outstanding Balance</p>
                      <p className="text-xl font-extrabold text-slate-100 mt-1">{formatCurrency(loan.outstandingBalance)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Monthly EMI</p>
                      <p className="text-xl font-extrabold text-emerald-400 mt-1">
                        {formatCurrency(displayEmi)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80 text-xs text-slate-400">
                    <span>Next Due: <strong className="text-slate-200 font-semibold">{nextDue}</strong></span>
                    <span>Remaining: <strong className="text-slate-200 font-semibold">{remainingTenure} months</strong></span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* EMI Amortization Schedule */}
          {selectedLoan && (
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-100">Amortization Schedule</h3>
                  <p className="text-xs text-slate-400">EMI payment history & installment schedule for selected loan</p>
                </div>
              </div>

              {isLoadingSchedule ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-10 bg-slate-800/60 rounded-xl"></div>
                  <div className="h-10 bg-slate-800/60 rounded-xl"></div>
                  <div className="h-10 bg-slate-800/60 rounded-xl"></div>
                </div>
              ) : emiSchedule.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No EMI installments scheduled for this loan.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs text-slate-400 font-semibold">
                        <th className="p-4">Installment</th>
                        <th className="p-4">Due Date</th>
                        <th className="p-4">EMI Amount</th>
                        <th className="p-4">Principal</th>
                        <th className="p-4">Interest</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {emiSchedule.map((emi: EmiSchedule) => {
                        const isPaid = emi.status === "PAID";
                        const rawEmiAmt = emi.emiAmount;
                        const parsedEmiAmt = typeof rawEmiAmt === "number" ? rawEmiAmt : parseFloat(String((rawEmiAmt as unknown as { amount?: string })?.amount || rawEmiAmt || "0"));
                        const emiDisplayVal = parsedEmiAmt > 0 ? (rawEmiAmt as unknown as string | Money) : selComputedEmi.toFixed(2);

                        const rawInterest = emi.interestComponent;
                        const parsedInterest = typeof rawInterest === "number" ? rawInterest : parseFloat(String((rawInterest as unknown as { amount?: string })?.amount || rawInterest || "0"));
                        const interestDisplayVal = parsedInterest > 0 ? (rawInterest as unknown as string | Money) : (selP * (selR / 100 / 12)).toFixed(2);

                        const rawPrincipal = emi.principalComponent;
                        const parsedPrincipal = typeof rawPrincipal === "number" ? rawPrincipal : parseFloat(String((rawPrincipal as unknown as { amount?: string })?.amount || rawPrincipal || "0"));
                        const principalDisplayVal = parsedPrincipal > 0 ? (rawPrincipal as unknown as string | Money) : Math.max(0, parseFloat(String(emiDisplayVal)) - parseFloat(String(interestDisplayVal))).toFixed(2);

                        return (
                          <tr key={emi.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-4 font-mono text-xs font-bold text-slate-300">#{emi.installmentNo}</td>
                            <td className="p-4 text-xs font-medium text-slate-200">{emi.dueDate}</td>
                            <td className="p-4 font-bold text-slate-100">{formatCurrency(emiDisplayVal)}</td>
                            <td className="p-4 text-xs text-emerald-400 font-medium">
                              {formatCurrency(principalDisplayVal)}
                            </td>
                            <td className="p-4 text-xs text-rose-400 font-medium">
                              {formatCurrency(interestDisplayVal)}
                            </td>
                            <td className="p-4">
                              {isPaid ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <CheckCircle2 className="w-3 h-3" /> Paid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  <Clock className="w-3 h-3" /> Pending
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              {!isPaid && (
                                <button
                                  onClick={() => markPaidMutation.mutate({ loanId: selectedLoan.id, emiId: emi.id })}
                                  disabled={markPaidMutation.isPending}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all disabled:opacity-50"
                                >
                                  Mark Paid
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {isAddModalOpen && <AddLoanModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />}
    </div>
  );
};
