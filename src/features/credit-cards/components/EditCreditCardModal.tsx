import React, { useState, useEffect } from "react";
import { X, Check, CreditCard as CreditCardIcon } from "lucide-react";
import { useUpdateCreditCard } from "../hooks/useCreditCardQueries";
import { useAccounts } from "../../../hooks/useFinanceQueries";
import { CreditCard, CardStatus, UpdateCreditCardInput } from "../../../types";

interface EditCreditCardModalProps {
  card: CreditCard | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditCreditCardModal: React.FC<EditCreditCardModalProps> = ({ card, isOpen, onClose }) => {
  const updateCardMutation = useUpdateCreditCard();
  const { data: accounts = [] } = useAccounts();

  const [name, setName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [billingCycleDay, setBillingCycleDay] = useState(5);
  const [paymentDueDay, setPaymentDueDay] = useState(25);
  const [interestRate, setInterestRate] = useState("42.0");
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [autoPay, setAutoPay] = useState(false);
  const [status, setStatus] = useState<CardStatus>("ACTIVE");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (card) {
      setName(card.name || "");
      setIssuer(card.issuer || "");

      const lim =
        typeof card.creditLimit === "object" && card.creditLimit !== null
          ? (card.creditLimit as { amount?: string }).amount || ""
          : String(card.creditLimit || "");
      setCreditLimit(lim);

      setBillingCycleDay(card.billingCycleDay || card.statementDay || 5);
      setPaymentDueDay(card.paymentDueDay || card.dueDay || 25);
      setInterestRate(String(card.interestRate || "42.0"));
      setPaymentAccountId(card.paymentAccountId || "");
      setAutoPay(Boolean(card.autoPay));
      setStatus((card.status as CardStatus) || "ACTIVE");
      setNotes(card.notes || "");
    }
  }, [card]);

  if (!isOpen || !card) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: UpdateCreditCardInput = {
      name,
      issuer,
      creditLimit,
      billingCycleDay,
      statementDay: billingCycleDay,
      paymentDueDay,
      dueDay: paymentDueDay,
      interestRate,
      paymentAccountId: paymentAccountId || undefined,
      autoPay,
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
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Card Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Issuer Bank</label>
              <input
                type="text"
                required
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Credit Limit</label>
              <input
                type="number"
                step="any"
                required
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Billing Cycle Day</label>
              <select
                value={billingCycleDay}
                onChange={(e) => setBillingCycleDay(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Day {d} of month
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payment Due Day</label>
              <select
                value={paymentDueDay}
                onChange={(e) => setPaymentDueDay(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Day {d} of month
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Default Payment Account</label>
            <select
              value={paymentAccountId}
              onChange={(e) => setPaymentAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="">-- None Linked --</option>
              {accounts
                .filter((a) => a.type !== "CREDIT_CARD" && a.type !== "LOAN")
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type})
                  </option>
                ))}
            </select>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-200">Auto-Pay Enabled</p>
              <p className="text-[11px] text-slate-400">Automatic bill payment on due date</p>
            </div>
            <input
              type="checkbox"
              checked={autoPay}
              onChange={(e) => setAutoPay(e.target.checked)}
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
