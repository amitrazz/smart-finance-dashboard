import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Eye,
  CreditCard,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatCurrency, formatPercent } from "../../../utils/formatters";
import { Loan, LoanStatus } from "../../../types";
import { usePauseLoan, useResumeLoan, useCloseLoan } from "../hooks/useLoanQueries";
import { ConfirmModal } from "../../../components/common/ConfirmModal";

interface LoanListTableProps {
  loans: Loan[];
  onSelectLoan: (loanId: string) => void;
  onOpenRecordPayment: (loanId: string) => void;
  onOpenCreateWizard: () => void;
}

const parseMoney = (m: unknown): number => {
  if (!m) return 0;
  if (typeof m === "number") return m;
  if (typeof m === "string") return parseFloat(m) || 0;
  return parseFloat((m as { amount?: string }).amount || "0") || 0;
};

const LOAN_TYPE_BADGES: Record<string, { label: string; color: string }> = {
  HOME: { label: "Home", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  VEHICLE: { label: "Vehicle", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  EDUCATION: { label: "Education", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  PERSONAL: { label: "Personal", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  GOLD: { label: "Gold", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  MORTGAGE: { label: "Mortgage", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  BUSINESS: { label: "Business", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  OTHER: { label: "Other", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
};

const STATUS_BADGES: Record<LoanStatus, { label: string; color: string }> = {
  ACTIVE: { label: "Active", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  PAUSED: { label: "Paused", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  CLOSED: { label: "Closed", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  DEFAULTED: { label: "Defaulted", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  SETTLED: { label: "Settled", color: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
  RESTRUCTURED: { label: "Restructured", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  CANCELLED: { label: "Cancelled", color: "bg-slate-700/50 text-slate-400 border-slate-600" },
};

export const LoanListTable: React.FC<LoanListTableProps> = ({
  loans,
  onSelectLoan,
  onOpenRecordPayment,
  onOpenCreateWizard,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"name" | "outstanding" | "emi" | "dueDate">("outstanding");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [activeMenuLoanId, setActiveMenuLoanId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [closeLoanTarget, setCloseLoanTarget] = useState<Loan | null>(null);
  const pageSize = 10;

  const pauseMutation = usePauseLoan();
  const resumeMutation = useResumeLoan();
  const closeMutation = useCloseLoan();
  const isRowActionPending = pauseMutation.isPending || resumeMutation.isPending || closeMutation.isPending;

  const parseMoneyNum = (m?: unknown): number => {
    if (!m) return 0;
    if (typeof m === "number") return m;
    if (typeof m === "string") return parseFloat(m) || 0;
    return parseFloat((m as { amount?: string }).amount || "0") || 0;
  };

  const filteredAndSortedLoans = useMemo(() => {
    return loans
      .filter((loan) => {
        const searchLower = (searchTerm || "").toLowerCase();
        const matchesSearch =
          (loan.name || "").toLowerCase().includes(searchLower) ||
          (loan.lenderName || "").toLowerCase().includes(searchLower) ||
          (loan.loanNumber || "").toLowerCase().includes(searchLower);

        const matchesStatus = statusFilter === "ALL" || loan.status === statusFilter;
        const matchesType = typeFilter === "ALL" || loan.type === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;

        if (sortBy === "name") {
          return sortOrder === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        } else if (sortBy === "outstanding") {
          valA = parseMoneyNum(a.outstandingBalance || a.outstandingPrincipal);
          valB = parseMoneyNum(b.outstandingBalance || b.outstandingPrincipal);
        } else if (sortBy === "emi") {
          valA = parseMoneyNum(a.monthlyEmi || a.emiAmount);
          valB = parseMoneyNum(b.monthlyEmi || b.emiAmount);
        } else if (sortBy === "dueDate") {
          valA = a.nextDueDate ? new Date(a.nextDueDate).getTime() : 0;
          valB = b.nextDueDate ? new Date(b.nextDueDate).getTime() : 0;
        }

        return sortOrder === "asc" ? valA - valB : valB - valA;
      });
  }, [loans, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedLoans.length / pageSize) || 1;
  const paginatedLoans = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedLoans.slice(start, start + pageSize);
  }, [filteredAndSortedLoans, currentPage]);

  const handlePause = (loan: Loan) => {
    pauseMutation.mutate({ id: loan.id, version: loan.version });
    setActiveMenuLoanId(null);
  };

  const handleResume = (loan: Loan) => {
    resumeMutation.mutate({ id: loan.id, version: loan.version });
    setActiveMenuLoanId(null);
  };

  const handleRequestClose = (loan: Loan) => {
    setCloseLoanTarget(loan);
    setActiveMenuLoanId(null);
  };

  const handleConfirmClose = () => {
    if (!closeLoanTarget) return;
    closeMutation.mutate(
      { id: closeLoanTarget.id, version: closeLoanTarget.version },
      { onSuccess: () => setCloseLoanTarget(null) }
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search loans, lenders, or account numbers..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Filters & Sorting */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-slate-200">All Statuses</option>
              <option value="ACTIVE" className="bg-slate-900 text-slate-200">Active</option>
              <option value="PAUSED" className="bg-slate-900 text-slate-200">Paused</option>
              <option value="CLOSED" className="bg-slate-900 text-slate-200">Closed</option>
              <option value="SETTLED" className="bg-slate-900 text-slate-200">Settled</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-slate-200">All Types</option>
              <option value="HOME" className="bg-slate-900 text-slate-200">Home Loan</option>
              <option value="VEHICLE" className="bg-slate-900 text-slate-200">Vehicle</option>
              <option value="PERSONAL" className="bg-slate-900 text-slate-200">Personal</option>
              <option value="EDUCATION" className="bg-slate-900 text-slate-200">Education</option>
              <option value="GOLD" className="bg-slate-900 text-slate-200">Gold Loan</option>
            </select>
          </div>

          {/* Sort By */}
          <button
            onClick={() => {
              if (sortBy === "outstanding") setSortOrder(sortOrder === "desc" ? "asc" : "desc");
              else {
                setSortBy("outstanding");
                setSortOrder("desc");
              }
            }}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
            <span>Outstanding {sortBy === "outstanding" ? (sortOrder === "desc" ? "↓" : "↑") : ""}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      {paginatedLoans.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No Loans Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL"
              ? "No loans match the selected filters. Try clearing your search query."
              : "No loan accounts are currently registered in your pFOS environment."}
          </p>
          <button
            onClick={onOpenCreateWizard}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Create New Loan
          </button>
        </div>
      ) : (
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Loan & Lender</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4 text-right">Outstanding</th>
                  <th className="py-3.5 px-4 text-right">Monthly EMI</th>
                  <th className="py-3.5 px-4 text-center">Remaining EMIs</th>
                  <th className="py-3.5 px-4 text-center">Interest</th>
                  <th className="py-3.5 px-4">Next Due</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {paginatedLoans.map((loan) => {
                  const typeBadge = LOAN_TYPE_BADGES[loan.type] || LOAN_TYPE_BADGES.OTHER;
                  const statusBadge = STATUS_BADGES[loan.status] || STATUS_BADGES.ACTIVE;

                  return (
                    <tr
                      key={loan.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => onSelectLoan(loan.id)}
                    >
                      {/* Name & Lender */}
                      <td className="py-4 px-4 font-bold text-slate-100 max-w-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0 font-extrabold text-xs">
                            {loan.name[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-slate-100">{loan.name}</div>
                            <div className="text-[11px] font-normal text-slate-400 truncate">
                              {(() => {
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
                              })()} {loan.loanNumber ? `• ${loan.loanNumber}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-4 px-4">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${typeBadge.color}`}>
                          {typeBadge.label}
                        </span>
                      </td>

                      {/* Outstanding */}
                      <td className="py-4 px-4 text-right font-extrabold text-white">
                        {formatCurrency(loan.outstandingBalance || loan.outstandingPrincipal)}
                      </td>

                      {/* EMI */}
                      <td className="py-4 px-4 text-right font-extrabold text-emerald-400">
                        {(() => {
                          const directEmi = loan.monthlyEmi || loan.emiAmount || loan.installmentAmount;
                          const directVal = parseMoney(directEmi);
                          if (directVal > 0) return formatCurrency(directEmi);

                          const principal = parseMoney(loan.outstandingPrincipal || loan.principalAmount);
                          const rate = (loan.interestRate || 0) / 100 / 12;
                          const n = loan.tenureMonths || loan.installmentCount || loan.remainingTenureMonths || 0;

                          if (principal > 0 && rate > 0 && n > 0) {
                            const emi = (principal * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
                            return formatCurrency({ amount: emi.toFixed(2), currency: loan.currency || "INR" });
                          }

                          return formatCurrency(directEmi);
                        })()}
                      </td>

                      {/* Remaining Tenure */}
                      <td className="py-4 px-4 text-center font-bold text-slate-300">
                        {loan.remainingTenureMonths != null
                          ? `${loan.remainingTenureMonths} mo`
                          : loan.tenureMonths != null
                          ? `${loan.tenureMonths} mo`
                          : loan.installmentCount != null
                          ? `${loan.installmentCount} mo`
                          : "—"}
                      </td>

                      {/* Interest Rate */}
                      <td className="py-4 px-4 text-center font-bold text-amber-400">
                        {formatPercent(loan.interestRate)}
                      </td>

                      {/* Next Due */}
                      <td className="py-4 px-4 text-slate-300 font-medium">
                        {(() => {
                          if (loan.nextDueDate) return loan.nextDueDate;
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
                        })()}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenRecordPayment(loan.id)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer"
                            title="Record EMI / Prepayment"
                            aria-label="Record EMI / Prepayment"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onSelectLoan(loan.id)}
                            className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition-all cursor-pointer"
                            title="View Details"
                            aria-label="View loan details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <div className="relative">
                            <button
                              onClick={() => setActiveMenuLoanId(activeMenuLoanId === loan.id ? null : loan.id)}
                              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
                              aria-label="More loan actions"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {activeMenuLoanId === loan.id && (
                              <div className="absolute right-0 top-8 z-30 w-44 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl p-1.5 text-left space-y-1">
                                {loan.status === "ACTIVE" && (
                                  <button
                                    onClick={() => handlePause(loan)}
                                    disabled={isRowActionPending}
                                    className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-900 text-amber-400 text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <PauseCircle className="w-3.5 h-3.5" />
                                    <span>Pause Repayments</span>
                                  </button>
                                )}

                                {loan.status === "PAUSED" && (
                                  <button
                                    onClick={() => handleResume(loan)}
                                    disabled={isRowActionPending}
                                    className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-900 text-emerald-400 text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <PlayCircle className="w-3.5 h-3.5" />
                                    <span>Resume Repayments</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => handleRequestClose(loan)}
                                  disabled={isRowActionPending}
                                  className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Mark Closed</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>
                Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredAndSortedLoans.length} total loans)
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 transition-all cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 transition-all cursor-pointer"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(closeLoanTarget)}
        title="Close this loan?"
        message={`This marks "${closeLoanTarget?.name ?? "this loan"}" as closed. It will stop appearing in active EMI schedules and reminders. You can review it later from the closed loans filter.`}
        confirmText="Close Loan"
        cancelText="Keep Active"
        variant="warning"
        isLoading={closeMutation.isPending}
        onConfirm={handleConfirmClose}
        onClose={() => setCloseLoanTarget(null)}
      />
    </div>
  );
};
