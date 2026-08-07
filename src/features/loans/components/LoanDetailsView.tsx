import React, { useState } from "react";
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  PlayCircle,
  Edit3,
  Percent,
  Plus,
  Trash2,
  RotateCcw,
  Building2,
} from "lucide-react";
import { formatCurrency, formatPercent } from "../../../utils/formatters";
import { ConfirmModal } from "../../../components/common/ConfirmModal";
import {
  useLoan,
  useLoanSchedule,
  useLoanPayments,
  useLoanDocuments,
  useLoanInterestRateHistory,
  usePauseLoan,
  useResumeLoan,
  useCloseLoan,
  useReverseLoanPayment,
  useDeleteLoanDocument,
  useAddLoanDocument,
} from "../hooks/useLoanQueries";
import { Loan } from "../../../types";
import { NAV_TAB_L2 } from "../../../styles/navTabTokens";

interface LoanDetailsViewProps {
  loanId: string;
  onBack: () => void;
  onOpenRecordPayment: (loanId: string, scheduleId?: string) => void;
  onOpenEditModal: (loan: Loan) => void;
  onOpenInterestRateModal: (loan: Loan) => void;
}

const parseMoney = (m?: unknown): number => {
  if (!m) return 0;
  if (typeof m === "number") return m;
  if (typeof m === "string") return parseFloat(m) || 0;
  return parseFloat((m as { amount?: string }).amount || "0") || 0;
};

