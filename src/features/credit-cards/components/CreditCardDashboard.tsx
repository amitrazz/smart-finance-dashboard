import React, { useMemo } from "react";
import {
  CreditCard,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Calendar,
  Percent,
  Award,
  Layers,
  CheckCircle2,
  RefreshCw,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipValueType,
} from "recharts";
import { useCreditCardDashboard, useCreditCards } from "../hooks/useCreditCardQueries";
import { formatCurrency } from "../../../utils/formatters";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#f43f5e"];

const getAmountVal = (item: unknown): number => {
  if (typeof item === "number") return item;
  if (typeof item === "string") return parseFloat(item) || 0;
  if (typeof item === "object" && item !== null) {
    const obj = item as Record<string, unknown>;
    if (typeof obj.amount === "number") return obj.amount;
    if (typeof obj.amount === "string") return parseFloat(obj.amount) || 0;
    if (typeof obj.amount === "object" && obj.amount !== null) {
      return parseFloat((obj.amount as Record<string, unknown>).amount as string) || 0;
    }
    if (typeof obj.value === "number") return obj.value;
    if (typeof obj.value === "string") return parseFloat(obj.value) || 0;
  }
  return 0;
};

export const CreditCardDashboard: React.FC<{ onAddCard?: () => void }> = ({ onAddCard }) => {
  const { data: dashboard, isLoading, isError, error, refetch } = useCreditCardDashboard();
  const { data: cards = [] } = useCreditCards();

  // 1. Outstanding Balance by Card (derived client-side; backend dashboard has no trend endpoint)
  const cardBalancesData = useMemo(() => {
    if (cards && cards.length > 0) {
      return cards.map((c) => ({
        name: c.nickname || c.issuer || "Credit Card",
        value: getAmountVal(c.currentOutstanding),
      }));
    }
    return [];
  }, [cards]);

  // 2. Outstanding Distribution by Issuer
  const issuerDistributionData = useMemo(() => {
    if (cards && cards.length > 0) {
      const map = new Map<string, number>();
      cards.forEach((c) => {
        const issuer = c.issuer || "Other Bank";
        const amt = getAmountVal(c.currentOutstanding);
        map.set(issuer, (map.get(issuer) || 0) + amt);
      });
      return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    }
    return [];
  }, [cards]);

  // 3. Cards by Status
  const cardsByStatusData = useMemo(() => {
    const byStatus = dashboard?.cardsByStatus || {};
    return Object.entries(byStatus).map(([name, value]) => ({ name, value }));
  }, [dashboard]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-2">
        <div className="h-10 bg-slate-800/80 rounded-xl w-1/4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-900/60 rounded-2xl border border-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-900/60 rounded-3xl border border-slate-800" />
          <div className="h-64 bg-slate-900/60 rounded-3xl border border-slate-800" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-10 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Failed to load Credit Card Dashboard</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "An error occurred while communicating with the server."}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const totalCards = Object.values(dashboard.cardsByStatus || {}).reduce((sum, n) => sum + n, 0);
  const activeCards = dashboard.cardsByStatus?.ACTIVE || 0;
  const blockedCards = dashboard.cardsByStatus?.BLOCKED || 0;
  const utilizationPercent = (parseFloat(dashboard.utilization || "0") || 0) * 100;

  const kpis = [
    {
      title: "Total Outstanding",
      value: formatCurrency(dashboard.totalOutstanding),
      subtext: "Current credit card balance",
      icon: <DollarSign className="w-5 h-5 text-rose-400" />,
      bg: "bg-rose-500/10 border-rose-500/20",
    },
    {
      title: "Total Credit Limit",
      value: formatCurrency(dashboard.totalCreditLimit),
      subtext: "Across all active cards",
      icon: <CreditCard className="w-5 h-5 text-indigo-400" />,
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      title: "Available Credit",
      value: formatCurrency(dashboard.totalAvailableCredit),
      subtext: "Remaining borrowing limit",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Credit Utilization",
      value: `${utilizationPercent.toFixed(1)}%`,
      subtext: utilizationPercent > 30 ? "High Utilization Warning" : "Healthy Range (<30%)",
      icon: <Percent className="w-5 h-5 text-amber-400" />,
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Statement Balance",
      value: formatCurrency(dashboard.totalStatementBalance),
      subtext: "Total billed statement dues",
      icon: <Calendar className="w-5 h-5 text-purple-400" />,
      bg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "Minimum Due",
      value: formatCurrency(dashboard.totalMinimumDue),
      subtext: "Mandatory minimum payment",
      icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
      bg: "bg-rose-500/10 border-rose-500/20",
    },
    {
      title: "Upcoming Payment",
      value: dashboard.nextDue
        ? formatCurrency(dashboard.nextDue.statementBalance)
        : "No Dues",
      subtext: dashboard.nextDue
        ? `Due ${dashboard.nextDue.dueDate} (${dashboard.nextDue.cardNickname})`
        : "All cards up to date",
      icon: <Calendar className="w-5 h-5 text-cyan-400" />,
      bg: "bg-cyan-500/10 border-cyan-500/20",
    },
    {
      title: "Active Cards",
      value: `${activeCards} / ${totalCards}`,
      subtext: `${blockedCards} blocked cards`,
      icon: <CreditCard className="w-5 h-5 text-indigo-400" />,
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      title: "Reward Points",
      value: (dashboard.totalRewardPoints || 0).toLocaleString(),
      subtext: "Available for redemption",
      icon: <Award className="w-5 h-5 text-amber-400" />,
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Active EMIs",
      value: dashboard.activeEmiCount || 0,
      subtext: "Ongoing installment plans",
      icon: <TrendingUp className="w-5 h-5 text-teal-400" />,
      bg: "bg-teal-500/10 border-teal-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
            <Zap className="w-3.5 h-3.5" /> Live Backend Personal Finance OS Engine
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Credit Portfolio Executive Summary</h2>
          <p className="text-xs text-slate-400">
            Centralized monitoring for credit utilization, billing cycles, active EMIs, and reward point accumulation.
          </p>
        </div>
        {onAddCard && (
          <button
            onClick={onAddCard}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/20 shrink-0"
          >
            + Add New Card
          </button>
        )}
      </div>

      {/* Executive KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">{kpi.title}</span>
              <div className={`p-2 rounded-xl border ${kpi.bg}`}>{kpi.icon}</div>
            </div>
            <div className="mt-3">
              <p className="text-xl font-extrabold text-slate-100">{kpi.value}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">{kpi.subtext}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Data-Driven Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Interest & Fees This Month */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" /> Interest & Fees This Month
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Interest Charged", value: getAmountVal(dashboard.interestThisMonth) },
                  { name: "Fees Charged", value: getAmountVal(dashboard.feesThisMonth) },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${v.toLocaleString()}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc" }}
                  formatter={(val: TooltipValueType | undefined) => [`₹${Number(val).toLocaleString()}`, "Amount"]}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Cards by Status */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Percent className="w-4 h-4 text-amber-400" /> Cards by Status
          </h3>
          <div className="h-60 w-full">
            {cardsByStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cardsByStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }: { name?: string; value?: number }) => `${name || ""} (${value || 0})`}
                  >
                    {cardsByStatusData.map((_, index) => (
                      <Cell key={`cell-status-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc" }}
                    formatter={(val: TooltipValueType | undefined) => [`${val} card(s)`, "Count"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">No cards found</div>
            )}
          </div>
        </div>

        {/* 3. Outstanding by Card */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" /> Outstanding Balance by Card
          </h3>
          <div className="h-60 w-full">
            {cardBalancesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cardBalancesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${v.toLocaleString()}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc" }}
                    formatter={(val: TooltipValueType | undefined) => [`₹${Number(val).toLocaleString()}`, "Outstanding"]}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">No card balance dataset available</div>
            )}
          </div>
        </div>

        {/* 4. Outstanding by Issuer */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" /> Outstanding Distribution by Issuer
          </h3>
          <div className="h-60 w-full">
            {issuerDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={issuerDistributionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name || ""} (${((percent || 0) * 100).toFixed(0)}%)`}
                  >
                    {issuerDistributionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc" }}
                    formatter={(val: TooltipValueType | undefined) => [`₹${Number(val).toLocaleString()}`, "Outstanding"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">No issuer dataset available</div>
            )}
          </div>
        </div>

        {/* 5. Recently Paid */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400" /> Recently Paid
          </h3>
          <div className="h-60 w-full overflow-y-auto">
            {dashboard.recentlyPaid && dashboard.recentlyPaid.length > 0 ? (
              <div className="divide-y divide-slate-800/60">
                {dashboard.recentlyPaid.map((p) => (
                  <div key={p.paymentId} className="flex items-center justify-between py-3 text-xs">
                    <div>
                      <p className="font-semibold text-slate-200">{p.cardNickname}</p>
                      <p className="text-[11px] text-slate-500">{p.paidDate}</p>
                    </div>
                    <span className="font-bold text-emerald-400">{formatCurrency(p.paidAmount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">No recent payments</div>
            )}
          </div>
        </div>

        {/* 6. Active EMI Summary */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-rose-400" /> Active EMI Summary
          </h3>
          <div className="h-60 w-full flex flex-col items-center justify-center gap-4">
            {dashboard.activeEmiCount > 0 ? (
              <>
                <p className="text-3xl font-extrabold text-slate-100">{dashboard.activeEmiCount}</p>
                <p className="text-xs text-slate-400">Active installment plans</p>
                <p className="text-lg font-bold text-amber-400">{formatCurrency(dashboard.activeEmiTotalRemaining)}</p>
                <p className="text-[11px] text-slate-500">Total remaining principal</p>
              </>
            ) : (
              <div className="text-xs text-slate-500">No active EMIs</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
