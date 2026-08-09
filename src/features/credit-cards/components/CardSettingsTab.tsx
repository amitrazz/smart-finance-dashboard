import React, { useState } from "react";
import { Settings, CheckCircle2, ShieldAlert, CreditCard as CreditCardIcon, Edit2, Trash2, TrendingUp, Lock, History } from "lucide-react";
import { useCreditCard, useDeleteCreditCard, useCloseCreditCard, useCreditCardLimitHistory } from "../hooks/useCreditCardQueries";
import { CreditCard } from "../../../types";
import { ConfirmModal } from "../../../components/common/ConfirmModal";
import { ChangeLimitModal } from "./ChangeLimitModal";
import { formatCurrency, formatDate } from "../../../utils/formatters";

interface CardSettingsTabProps {
  cardId: string;
  onEditCard: (card: CreditCard) => void;
}

const getVal = (val: unknown): number => {
  if (typeof val === "object" && val !== null) return parseFloat((val as { amount?: string }).amount || "0");
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val) || 0;
  return 0;
};

export const CardSettingsTab: React.FC<CardSettingsTabProps> = ({ cardId, onEditCard }) => {
  const { data: card } = useCreditCard(cardId);
  const { data: limitHistory = [] } = useCreditCardLimitHistory(cardId);
  const deleteCardMutation = useDeleteCreditCard();
  const closeCardMutation = useCloseCreditCard();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isChangingLimit, setIsChangingLimit] = useState(false);

  if (!card) return null;

  const outstanding = getVal(card.currentOutstanding);
  const canClose = card.status === "ACTIVE" && outstanding === 0;

  const handleConfirmDelete = () => {
    deleteCardMutation.mutate({ id: card.id, version: card.version || 1 }, {
      onSuccess: () => setIsDeleting(false)
    });
  };

  const handleConfirmClose = () => {
    closeCardMutation.mutate({ id: card.id, version: card.version || 1 }, {
      onSuccess: () => setIsClosing(false)
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" /> Card Configurations & Controls
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage security locks, auto-debit payments, and billing schedule configurations.
            </p>
          </div>
          <button
            onClick={() => onEditCard(card)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/20"
          >
            <Edit2 className="w-4 h-4" /> Edit Configuration
          </button>
        </div>

        <div className="space-y-3 pt-2">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">Card Status</p>
                <p className="text-[11px] text-slate-400">Currently: {card.status || "ACTIVE"}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              {card.status || "ACTIVE"}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <CreditCardIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">Auto-Pay Repayment</p>
                <p className="text-[11px] text-slate-400">Automatically pay bill on due date</p>
              </div>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${card.autoPayEnabled ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-slate-400 bg-slate-800"}`}>
              {card.autoPayEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">Billing Cycle Day</p>
                <p className="text-[11px] text-slate-400">Statement cuts off on Day {card.billingCycleDay || 5} of every month</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-200">Day {card.billingCycleDay || 5}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">Credit Limit</p>
                <p className="text-[11px] text-slate-400">
                  {formatCurrency({ amount: getVal(card.creditLimit).toFixed(2), currency: card.currency || "INR" })}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsChangingLimit(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold border border-cyan-500/20 transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" /> Change Limit
            </button>
          </div>
        </div>
      </div>

      {/* Limit Change History */}
      {limitHistory.length > 0 && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" /> Credit Limit History
          </h3>
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Effective Date</th>
                  <th className="py-3 px-4 text-right">Old Limit</th>
                  <th className="py-3 px-4 text-right">New Limit</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {limitHistory.map((h) => (
                  <tr key={h.id}>
                    <td className="py-3 px-4 font-bold text-slate-100">{formatDate(h.effectiveDate)}</td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      {formatCurrency({ amount: getVal(h.oldLimit).toFixed(2), currency: card.currency || "INR" })}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-cyan-400">
                      {formatCurrency({ amount: getVal(h.newLimit).toFixed(2), currency: card.currency || "INR" })}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{h.reason || "—"}</td>
                    <td className="py-3 px-4">
                      {h.revertsAt && !h.revertedAt ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Reverts {formatDate(h.revertsAt)}
                        </span>
                      ) : h.revertedAt ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">Reverted</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Permanent
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="p-6 rounded-3xl bg-rose-950/20 border border-rose-500/20 space-y-4">
        <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-rose-400" /> Danger Zone
        </h3>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-400" /> Close Card
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {canClose
                ? "Mark this card as closed. Outstanding balance must be zero."
                : "Only available once outstanding balance is fully paid off, and no active EMIs/disputes/transfers remain."}
            </p>
          </div>
          <button
            onClick={() => setIsClosing(true)}
            disabled={!canClose}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs border border-amber-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Lock className="w-4 h-4" /> Close Card
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 pt-3 border-t border-rose-500/10">
          <div>
            <p className="text-xs font-bold text-slate-200">Delete Credit Card</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Permanently remove this credit card and all associated statement histories.
            </p>
          </div>
          <button
            onClick={() => setIsDeleting(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-lg shadow-rose-600/20 shrink-0"
          >
            <Trash2 className="w-4 h-4" /> Delete Credit Card
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleting}
        title="Delete Credit Card?"
        message={`Are you sure you want to delete credit card "${card.nickname}"? This action cannot be undone.`}
        confirmText="Delete Credit Card"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteCardMutation.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setIsDeleting(false)}
      />

      <ConfirmModal
        isOpen={isClosing}
        title="Close Credit Card?"
        message={`Are you sure you want to close credit card "${card.nickname}"? It will move to CLOSED status and can no longer be used for new spend.`}
        confirmText="Close Card"
        cancelText="Cancel"
        variant="danger"
        isLoading={closeCardMutation.isPending}
        onConfirm={handleConfirmClose}
        onClose={() => setIsClosing(false)}
      />

      <ChangeLimitModal card={card} isOpen={isChangingLimit} onClose={() => setIsChangingLimit(false)} />
    </div>
  );
};