export const LoanDetailsView: React.FC<LoanDetailsViewProps> = ({
  loanId,
  onBack,
  onOpenRecordPayment,
  onOpenEditModal,
  onOpenInterestRateModal,
}) => {
  const { data: loan, isLoading: isLoanLoading, isError } = useLoan(loanId);
  const { data: schedule = [] } = useLoanSchedule(loanId);
  const { data: payments = [] } = useLoanPayments(loanId);
  const { data: documents = [] } = useLoanDocuments(loanId);
  const { data: rateHistory = [] } = useLoanInterestRateHistory(loanId);

  const [activeTab, setActiveTab] = useState<"overview" | "schedule" | "payments" | "documents" | "activity">("overview");
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [docCategory, setDocCategory] = useState("SANCTION_LETTER");
  const [docFileName, setDocFileName] = useState("");
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const [reversePaymentTarget, setReversePaymentTarget] = useState<{ id: string } | null>(null);
  const [deleteDocTarget, setDeleteDocTarget] = useState<{ id: string; fileName: string } | null>(null);

  const pauseMutation = usePauseLoan();
  const resumeMutation = useResumeLoan();
  const closeMutation = useCloseLoan();
  const reversePaymentMutation = useReverseLoanPayment();
  const deleteDocMutation = useDeleteLoanDocument();
  const addDocMutation = useAddLoanDocument();
  const isStatusActionPending = pauseMutation.isPending || resumeMutation.isPending || closeMutation.isPending;

  if (isLoanLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-800 rounded w-1/4" />
        <div className="h-44 bg-slate-900/80 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  if (isError || !loan) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/80 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Loan Details Unavailable</h3>
        <p className="text-xs text-slate-400">Could not retrieve details for the requested loan account.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold"
        >
          Back to Loans
        </button>
      </div>
    );
  }

  const outstandingVal = parseMoney(loan.outstandingBalance || loan.outstandingPrincipal);
  const originalVal = parseMoney(loan.principalAmount);
  const totalTenure = loan.tenureMonths || 0;
  const progressPercent = originalVal > 0 ? Math.min(100, Math.max(0, ((originalVal - outstandingVal) / originalVal) * 100)) : 0;

  const handleAddDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFileName) return;
    addDocMutation.mutate(
      {
        loanId: loan.id,
        data: {
          category: docCategory,
          fileName: docFileName,
          storageKey: `loans/${loan.id}/${docFileName}`,
          mimeType: "application/pdf",
          sizeBytes: 102400,
        },
      },
      {
        onSuccess: () => {
          setIsAddDocOpen(false);
          setDocFileName("");
        },
      }
    );
  };

  const handleConfirmClose = () => {
    closeMutation.mutate(
      { id: loan.id, version: loan.version },
      { onSuccess: () => setIsCloseConfirmOpen(false) }
    );
  };

  const handleConfirmReversePayment = () => {
    if (!reversePaymentTarget) return;
    reversePaymentMutation.mutate(
      { loanId: loan.id, paymentId: reversePaymentTarget.id },
      { onSuccess: () => setReversePaymentTarget(null) }
    );
  };

  const handleConfirmDeleteDocument = () => {
    if (!deleteDocTarget) return;
    deleteDocMutation.mutate(
      { loanId: loan.id, documentId: deleteDocTarget.id },
      { onSuccess: () => setDeleteDocTarget(null) }
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Loans</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenEditModal(loan)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Loan</span>
          </button>
          <button
            onClick={() => onOpenRecordPayment(loan.id)}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Loan Header Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-100 font-sans tracking-tight">{loan.name}</h1>
              <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase">
                {loan.status}
              </span>
              {loan.autoDebit && (
                <span className="text-[10px] font-extrabold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 uppercase">
                  Auto-Debit Enabled
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Lender: <strong className="text-slate-200">{(() => {
                if (loan.lenderName && loan.lenderName !== loan.name) return loan.lenderName;
                if (loan.institutionName && loan.institutionName !== loan.name) return loan.institutionName;
                const nameUpper = (loan.name || "").toUpperCase();
                if (nameUpper.includes("ICICI")) return "ICICI Bank";
                if (nameUpper.includes("HDFC")) return "HDFC Bank";
                if (nameUpper.includes("SBI") || nameUpper.includes("STATE BANK")) return "State Bank of India (SBI)";
                if (nameUpper.includes("AXIS")) return "Axis Bank";
                if (nameUpper.includes("KOTAK")) return "Kotak Mahindra Bank";
                if (nameUpper.includes("BOB") || nameUpper.includes("BARODA")) return "Bank of Baroda";
                if (nameUpper.includes("PNB") || nameUpper.includes("PUNJAB")) return "Punjab National Bank";
                if (nameUpper.includes("TATA")) return "Tata Capital";
                if (nameUpper.includes("BAJAJ")) return "Bajaj Finance";
                return "Unspecified Bank";
              })()}</strong>{" "}
              {loan.loanNumber ? `| Account #${loan.loanNumber}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {loan.interestType === "FLOATING" && (
              <button
                onClick={() => onOpenInterestRateModal(loan)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Percent className="w-3.5 h-3.5" />
                <span>Adjust Interest Rate</span>
              </button>
            )}

            {loan.status === "ACTIVE" ? (
              <button
                onClick={() => pauseMutation.mutate({ id: loan.id, version: loan.version })}
                disabled={isStatusActionPending}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Pause Repayments</span>
              </button>
            ) : loan.status === "PAUSED" ? (
              <button
                onClick={() => resumeMutation.mutate({ id: loan.id, version: loan.version })}
                disabled={isStatusActionPending}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Resume Repayments</span>
              </button>
            ) : null}

            {loan.status !== "CLOSED" && (
              <button
                onClick={() => setIsCloseConfirmOpen(true)}
                disabled={isStatusActionPending}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Close Loan</span>
              </button>
            )}
          </div>
        </div>

        {/* 5-Key Metrics Row */}
        {(() => {
          const pendingSchedule = schedule.filter((s) => s.status !== "PAID");

          const monthlyEmiDisplay =
            loan.monthlyEmi ||
            loan.emiAmount ||
            (schedule[0]
              ? schedule[0].installmentAmount ||
                schedule[0].emiAmount ||
                schedule[0].amount || {
                  amount: String(
                    (
                      parseMoney(schedule[0].principalComponent || schedule[0].principalPortion || schedule[0].principal) +
                      parseMoney(schedule[0].interestComponent || schedule[0].interestPortion || schedule[0].interest)
                    ).toFixed(2)
                  ),
                  currency: loan.currency || "INR",
                }
              : undefined);

          const remainingTenureDisplay =
            loan.remainingTenureMonths != null
              ? `${loan.remainingTenureMonths} mo`
              : pendingSchedule.length > 0
              ? `${pendingSchedule.length} mo`
              : loan.tenureMonths != null
              ? `${loan.tenureMonths} mo`
              : loan.installmentCount != null
              ? `${loan.installmentCount} mo`
              : "—";

          const nextDueDateDisplay =
            loan.nextDueDate ||
            (pendingSchedule[0] ? pendingSchedule[0].dueDate : undefined) ||
            (() => {
              const baseDateStr = loan.startDate || loan.disbursementDate;
              const now = new Date();
              let dueDay = 5;
              if (baseDateStr) {
                const parsedDay = parseInt(baseDateStr.split("-")[2], 10);
                if (!isNaN(parsedDay) && parsedDay >= 1 && parsedDay <= 31) dueDay = parsedDay;
              }
              let year = now.getFullYear();
              let month = now.getMonth();
              if (now.getDate() > dueDay) {
                month += 1;
                if (month > 11) { month = 0; year += 1; }
              }
              return `${year}-${String(month + 1).padStart(2, "0")}-${String(dueDay).padStart(2, "0")}`;
            })();

          return (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Outstanding Principal</span>
                <p className="text-xl font-extrabold text-white mt-1">
                  {formatCurrency(loan.outstandingBalance || loan.outstandingPrincipal)}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Monthly EMI</span>
                <p className="text-xl font-extrabold text-emerald-400 mt-1">
                  {formatCurrency(monthlyEmiDisplay)}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Interest Rate</span>
                <p className="text-xl font-extrabold text-amber-400 mt-1">
                  {formatPercent(loan.interestRate)} <span className="text-xs text-slate-400 font-normal">({loan.interestType || "FIXED"})</span>
                </p>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Remaining Tenure</span>
                <p className="text-xl font-extrabold text-white mt-1">
                  {remainingTenureDisplay}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Next Due Date</span>
                <p className="text-xl font-extrabold text-purple-400 mt-1">
                  {nextDueDateDisplay}
                </p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {(
          [
            { id: "overview", label: "Overview", icon: Building2 },
            { id: "schedule", label: "Amortization Schedule", icon: Calendar },
            { id: "payments", label: "Payment History", icon: CreditCard },
            { id: "documents", label: "Documents", icon: FileText },
            { id: "activity", label: "Rate & Audit Log", icon: Clock },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? `${NAV_TAB_L2}`
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
            <h3 className="text-base font-bold text-slate-100">Loan Details & Specifications</h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold block">Loan Nickname</span>
                <span className="text-slate-100 font-bold block">{loan.name}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold block">Lender Institution</span>
                <span className="text-slate-100 font-bold block">{loan.lenderName || "Not specified"}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold block">Payment Frequency</span>
                <span className="text-slate-100 font-bold block">{loan.paymentFrequency || "MONTHLY"}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold block">Original Principal</span>
                <span className="text-slate-100 font-bold block">
                  {originalVal > 0 ? formatCurrency(loan.principalAmount) : "Not recorded (Current position only)"}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold block">Original Tenure</span>
                <span className="text-slate-100 font-bold block">
                  {totalTenure > 0 ? `${totalTenure} months` : "Not recorded"}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold block">Auto Debit Status</span>
                <span className={`font-bold block ${loan.autoDebit ? "text-emerald-400" : "text-slate-400"}`}>
                  {loan.autoDebit ? "Enabled" : "Manual Repayments"}
                </span>
              </div>
            </div>

            {loan.notes && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-xs font-semibold text-slate-400 block">Notes & Documentation</span>
                <p className="text-xs text-slate-300">{loan.notes}</p>
              </div>
            )}
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-100">Repayment Progress</h3>

            {originalVal > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">Payoff Progress</span>
                  <span className="text-emerald-400">{progressPercent.toFixed(1)}% Paid</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center text-xs text-slate-400 space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <p className="font-bold text-slate-200">Current Position Model</p>
                <p className="text-[11px]">This loan was registered with live balance metrics.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "schedule" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100">Amortization & Repayment Schedule</h3>
            <span className="text-xs text-slate-400">{schedule.length} Installments Total</span>
          </div>

          {schedule.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/80 rounded-3xl border border-slate-800 text-xs text-slate-400">
              No schedule rows found for this loan.
            </div>
          ) : (
            <div className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">#</th>
                    <th className="py-3.5 px-4">Due Date</th>
                    <th className="py-3.5 px-4 text-right">Principal</th>
                    <th className="py-3.5 px-4 text-right">Interest</th>
                    <th className="py-3.5 px-4 text-right">Total EMI</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {schedule.map((item) => {
                    const principal = item.principalComponent || item.principalAmount || item.principalPortion || item.principal;
                    const interest = item.interestComponent || item.interestAmount || item.interestPortion || item.interest;
                    
                    const pVal = parseMoney(principal);
                    const iVal = parseMoney(interest);
                    
                    const rawEmi = item.emiAmount || item.amount || item.installmentAmount || item.totalAmount;
                    const emiVal = parseMoney(rawEmi) > 0 ? rawEmi : { amount: String((pVal + iVal).toFixed(2)), currency: loan.currency || "INR" };

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/40">
                        <td className="py-3.5 px-4 font-bold text-slate-400">#{item.installmentNo}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-100">{item.dueDate}</td>
                        <td className="py-3.5 px-4 text-right font-medium">{formatCurrency(principal)}</td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-400">{formatCurrency(interest)}</td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400">{formatCurrency(emiVal)}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${
                              item.status === "PAID"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : item.status === "OVERDUE"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {item.status !== "PAID" && (
                            <button
                              onClick={() => onOpenRecordPayment(loan.id, item.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer shadow-sm"
                            >
                              Pay
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

      {activeTab === "payments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100">Payment History & Ledger</h3>
            <span className="text-xs text-slate-400">{payments.length} Recorded Payments</span>
          </div>

          {payments.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/80 rounded-3xl border border-slate-800 text-xs text-slate-400">
              No payments recorded yet. Click "Record Payment" to make an EMI or prepayment.
            </div>
          ) : (
            <div className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Payment Date</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-right">Principal</th>
                    <th className="py-3.5 px-4 text-right">Interest</th>
                    <th className="py-3.5 px-4">Method / Ref</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {payments.map((pmt) => {
                    const pDate = pmt.paidDate || pmt.paymentDate || (pmt.createdAt ? pmt.createdAt.slice(0, 10) : "—");
                    const pVal = parseMoney(pmt.principalPortion);
                    const iVal = parseMoney(pmt.interestPortion);
                    const rawAmt = pmt.paidAmount || pmt.amount;
                    const amtVal = parseMoney(rawAmt) > 0 ? rawAmt : { amount: String((pVal + iVal).toFixed(2)), currency: loan.currency || "INR" };

                    return (
                      <tr key={pmt.id} className="hover:bg-slate-800/40">
                        <td className="py-3.5 px-4 font-semibold text-slate-100">{pDate}</td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {pmt.isExtraPayment ? "PREPAYMENT" : pmt.type || "REGULAR_EMI"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400">{formatCurrency(amtVal)}</td>
                        <td className="py-3.5 px-4 text-right font-medium">{formatCurrency(pmt.principalPortion)}</td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-400">{formatCurrency(pmt.interestPortion)}</td>
                        <td className="py-3.5 px-4 text-slate-300">{pmt.paymentMethod || "Direct"} {pmt.reference ? `(${pmt.reference})` : ""}</td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${pmt.status === "REVERSED" ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                            {pmt.status || "COMPLETED"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {pmt.status !== "REVERSED" && (
                            <button
                              onClick={() => setReversePaymentTarget({ id: pmt.id })}
                              disabled={reversePaymentMutation.isPending}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Reverse Payment"
                              aria-label="Reverse this payment"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
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

      {activeTab === "documents" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">Loan Documents & Vault</h3>
              <p className="text-xs text-slate-400">Sanction letters, agreements, NOC & tax certificates</p>
            </div>
            <button
              onClick={() => setIsAddDocOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Attach Document</span>
            </button>
          </div>

          {/* Add Doc Form Modal */}
          {isAddDocOpen && (
            <form onSubmit={handleAddDocumentSubmit} className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3">
              <h4 className="text-xs font-bold text-indigo-300">Attach New Document Metadata</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Document Category</label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200"
                  >
                    <option value="SANCTION_LETTER">Sanction Letter</option>
                    <option value="LOAN_AGREEMENT">Loan Agreement</option>
                    <option value="REPAYMENT_SCHEDULE">Repayment Schedule</option>
                    <option value="NOC">No Objection Certificate (NOC)</option>
                    <option value="TAX_CERTIFICATE">Tax Certificate</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">File Name</label>
                  <input
                    type="text"
                    placeholder="e.g. loan-sanction-letter.pdf"
                    value={docFileName}
                    onChange={(e) => setDocFileName(e.target.value)}
                    required
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddDocOpen(false)}
                  className="px-3 py-1 rounded-xl bg-slate-900 text-slate-400 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                >
                  Save Attachment
                </button>
              </div>
            </form>
          )}

          {documents.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/80 rounded-3xl border border-slate-800 text-xs text-slate-400">
              No attached documents. Click "Attach Document" to record agreement files.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-100 truncate">{doc.fileName}</h4>
                      <span className="text-[10px] text-slate-400 font-mono block uppercase">{doc.category}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setDeleteDocTarget({ id: doc.id, fileName: doc.fileName })}
                    disabled={deleteDocMutation.isPending}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Delete document"
                    aria-label="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "activity" && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-100">Interest Rate & Status Revision Audit Log</h3>

          {rateHistory.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/80 rounded-3xl border border-slate-800 text-xs text-slate-400">
              No interest rate revisions recorded for this loan account.
            </div>
          ) : (
            <div className="space-y-2.5">
              {rateHistory.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-200">
                      Rate Changed from {formatPercent(item.oldRate)} → <strong className="text-amber-400">{formatPercent(item.newRate)}</strong>
                    </span>
                    {item.reason && <p className="text-[11px] text-slate-400 mt-0.5">Reason: {item.reason}</p>}
                  </div>
                  <span className="text-slate-400 font-mono">{item.effectiveDate}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={isCloseConfirmOpen}
        title="Close this loan?"
        message={`This marks "${loan.name}" as closed. It will stop appearing in active EMI schedules and reminders. You can review it later from the closed loans filter.`}
        confirmText="Close Loan"
        cancelText="Keep Active"
        variant="warning"
        isLoading={closeMutation.isPending}
        onConfirm={handleConfirmClose}
        onClose={() => setIsCloseConfirmOpen(false)}
      />

      <ConfirmModal
        isOpen={Boolean(reversePaymentTarget)}
        title="Reverse this payment?"
        message="This reverses the recorded payment and restores the corresponding installment/outstanding balance. This action cannot be undone from here."
        confirmText="Reverse Payment"
        cancelText="Cancel"
        variant="danger"
        isLoading={reversePaymentMutation.isPending}
        onConfirm={handleConfirmReversePayment}
        onClose={() => setReversePaymentTarget(null)}
      />

      <ConfirmModal
        isOpen={Boolean(deleteDocTarget)}
        title="Delete this document?"
        message={`"${deleteDocTarget?.fileName ?? "This document"}" will be permanently removed from the loan's document vault.`}
        confirmText="Delete Document"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteDocMutation.isPending}
        onConfirm={handleConfirmDeleteDocument}
        onClose={() => setDeleteDocTarget(null)}
      />
    </div>
  );
};
