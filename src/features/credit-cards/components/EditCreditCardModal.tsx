import React, { useState, useEffect } from "react";
import { X, Check, CreditCard as CreditCardIcon, Wallet } from "lucide-react";
import { useUpdateCreditCard } from "../hooks/useCreditCardQueries";
import { useAccounts } from "../../../hooks/useFinanceQueries";
import { CreditCard, CardStatus, UpdateCreditCardInput, FinancialInstitution } from "../../../types";
import { InstitutionPicker } from "../../../components/common/InstitutionPicker";
import { AsyncSearchSelect } from "../../../components/common/AsyncSearchSelect";

interface EditCreditCardModalProps {
  card: CreditCard | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditCreditCardModal: React.FC<EditCreditCardModalProps> = ({ card, isOpen, onClose }) => {
  const updateCardMutation = useUpdateCreditCard();
  const [accountSearch, setAccountSearch] = useState("");
  const { data: accounts = [], isFetching: isAccountsFetching } = useAccounts({
    search: accountSearch || undefined,
    limit: 100,
  });
  const paymentAccountOptions = accounts.filter((a) => a.type !== "CREDIT_CARD" && a.type !== "LOAN");

  const [nickname, setNickname] = useState("");
  const [issuer, setIssuer] = useState("");
  const [institutionId, setInstitutionId] = useState<string | undefined>(undefined);
  const [lastFourDigits, setLastFourDigits] = useState("");
  const [interestRate, setInterestRate] = useState("42.0");
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const selectedPaymentAccount = paymentAccountOptions.find((a) => a.id === paymentAccountId);
  const [autoPayEnabled, setAutoPayEnabled] = useState(false);
  const [status, setStatus] = useState<CardStatus>("ACTIVE");
  const [rewardProgram, setRewardProgram] = useState("");
  const [rewardRatePoints, setRewardRatePoints] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (card) {
      setNickname(card.nickname || "");
      setIssuer(card.issuer || "");
      setInstitutionId(card.institutionId || undefined);
      setLastFourDigits(card.lastFourDigits || "");
      setInterestRate(String(card.interestRate || "42.0"));
      setPaymentAccountId(card.paymentAccountId || "");
      setAutoPayEnabled(Boolean(card.autoPayEnabled));
      setStatus((card.status as CardStatus) || "ACTIVE");
      setRewardProgram(card.rewardProgram || "");
      // Backend doesn't echo rewardRatePoints back in the read model (write-only), so this always starts blank.
      setRewardRatePoints("");
      setNotes(card.notes || "");
    }
  }, [card]);

  if (!isOpen || !card) return null;

  const handleInstitutionChange = (id: string | undefined, institution?: FinancialInstitution) => {
    setInstitutionId(id);
    if (institution?.name) setIssuer(institution.name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: UpdateCreditCardInput = {
      nickname,
      issuer,
      institutionId,
      lastFourDigits,
      interestRate,
      paymentAccountId: paymentAccountId || undefined,
      autoPayEnabled,
      rewardProgram: rewardProgram || undefined,
      rewardRatePoints: rewardRatePoints || undefined,
      notes: notes || undefined,
    };

    // Only send status if changed and valid according to backend DTO schema (BLOCKED, EXPIRED)
    if (status !== card.status && (status === "BLOCKED" || status === "EXPIRED")) {
      payload.status = status;
    }

    updateCardMutation.mutate(
      {
        id: card.id,
        version: card.version || 1,
        data: payload,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <CreditCardIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Edit Credit Card</h3>
              <p className="text-xs text-slate-400">Update card limits, billing cycles, and status</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Card Name / Nickname</label>
              <input
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="edit-card-issuer" className="block text-xs font-semibold text-slate-300 mb-1.5">Issuer Bank</label>
              <InstitutionPicker
                id="edit-card-issuer"
                value={institutionId}
                valueLabel={issuer || undefined}
                onChange={handleInstitutionChange}
                placeholder="e.g. HDFC Bank"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Last 4 Digits</label>
              <input
                type="text"
                maxLength={4}
                required
                value={lastFourDigits}
                onChange={(e) => setLastFourDigits(e.target.value.replace(/\D/g, ""))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Card Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CardStatus)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value={card.status || "ACTIVE"}>
                  {card.status || "ACTIVE"} (Current)
                </option>
                <option value="BLOCKED">BLOCKED</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Interest Rate (APR % p.a.)</label>
            <input
              type="number"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <p className="text-[11px] text-slate-500 -mt-2">
            Credit limit, billing cycle day, and payment due day are set when the card is added and are not editable here.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Reward Program</label>
              <input
                type="text"
                placeholder="e.g. HDFC SmartBuy"
                value={rewardProgram}
                onChange={(e) => setRewardProgram(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Reward Rate (points / ₹ spent)</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 2"
                value={rewardRatePoints}
                onChange={(e) => setRewardRatePoints(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Default Payment Account</label>
            <AsyncSearchSelect
              value={paymentAccountId}
              valueLabel={
                selectedPaymentAccount
                  ? `${selectedPaymentAccount.name} (${selectedPaymentAccount.type})`
                  : "-- None Linked --"
              }
              items={paymentAccountOptions}
              isFetching={isAccountsFetching}
              onSearch={setAccountSearch}
              onSelect={(a) => setPaymentAccountId(a.id)}
              onClear={() => setPaymentAccountId("")}
              getOptionKey={(a) => a.id}
              icon={<Wallet className="w-4 h-4 text-slate-500 shrink-0" />}
              placeholder="-- None Linked --"
              emptyMessage="No matching accounts"
              renderOption={(a) => (
                <span className="truncate">
                  {a.name} ({a.type})
                </span>
              )}
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-200">Auto-Pay Enabled</p>
              <p className="text-[11px] text-slate-400">Automatic bill payment on due date</p>
            </div>
            <input
              type="checkbox"
              checked={autoPayEnabled}
              onChange={(e) => setAutoPayEnabled(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded bg-slate-900 border-slate-700 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateCardMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {updateCardMutation.isPending ? "Updating..." : <><Check className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
