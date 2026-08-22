import React from "react";
import { Landmark, CreditCard } from "lucide-react";
import { EmptyState } from "../../../../components/common/EmptyState";
import { formatCurrency, formatDate } from "../../../../utils/formatters";
import { MonthlyDebtCommitments } from "../../../../types";

interface DebtCommitmentsPanelProps {
  debtCommitments: MonthlyDebtCommitments;
  onNavigateLoans: () => void;
  onNavigateCreditCards: () => void;
}

/**
 * Spec §9 — principal and interest are always shown as visually distinct
 * figures, never merged into one "spending" number. A card purchase never
 * appears here at all (it's already counted in Fixed Commitments/Budget) —
 * only the statement's minimum-due/interest/fees do.
 */
export const DebtCommitmentsPanel: React.FC<DebtCommitmentsPanelProps> = ({
  debtCommitments,
  onNavigateLoans,
  onNavigateCreditCards,
}) => {
  const hasItems = debtCommitments.loanItems.length > 0 || debtCommitments.cardItems.length > 0;

  return (
    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
      <h3 className="text-sm font-bold text-slate-100">Debt Commitments</h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Debt Principal</p>
          <p className="text-lg font-extrabold text-slate-100">{formatCurrency(debtCommitments.principal)}</p>
        </div>
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Debt Interest</p>
          <p className="text-lg font-extrabold text-amber-400">{formatCurrency(debtCommitments.interest)}</p>
        </div>
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Minimum Payment</p>
          <p className="text-lg font-extrabold text-slate-100">{formatCurrency(debtCommitments.minimumPayments)}</p>
        </div>
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Total</p>
          <p className="text-lg font-extrabold text-rose-400">{formatCurrency(debtCommitments.total)}</p>
        </div>
      </div>

      {!hasItems ? (
        <EmptyState title="No Debt Due This Month" message="No loan installments or credit-card statements are due." />
      ) : (
        <div className="space-y-2">
          {debtCommitments.loanItems.map((loan) => (
            <button
              key={loan.loanId}
              onClick={onNavigateLoans}
              className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-left hover:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Landmark className="w-4 h-4 text-orange-400 shrink-0" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-100 truncate">{loan.loanName}</span>
                  <span className="block text-[11px] text-slate-500">Due {formatDate(loan.dueDate)}</span>
                </span>
              </span>
              <span className="text-right shrink-0">
                <span className="block text-sm font-bold text-slate-100">{formatCurrency(loan.total)}</span>
                <span className="block text-[11px] text-slate-500">
                  {formatCurrency(loan.principal)} principal + {formatCurrency(loan.interest)} interest
                </span>
              </span>
            </button>
          ))}
          {debtCommitments.cardItems.map((card) => (
            <button
              key={card.creditCardId}
              onClick={onNavigateCreditCards}
              className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-left hover:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
            >
              <span className="flex items-center gap-2 min-w-0">
                <CreditCard className="w-4 h-4 text-indigo-400 shrink-0" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-100 truncate">{card.cardNickname}</span>
                  <span className="block text-[11px] text-slate-500">Due {formatDate(card.dueDate)}</span>
                </span>
              </span>
              <span className="text-right shrink-0">
                <span className="block text-sm font-bold text-slate-100">Min {formatCurrency(card.minimumDue)}</span>
                <span className="block text-[11px] text-slate-500">
                  Interest {formatCurrency(card.interestCharged)}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DebtCommitmentsPanel;
