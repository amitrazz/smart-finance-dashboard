import React from "react";
import {
  useDashboard,
  useNetWorthHistory,
  useInsights,
} from "../../hooks/useFinanceQueries";
import { formatCurrency, formatPercent } from "../../utils/formatters";
import { useUIStore } from "../../store/useUIStore";
import { OnboardingWidget } from "../onboarding/OnboardingWidget";
import {
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Zap,
  ChevronRight,
  AlertCircle,
  PiggyBank,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

export const DashboardView: React.FC = () => {
  const { data: dashboard, isLoading, isError, error, refetch } = useDashboard();
  const { data: netWorthHistoryData } = useNetWorthHistory();
  const { data: insightsData } = useInsights();
  const { setActiveTab } = useUIStore();

  const netWorthHistory = Array.isArray(netWorthHistoryData)
    ? netWorthHistoryData
    : [];

  const fallbackInsights = Array.isArray(insightsData) ? insightsData : [];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-900/60 rounded-2xl border border-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 bg-slate-900/60 rounded-2xl border border-slate-800" />
          ))}
        </div>
        <div className="h-72 bg-slate-900/60 rounded-2xl border border-slate-800" />
      </div>
    );
  }

  if (isError || !dashboard) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Failed to Load Dashboard</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not fetch dashboard analytics from backend."}
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

  const monthlySpend = dashboard.thisMonthSpend || dashboard.monthlySpend || { amount: "0.00", currency: "INR" };
  const monthlyIncome = dashboard.monthlyIncome || { amount: "0.00", currency: "INR" };
  const cashPosition = dashboard.cashPosition || { amount: "0.00", currency: "INR" };
  const healthScore = dashboard.financialHealthScore ?? dashboard.healthScore ?? 0;
  const activeInsights = dashboard.topInsights?.length ? dashboard.topInsights : dashboard.insights?.length ? dashboard.insights : fallbackInsights;

  const chartData = netWorthHistory.map((item) => ({
    date: item.date ? new Date(item.date).toLocaleDateString("en-IN", { month: "short" }) : "—",
    NetWorth: parseFloat(item.netWorth?.amount || "0"),
    Assets: parseFloat(item.totalAssets?.amount || "0"),
    Liabilities: parseFloat(item.totalLiabilities?.amount || "0"),
  }));

  const latestHistory = netWorthHistory.length > 0 ? netWorthHistory[netWorthHistory.length - 1] : null;
  const breakdown = latestHistory?.breakdown;

  const pieData = breakdown
    ? [
        { name: "Liquid Cash", value: parseFloat(breakdown.liquidCash?.amount || "0"), color: "#10b981" },
        { name: "Investments", value: parseFloat(breakdown.investments?.amount || "0"), color: "#6366f1" },
        { name: "Real Estate", value: parseFloat(breakdown.realEstate?.amount || "0"), color: "#f59e0b" },
      ].filter((item) => item.value > 0)
    : [
        { name: "Cash Position", value: parseFloat(cashPosition.amount || "0"), color: "#10b981" },
        { name: "Net Surplus", value: Math.max(0, parseFloat(monthlyIncome.amount || "0") - parseFloat(monthlySpend.amount || "0")), color: "#6366f1" },
      ];

  const netSurplus = parseFloat(monthlyIncome.amount || "0") - parseFloat(monthlySpend.amount || "0");

  return (
    <div className="space-y-8">
      {/* Onboarding Setup Progress Banner */}
      <OnboardingWidget />

      {/* Top Banner Hero */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1">
              <Zap className="w-3.5 h-3.5" /> Single Source of Financial Truth
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight">
              {formatCurrency(dashboard.netWorth)}
            </h2>
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
              <span>Current Net Worth</span>
              <span className="text-emerald-400 font-semibold flex items-center text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <TrendingUp className="w-3 h-3 mr-1" /> Live backend snapshot
              </span>
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 backdrop-blur-md">
            <div>
              <p className="text-xs text-slate-400">Cash Position</p>
              <p className="text-base font-bold text-slate-100">{formatCurrency(cashPosition)}</p>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <p className="text-xs text-slate-400">Savings Rate</p>
              <p className="text-base font-bold text-emerald-400">{formatPercent(dashboard.savingsRate ?? 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Income */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Monthly Income</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-100 mt-2">{formatCurrency(monthlyIncome)}</p>
          <p className="text-xs text-emerald-400 font-medium mt-1">Total Inflow This Month</p>
        </div>

        {/* Monthly Spend */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Monthly Spending</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-100 mt-2">{formatCurrency(monthlySpend)}</p>
          <p className="text-xs text-slate-400 font-medium mt-1">Total Outflow This Month</p>
        </div>

        {/* Financial Health Score */}
        <div
          onClick={() => setActiveTab("insights")}
          className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Health Score</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-slate-100">{healthScore}</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <p className="text-xs text-indigo-400 font-medium mt-1 group-hover:underline flex items-center">
            Health Snapshot <ChevronRight className="w-3 h-3 ml-0.5" />
          </p>
        </div>

        {/* Net Savings */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Net Surplus</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-100 mt-2">
            {formatCurrency({ amount: netSurplus.toFixed(2), currency: monthlyIncome.currency || "INR" })}
          </p>
          <p className="text-xs text-teal-400 font-medium mt-1">Available for investments</p>
        </div>
      </div>

      {/* Chart Section & Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Net Worth Trend Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-100">Net Worth Trajectory</h3>
              <p className="text-xs text-slate-400">Snapshot history precomputed by backend analytics engine</p>
            </div>
          </div>
          <div className="h-64 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No historical net worth snapshots available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc" }}
                    formatter={(val: unknown) => [formatCurrency({ amount: String(val), currency: "INR" }), "Net Worth"]}
                  />
                  <Area type="monotone" dataKey="NetWorth" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#nwGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Asset Allocation */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-100">Asset Allocation</h3>
            <p className="text-xs text-slate-400 font-medium">Total Asset Distribution</p>
          </div>
          <div className="h-44 w-full my-2">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No asset allocation data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={4}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="space-y-2">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <span className="text-slate-100 font-semibold">
                  {formatCurrency({ amount: String(item.value), currency: "INR" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Transactions & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-100">Recent Transactions</h3>
            <button onClick={() => setActiveTab("transactions")} className="text-xs font-semibold text-emerald-400 hover:underline">
              View All
            </button>
          </div>
          <div className="space-y-3">
            {!dashboard.recentTransactions || dashboard.recentTransactions.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No recent transactions recorded.</p>
            ) : (
              dashboard.recentTransactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${txn.direction === "INFLOW" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-300"}`}>
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{txn.description}</p>
                      <p className="text-xs text-slate-400">{txn.categoryName || txn.accountName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${txn.direction === "INFLOW" ? "text-emerald-400" : "text-slate-100"}`}>
                      {txn.direction === "INFLOW" ? "+" : "-"}{formatCurrency(txn.amount)}
                    </p>
                    <p className="text-[10px] text-slate-500">{txn.date}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Insights & Actions */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-100">Automated Insights</h3>
            <button onClick={() => setActiveTab("insights")} className="text-xs font-semibold text-indigo-400 hover:underline">
              View All Rules
            </button>
          </div>
          <div className="space-y-3">
            {activeInsights.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No active insights at present.</p>
            ) : (
              activeInsights.slice(0, 3).map((insight) => (
                <div key={insight.id} className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-2">
                    {insight.severity === "WARNING" ? (
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                    <h4 className="text-sm font-semibold text-slate-200">{insight.title}</h4>
                  </div>
                  <p className="text-xs text-slate-400 pl-6">{insight.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
