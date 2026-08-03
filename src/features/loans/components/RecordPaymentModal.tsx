import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Calculator,
} from "lucide-react";
import { formatCurrency } from "../../../utils/formatters";
import { usePayInstallment, useRecordExtraPayment, useLoanSchedule } from "../hooks/useLoanQueries";
import { Loan } from "../../../types";

interface RecordPaymentModalProps {
  loans: Loan[];
  initialLoanId?: string;
  initialScheduleId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const parseMoneyNum = (m?: unknown): number => {
  if (!m) return 0;
  if (typeof m === "number") return m;
  if (typeof m === "string") return parseFloat(m) || 0;
  return parseFloat((m as { amount?: string }).amount || "0") || 0;
};

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  loans,
  initialLoanId,
  initialScheduleId,
  isOpen,
  onClose,
}) => {
  const [paymentType, setPaymentType] = useState<"EMI" | "PREPAYMENT">("EMI");
  const [selectedLoanId, setSelectedLoanId] = useState<string>("");
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");

  const [paidAmount, setPaidAmount] = useState("");
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [reference, setReference] = useState("");
  const [principalPortion, setPrincipalPortion] = useState("");
  const [interestPortion, setInterestPortion] = useState("");

  const payInstallmentMutation = usePayInstallment();
  const recordExtraPaymentMutation = useRecordExtraPayment();

  const currentLoan = useMemo(
    () => loans.find((l) => l.id === selectedLoanId) || loans[0],
    [loans, selectedLoanId]
  );

  const { data: schedule = [] } = useLoanSchedule(currentLoan?.id || "");

  const pendingInstallments = useMemo(
    () => schedule.filter((item) => item.status !== "PAID"),
    [schedule]
  );

  const currentScheduleItem = useMemo(
    () => pendingInstallments.find((item) => item.id === selectedScheduleId) || pendingInstallments[0],
    [pendingInstallments, selectedScheduleId]
  );

  useEffect(() => {
    if (initialLoanId) setSelectedLoanId(initialLoanId);
    else if (loans.length > 0) setSelectedLoanId(loans[0].id);
  }, [initialLoanId, loans]);

  useEffect(() => {
    if (initialScheduleId) setSelectedScheduleId(initialScheduleId);
    else if (pendingInstallments.length > 0) setSelectedScheduleId(pendingInstallments[0].id);
  }, [initialScheduleId, pendingInstallments]);

  useEffect(() => {
    if (paymentType === "EMI") {
      let emiVal = 0;
      let p = 0;
      let i = 0;

      if (currentScheduleItem) {
        p = parseMoneyNum(currentScheduleItem.principalComponent);
        i = parseMoneyNum(currentScheduleItem.interestComponent);
        const rawEmi = parseMoneyNum(currentScheduleItem.installmentAmount || currentScheduleItem.emiAmount || currentScheduleItem.amount);
        emiVal = rawEmi > 0 ? rawEmi : p + i;
      }

      if (emiVal === 0 && currentLoan) {
        emiVal = parseMoneyNum(currentLoan.monthlyEmi || currentLoan.emiAmount);
      }

      if (emiVal > 0) {
        setPaidAmount(String(emiVal));
      }
      if (p > 0) setPrincipalPortion(String(p));
      if (i > 0) setInterestPortion(String(i));
    }
  }, [paymentType, currentScheduleItem, currentLoan]);

  if (!isOpen || loans.length === 0) return null;

  const currentOutstanding = parseMoneyNum(
    currentLoan?.outstandingBalance || currentLoan?.outstandingPrincipal || currentLoan?.principalAmount
  );

  const currentEmi =
    (currentScheduleItem
      ? parseMoneyNum(currentScheduleItem.installmentAmount || currentScheduleItem.emiAmount || currentScheduleItem.amount) ||
        parseMoneyNum(currentScheduleItem.principalComponent) + parseMoneyNum(currentScheduleItem.interestComponent)
      : 0) ||
    parseMoneyNum(currentLoan?.monthlyEmi || currentLoan?.emiAmount);

  const currentRemainingTenure =
    pendingInstallments.length > 0
      ? pendingInstallments.length
      : currentLoan?.remainingTenureMonths ||
        currentLoan?.installmentCount ||
        currentLoan?.tenureMonths ||
        (currentEmi > 0 && currentOutstanding > 0 ? Math.ceil(currentOutstanding / currentEmi) : 0);

  const currency = currentLoan?.currency || "INR";

  const numPaid =
    parseFloat(paidAmount) ||
    (paymentType === "EMI" && currentScheduleItem
      ? parseMoneyNum(currentScheduleItem.installmentAmount || currentScheduleItem.emiAmount || currentScheduleItem.amount) ||
        parseMoneyNum(currentScheduleItem.principalComponent) + parseMoneyNum(currentScheduleItem.interestComponent)
      : 0);

  const principalDeduction =
    paymentType === "EMI"
      ? parseFloat(principalPortion) ||
        (currentScheduleItem ? parseMoneyNum(currentScheduleItem.principalComponent) : 0) ||
        (numPaid > 0 ? numPaid * 0.8 : 0)
      : parseFloat(paidAmount) || 0;

  const simulatedRemainingBalance = Math.max(0, currentOutstanding - principalDeduction);

  const simulatedRemainingEMIs =
    paymentType === "EMI"
      ? Math.max(0, currentRemainingTenure - (numPaid > 0 ? 1 : 0))
      : currentEmi > 0
      ? Math.ceil(simulatedRemainingBalance / currentEmi)
      : Math.max(0, currentRemainingTenure - (numPaid > 0 ? 1 : 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasPortions = Boolean(principalPortion || interestPortion);
    const portionsPayload = hasPortions
      ? {
          principalPortion: principalPortion || "0",
          interestPortion: interestPortion || "0",
          penaltyPortion: "0",
        }
      : {};

    if (paymentType === "EMI" && currentLoan && currentScheduleItem) {
      payInstallmentMutation.mutate(
        {
          loanId: currentLoan.id,
          scheduleId: currentScheduleItem.id,
          data: {
            paidAmount,
            paidDate,
            paymentMethod,
            reference: reference || undefined,
            ...portionsPayload,
          },
        },
        { onSuccess: () => onClose() }
      );
    } else if (paymentType === "PREPAYMENT" && currentLoan) {
      recordExtraPaymentMutation.mutate(
        {
          loanId: currentLoan.id,
          data: {
            paidAmount,
            paidDate,
            paymentMethod,
            reference: reference || undefined,
            ...portionsPayload,
          },
        },
        { onSuccess: () => onClose() }
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-100 font-sans tracking-tight">Record Loan Payment</h2>
              <p className="text-xs text-slate-400">Process regular EMI or principal prepayment</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Payment Type Switcher */}
        <div className="grid grid-cols-2 p-3 bg-slate-950/60 border-b border-slate-800 gap-2">
          <button
            type="button"
            onClick={() => setPaymentType("EMI")}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              paymentType === "EMI"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            Regular EMI Installment
          </button>
          <button
            type="button"
            onClick={() => setPaymentType("PREPAYMENT")}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              paymentType === "PREPAYMENT"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            Extra Principal Prepayment
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Loan Selector */}
          <div>
            <label className="text-slate-400 font-semibold block mb-1.5">Select Loan Account *</label>
            <select
              value={selectedLoanId}
              onChange={(e) => setSelectedLoanId(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-indigo-500 outline-none cursor-pointer"
            >
              {loans.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.lenderName || l.type}) — Bal: {formatCurrency(l.outstandingBalance || l.outstandingPrincipal)}
                </option>
              ))}
            </select>
          </div>

          {/* Schedule Item Selector for EMI */}
          {paymentType === "EMI" && pendingInstallments.length > 0 && (
            <div>
              <label className="text-slate-400 font-semibold block mb-1.5">Scheduled Installment *</label>
              <select
                value={selectedScheduleId}
                onChange={(e) => setSelectedScheduleId(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-indigo-500 outline-none cursor-pointer"
              >
                {pendingInstallments.map((item) => {
                  const emi = item.installmentAmount || item.emiAmount || item.amount;
                  return (
                    <option key={item.id} value={item.id}>
                      Installment #{item.installmentNo} — Due: {item.dueDate} ({formatCurrency(emi)})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Amounts & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 font-semibold block mb-1.5">Payment Amount ({currency}) *</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                required
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-extrabold text-sm placeholder-slate-600 focus:border-indigo-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1.5">Payment Date *</label>
              <input
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                required
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1.5">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="UPI">UPI</option>
                <option value="NEFT">NEFT / RTGS</option>
                <option value="AUTO_DEBIT">Auto-Debit</option>
                <option value="NET_BANKING">Net Banking</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CASH">Cash</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1.5">Reference / UTR Number</label>
              <input
                type="text"
                placeholder="e.g. UTR-9988112"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-indigo-500 outline-none font-mono"
              />
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-indigo-950/40 border border-indigo-500/20 space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 font-bold">
              <Calculator className="w-4 h-4" />
              <span>Live Post-Payment Impact Preview</span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-slate-400 text-[11px] block font-semibold">Outstanding Balance</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-slate-400 line-through text-xs font-mono">{formatCurrency({ amount: String(currentOutstanding), currency })}</span>
                  <ArrowRight className="w-3 h-3 text-indigo-400" />
                  <span className="text-white font-extrabold text-sm font-mono">{formatCurrency({ amount: String(simulatedRemainingBalance), currency })}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block font-semibold">Remaining EMIs</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-slate-400 line-through text-xs">{currentRemainingTenure} mo</span>
                  <ArrowRight className="w-3 h-3 text-indigo-400" />
                  <span className="text-emerald-400 font-extrabold text-sm">{simulatedRemainingEMIs} mo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={payInstallmentMutation.isPending || recordExtraPaymentMutation.isPending || numPaid <= 0}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold cursor-pointer shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {payInstallmentMutation.isPending || recordExtraPaymentMutation.isPending
                  ? "Processing..."
                  : `Confirm ${paymentType === "EMI" ? "EMI Payment" : "Prepayment"}`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
