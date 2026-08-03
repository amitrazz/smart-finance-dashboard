import React, { useState } from "react";
import { Settings, CheckCircle2, ShieldAlert, CreditCard as CreditCardIcon, Edit2, Trash2 } from "lucide-react";
import { useCreditCard, useDeleteCreditCard } from "../hooks/useCreditCardQueries";
import { CreditCard } from "../../../types";
import { ConfirmModal } from "../../../components/common/ConfirmModal";

interface CardSettingsTabProps {
  cardId: string;
  onEditCard: (card: CreditCard) => void;
}

export const CardSettingsTab: React.FC<CardSettingsTabProps> = ({ cardId, onEditCard }) => {
  const { data: card } = useCreditCard(cardId);
  const deleteCardMutation = useDeleteCreditCard();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!card) return null;

  const handleConfirmDelete = () => {
    deleteCardMutation.mutate({ id: card.id, version: card.version || 1 }, {
      onSuccess: () => setIsDeleting(false)
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
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-6 rounded-3xl bg-rose-950/20 border border-rose-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-400" /> Danger Zone
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Permanently remove this credit card and all associated statement histories.
            </p>
          </div>
          <button
            onClick={() => setIsDeleting(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-lg shadow-rose-600/20"
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
    </div>
  );
};
