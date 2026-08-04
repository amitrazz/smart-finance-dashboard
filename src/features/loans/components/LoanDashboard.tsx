import React from "react";
import {
  Wallet,
  TrendingDown,
  Calendar,
  CheckCircle2,
  PlusCircle,
  CreditCard,
  Building2,
  ArrowUpRight,
  Percent,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  TooltipValueType,
} from "recharts";
import { formatCurrency, formatPercent } from "../../../utils/formatters";
import { useLoanDashboard, useLoans } from "../hooks/useLoanQueries";
import { Loan, Money } from "../../../types";

interface LoanDashboardProps {
  onOpenCreateWizard: () => void;
  onOpenRecordPayment: (loanId?: string) => void;
  onSelectLoan: (loanId: string) => void;
  onSwitchToTab: (tab: "dashboard" | "list" | "details") => void;
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];

const parseMoney = (m?: Money | string | number): number => {
  if (!m) return 0;
  if (typeof m === "number") return m;
  if (typeof m === "string") return parseFloat(m) || 0;
  return parseFloat(m.amount || "0") || 0;
};

export const LoanDashboard: React.FC<LoanDashboardProps> = ({
  onOpenCreateWizard,
  onOpenRecordPayment,
  onSelectLoan,
  onSwitchToTab,
}) => {
  const { data: dashboard, isLoading: isDashboardLoading } = useLoanDashboard();
  const { data: loans = [], isLoading: isLoansLoading } = useLoans();

  const isLoading = isDashboardLoading || isLoansLoading;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-900/80 rounded-2xl border border-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-slate-900/80 rounded-3xl border border-slate-800" />
          <div className="h-72 bg-slate-900/80 rounded-3xl border border-slate-800" />
        </div>
      </div>
    );
  }

  const getLoanEmi = (loan: Loan) => {
    const directEmi = loan.monthlyEmi || loan.emiAmount || loan.installmentAmount;
    const directVal = parseMoney(directEmi);
    if (directVal > 0) return directEmi;

    const principal = parseMoney(loan.outstandingPrincipal || loan.principalAmount);
    const rate = (loan.interestRate || 0) / 100 / 12;
    const n = loan.tenureMonths || loan.installmentCount || loan.remainingTenureMonths || 0;

    if (principal > 0 && rate > 0 && n > 0) {
      const emi = (principal * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
      return { amount: emi.toFixed(2), currency: loan.currency || "INR" };
    }

    return directEmi;
  };

  const activeLoans = loans.filter((l) => l.status === "ACTIVE" || l.status === "PAUSED");
  const closedLoans = loans.filter((l) => l.status === "CLOSED" || l.status === "SETTLED");

  // Calculate metrics from backend loans dataset if /dashboard metrics are missing or 0
  const rawTotalOutstanding = parseMoney(dashboard?.totalOutstanding);
  const loansSumOutstanding = loans.reduce((acc, l) => acc + parseMoney(l.outstandingBalance || l.outstandingPrincipal || l.principalAmount), 0);
  const totalOutstanding = rawTotalOutstanding > 0 ? dashboard!.totalOutstanding! : { amount: String(loansSumOutstanding), currency: loans[0]?.currency || "INR" };

  const rawTotalMonthlyEmi = parseMoney(dashboard?.totalMonthlyEmi);
  const loansSumEmi = loans.reduce((acc, l) => acc + parseMoney(getLoanEmi(l)), 0);
  const totalMonthlyEmi = rawTotalMonthlyEmi > 0 ? dashboard!.totalMonthlyEmi! : { amount: String(loansSumEmi), currency: loans[0]?.currency || "INR" };

  const avgInterestRate = (dashboard?.averageInterestRate && dashboard.averageInterestRate > 0)
    ? dashboard.averageInterestRate
    : (activeLoans.length > 0 ? activeLoans.reduce((acc, l) => acc + (l.interestRate || 0), 0) / activeLoans.length : 0);

  const rawHighestEmi = parseMoney(dashboard?.highestInstallment?.installmentAmount);
  const loansMaxEmi = Math.max(...loans.map((l) => parseMoney(getLoanEmi(l))), 0);
  const highestEmi = rawHighestEmi > 0 ? dashboard!.highestInstallment!.installmentAmount : { amount: String(loansMaxEmi), currency: loans[0]?.currency || "INR" };

  // Chart 1: Debt Distribution by Category (from dashboard.loansByType or computed from active loans)
  const loansByType = Array.isArray(dashboard?.loansByType) && dashboard.loansByType.length > 0
    ? dashboard.loansByType
    : Object.entries(
        activeLoans.reduce((acc, l) => {
          const type = (l.type || "OTHER").replace("_", " ");
          acc[type] = (acc[type] || 0) + parseMoney(l.outstandingBalance || l.outstandingPrincipal || l.principalAmount);
          return acc;
        }, {} as Record<string, number>)
      ).map(([type, totalOutstanding]) => ({ type, totalOutstanding: String(totalOutstanding) }));

  const typeChartData = loansByType.map((t: { type: string; totalOutstanding: Money | string | number }) => ({
    name: t.type,
    value: parseMoney(t.totalOutstanding),
  }));

  // Chart 2: Exposure by Lender Institution
  const lenderChartData = Object.entries(
    activeLoans.reduce((acc, l) => {
      const lender = l.lenderName || l.institutionName || l.accountName || l.name || "Financial Institution";
      acc[lender] = (acc[lender] || 0) + parseMoney(l.outstandingBalance || l.outstandingPrincipal || l.principalAmount);
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Upcoming Installments (from dashboard or derived from active backend loans)
  const upcomingInstallments = Array.isArray(dashboard?.upcomingInstallments) && dashboard.upcomingInstallments.length > 0
    ? dashboard.upcomingInstallments
    : activeLoans.map((l, idx) => ({
        scheduleId: l.id || `up_${idx}`,
        loanId: l.id,
        loanName: l.name,
        installmentNo: 1,
        dueDate: l.nextDueDate || new Date().toISOString().split("T")[0],
        installmentAmount: typeof getLoanEmi(l) === "object" ? (getLoanEmi(l) as Money) : { amount: String(parseMoney(getLoanEmi(l))), currency: l.currency || "INR" },
        status: "UPCOMING",
      }));

  return (
    <div className="space-y-8">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-100 font-sans tracking-tight">Loan Portfolio Dashboard</h2>
            <span className="text-[10px] font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 uppercase">
              Current Position Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time liability management, automated EMI schedules & repayment analytics
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenCreateWizard}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Loan</span>
          </button>
          <button
            onClick={() => onOpenRecordPayment()}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Pay EMI / Prepayment</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Outstanding</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white font-sans tracking-tight">
            {formatCurrency(totalOutstanding)}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>{activeLoans.length} Active Loans</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">{closedLoans.length} Closed</span>
          </div>
        </div>

        {/* Monthly EMI */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Monthly EMI</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400 font-sans tracking-tight">
            {formatCurrency(totalMonthlyEmi)}
          </p>
          <p className="text-[11px] text-slate-400 truncate">
            Highest EMI: <strong className="text-slate-200">{formatCurrency(highestEmi)}</strong>
          </p>
        </div>

        {/* Average Interest Rate */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Avg Interest Rate</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-400 font-sans tracking-tight">
            {formatPercent(avgInterestRate)}
          </p>
          <p className="text-[11px] text-slate-400">Weighted average APR across active debt</p>
        </div>

        {/* Next Due Date */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Next Upcoming Due</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-white truncate">
            {dashboard?.nextDue?.dueDate || activeLoans[0]?.nextDueDate || "None Upcoming"}
          </p>
          <p className="text-[11px] text-slate-400 truncate">
            {dashboard?.nextDue?.loanName || activeLoans[0]?.name || "All accounts settled"}
          </p>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outstanding by Loan Type */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">Debt Distribution by Category</h3>
              <p className="text-xs text-slate-400">Portfolio breakdown by liability type</p>
            </div>
          </div>

          {typeChartData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-slate-500">
              No active loans recorded to render breakdown chart.
            </div>
          ) : (
            <div className="h-60 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {typeChartData.map((_: unknown, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#090d16", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }}
                    formatter={(val: unknown) => formatCurrency(String(val))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60">
            {typeChartData.map((item: { name: string; value: number }, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-400 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="font-bold text-slate-200">{formatCurrency(String(item.value))}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Outstanding by Lender */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">Exposure by Lender Institution</h3>
              <p className="text-xs text-slate-400">Outstanding balance per financial lender</p>
            </div>
          </div>

          {lenderChartData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-slate-500">
              No lender data recorded yet.
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lenderChartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#090d16", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }}
                    formatter={(val: TooltipValueType | undefined) => formatCurrency(String(val))}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming EMIs & Active Quick View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline of Upcoming Installments */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-base font-bold text-slate-100">Upcoming EMI Installments</h3>
                <p className="text-xs text-slate-400">Scheduled EMI payments for the next 30 days</p>
              </div>
            </div>
            <button
              onClick={() => onSwitchToTab("list")}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View All Loans</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingInstallments.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-xs font-bold text-slate-200">No Pending EMIs Due Next 30 Days</p>
              <p className="text-[11px] text-slate-400">All loan installments are up-to-date.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingInstallments.slice(0, 5).map((item, idx) => (
                <div
                  key={item.scheduleId}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/40 flex items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0 font-bold text-xs">
                      #{item.installmentNo ?? idx + 1}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-100 truncate">{item.loanName}</h4>
                      <span className="text-[10px] text-slate-400">Due: {item.dueDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-emerald-400 block">
                        {formatCurrency(item.installmentAmount)}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                          item.status === "OVERDUE"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <button
                      onClick={() => onOpenRecordPayment(item.loanId)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
                    >
                      Pay Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Loan Roster */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100">Active Loans</h3>
            <span className="text-xs font-bold text-slate-400">{activeLoans.length} Loans</span>
          </div>

          {activeLoans.length === 0 ? (
            <div className="p-6 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
              <Building2 className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs font-bold text-slate-300">No Active Liabilities</p>
              <p className="text-[11px] text-slate-400">Create a new loan to start tracking EMI schedules.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeLoans.slice(0, 4).map((loan) => (
                <div
                  key={loan.id}
                  onClick={() => {
                    onSelectLoan(loan.id);
                    onSwitchToTab("details");
                  }}
                  className="p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="min-w-0 space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-100 truncate">{loan.name}</h4>
                    <span className="text-[10px] text-slate-400 block truncate">
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
                        return loan.type;
                      })()} • {loan.interestRate}% APR
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold text-white block">
                      {formatCurrency(loan.outstandingBalance || loan.outstandingPrincipal)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      EMI: {formatCurrency(getLoanEmi(loan))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
