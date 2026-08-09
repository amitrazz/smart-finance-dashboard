import React, { useState } from "react";
import { ArrowLeftRight, RefreshCw, AlertTriangle, Plus, Wallet, Lock } from "lucide-react";
import { useBalanceTransfers, useCloseBalanceTransfer, useCreditCards } from "../hooks/useCreditCardQueries";
import { CreditCardBalanceTransfer } from "../../../types";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { CreateBalanceTransferModal } from "./CreateBalanceTransferModal";
import { PrepayBalanceTransferModal } from "./PrepayBalanceTransferModal";
import { ConfirmModal } from "../../../components/common/ConfirmModal";

interface BalanceTransfersTabProps {
  cardId: string;
}

const getVal = (val: unknown): number => {
  if (typeof val === "object" && val !== null) return parseFloat((val as { amount?: string }).amount || "0");
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val) || 0;
  return 0;
};

export const BalanceTransfersTab: React.FC<BalanceTransfersTabProps> = ({ cardId }) => {
  const { data: transfers = [], isLoading, isError, error, refetch } = useBalanceTransfers(cardId);
  const { data: cards = [] } = useCreditCards();
  const closeTransferMutation = useCloseBalanceTransfer();
  const [isCreating, setIsCreating] = useState(false);
  const [prepayingTransfer, setPrepayingTransfer] = useState<CreditCardBalanceTransfer | null>(null);
  const [closingTransfer, setClosingTransfer] = useState<CreditCardBalanceTransfer | null>(null);

  const cardNickname = (id: string) => cards.find((c) => c.id === id)?.nickname || id.slice(0, 8);

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
        <h3 className="text-base font-bold text-slate-100">Failed to Load Balance Transfers</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not retrieve balance transfer history."}
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

  const activeCount = transfers.filter((t) => t.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-cyan-400" /> Balance Transfers
          </h4>
          <p className="text-xs text-slate-400">
            {activeCount > 0 ? `${activeCount} active transfer(s) onto this card.` : "Move a balance from another card onto this one at a promo rate."}
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all shadow-lg shadow-cyan-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" /> New Transfer
        </button>
      </div>

      {transfers.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
          <ArrowLeftRight className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No Balance Transfers</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Transfers from other cards onto this one will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {transfers.map((t) => {
            const principal = getVal(t.principal);
            const remaining = getVal(t.remainingPrincipal);
            const pct = principal > 0 ? Math.min(100, Math.round(((principal - remaining) / principal) * 100)) : 0;
            const promoActive = new Date(t.promoRateExpiresAt) > new Date();

            return (
              <div key={t.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">From {cardNickname(t.sourceCreditCardId)}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t.promoRatePercent}% p.a. {promoActive ? `promo until ${formatDate(t.promoRateExpiresAt)}` : "(promo expired)"}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full font-bold text-[10px] border ${
                      t.status === "ACTIVE"
                        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-800/60">
                  <div>
                    <span className="text-slate-400">Original Principal</span>
                    <p className="font-extrabold text-slate-100 text-sm mt-0.5">
                      {formatCurrency({ amount: principal.toFixed(2), currency: "INR" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400">Remaining</span>
                    <p className="font-extrabold text-amber-400 text-sm mt-0.5">
                      {formatCurrency({ amount: remaining.toFixed(2), currency: "INR" })}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Paid Off</span>
                    <span className="text-emerald-400">{pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {t.status === "ACTIVE" && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setPrepayingTransfer(t)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold transition-colors"
                    >
                      <Wallet className="w-3 h-3" /> Prepay
                    </button>
                    <button
                      onClick={() => setClosingTransfer(t)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors"
                    >
                      <Lock className="w-3 h-3" /> Close
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CreateBalanceTransferModal cardId={cardId} isOpen={isCreating} onClose={() => setIsCreating(false)} />
      <PrepayBalanceTransferModal
        cardId={cardId}
        transfer={prepayingTransfer}
        isOpen={Boolean(prepayingTransfer)}
        onClose={() => setPrepayingTransfer(null)}
      />
      <ConfirmModal
        isOpen={Boolean(closingTransfer)}
        title="Close Balance Transfer?"
        message="Mark this balance transfer as closed. Use this once the remaining principal has been fully settled."
        confirmText="Close Transfer"
        cancelText="Cancel"
        variant="warning"
        isLoading={closeTransferMutation.isPending}
        onConfirm={() => {
          if (closingTransfer) {
            closeTransferMutation.mutate(
              { cardId, balanceTransferId: closingTransfer.id, version: closingTransfer.version || 1 },
              { onSuccess: () => setClosingTransfer(null) }
            );
          }
        }}
        onClose={() => setClosingTransfer(null)}
      />
    </div>
  );
};
