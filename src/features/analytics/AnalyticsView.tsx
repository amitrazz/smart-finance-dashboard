import React, { useMemo, useState } from "react";
import {
  useCashFlow,
  useNetWorthHistory,
  useTransactions,
  useInvestmentReturns,
  useAssetAllocation,
  useDebtBreakdown,
  useIncomeTrend,
  useExpenseTrendAnalytics,
  useRetirementForecast,
} from "../../hooks/useFinanceQueries";
import { formatCurrency, formatPercent } from "../../utils/formatters";
import { Money, Transaction, CashFlowSnapshot } from "../../types";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";

export const AnalyticsView: React.FC = () => {
  const { data: cashFlow, isLoading: loadingCashFlow, isError: errorCashFlow, refetch: refetchCashFlow } = useCashFlow();
  const { data: netWorthHistory = [] } = useNetWorthHistory();
  const { data: txnsResponse } = useTransactions();

  const { data: investmentReturns } = useInvestmentReturns();
  const { data: assetAllocation } = useAssetAllocation();
  const { data: debtBreakdown } = useDebtBreakdown();
  const { data: incomeTrend } = useIncomeTrend();
  const { data: expenseTrend } = useExpenseTrendAnalytics();

  const [currentAgeInput, setCurrentAgeInput] = useState<number>(30);
  const [retirementAgeInput, setRetirementAgeInput] = useState<number>(60);
  const [expectedReturnInput, setExpectedReturnInput] = useState<string>("8");

  const { data: retirementForecast } = useRetirementForecast({
    currentAge: currentAgeInput,
    retirementAge: retirementAgeInput,
    expectedReturnPercent: expectedReturnInput,
  });

  // Dynamic fallback calculation if precomputed cash flow snapshot is null
  const activeCashFlow = useMemo<CashFlowSnapshot>(() => {
    if (cashFlow && !Array.isArray(cashFlow)) return cashFlow;
    if (Array.isArray(cashFlow) && cashFlow.length > 0) return cashFlow[0];

    const transactions: Transaction[] = Array.isArray(txnsResponse)
      ? (txnsResponse as Transaction[])
      : [];

    let incomeAcc = 0;
    let expenseAcc = 0;
    const catMap: Record<string, number> = {};

    transactions.forEach((t) => {
      const val = Math.abs(parseFloat(t.amount?.amount || "0") || 0);
      if (t.direction === "INFLOW") {
        incomeAcc += val;
      } else if (t.direction === "OUTFLOW") {
        expenseAcc += val;
        const cat = t.categoryName || "Uncategorized";
        catMap[cat] = (catMap[cat] || 0) + val;
      }
    });

    const netSavingsVal = incomeAcc - expenseAcc;
    const savingsRateVal = incomeAcc > 0 ? (netSavingsVal / incomeAcc) * 100 : 0;

    const categoryBreakdown: Array<{ categoryId: string; categoryName: string; amount: Money; percentage: number }> = Object.entries(catMap).map(([categoryName, amt], idx) => ({
      categoryId: `cat_${idx}`,
      categoryName,
      amount: { amount: amt.toFixed(2), currency: "INR" },
      percentage: expenseAcc > 0 ? Math.round((amt / expenseAcc) * 100) : 0,
    }));

    return {
      period: "Current Month",
      totalIncome: { amount: incomeAcc.toFixed(2), currency: "INR" },
      totalExpense: { amount: expenseAcc.toFixed(2), currency: "INR" },
      netSavings: { amount: netSavingsVal.toFixed(2), currency: "INR" },
      savingsRate: savingsRateVal,
      categoryBreakdown,
    };
  }, [cashFlow, txnsResponse]);

  const incomeExpenseTrendData = useMemo(() => {
    if (!incomeTrend?.length && !expenseTrend?.length) return null;

    const byPeriod = new Map<string, { month: string; Income: number; Expense: number }>();
    const getEntry = (periodStart: string) => {
      const key = periodStart.slice(0, 7);
      let entry = byPeriod.get(key);
      if (!entry) {
        entry = {
          month: new Date(periodStart).toLocaleDateString("en-IN", { month: "short" }),
          Income: 0,
          Expense: 0,
        };
        byPeriod.set(key, entry);
      }
      return entry;
    };

    (incomeTrend || []).forEach((p) => {
      getEntry(p.periodStart).Income = parseFloat(p.amount || "0");
    });
    (expenseTrend || []).forEach((p) => {
      getEntry(p.periodStart).Expense = parseFloat(p.amount || "0");
    });

    return Array.from(byPeriod.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, entry]) => ({ ...entry, Savings: entry.Income - entry.Expense }));
  }, [incomeTrend, expenseTrend]);

  if (loadingCashFlow) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-28 bg-slate-900/60 rounded-2xl border border-slate-800" />
          <div className="h-28 bg-slate-900/60 rounded-2xl border border-slate-800" />
          <div className="h-28 bg-slate-900/60 rounded-2xl border border-slate-800" />
        </div>
        <div className="h-72 bg-slate-900/60 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  if (errorCashFlow) {
    return (
      <div className="p-8 rounded-3xl bg-rose-950/30 border border-rose-800/50 text-center space-y-4">
        <p className="text-rose-300 font-semibold">Failed to load financial analytics</p>
        <button
          onClick={() => refetchCashFlow()}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium text-xs transition"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  const cfSnapshot = activeCashFlow;

  const monthlyTrendData = netWorthHistory.length > 0
    ? netWorthHistory.map((h) => ({
        month: new Date(h.date).toLocaleDateString("en-IN", { month: "short" }),
        Income: parseFloat(cfSnapshot.totalIncome?.amount || "0"),
        Expense: parseFloat(cfSnapshot.totalExpense?.amount || "0"),
        Savings: parseFloat(cfSnapshot.netSavings?.amount || "0"),
      }))
    : [
        {
          month: cfSnapshot.period || "Current",
          Income: parseFloat(cfSnapshot.totalIncome?.amount || "0"),
          Expense: parseFloat(cfSnapshot.totalExpense?.amount || "0"),
          Savings: parseFloat(cfSnapshot.netSavings?.amount || "0"),
        },
      ];

  const categoryBreakdown = Array.isArray(cfSnapshot.categoryBreakdown) ? cfSnapshot.categoryBreakdown : [];

  const pieData = categoryBreakdown.map((c, idx) => ({
    name: c.categoryName,
    value: parseFloat(c.amount?.amount || "0"),
    color: ["#10b981", "#6366f1", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"][idx % 6],
  }));

  const assetAllocData = Array.isArray(assetAllocation?.allocations)
    ? assetAllocation.allocations.map((a, idx) => ({
        name: a.assetClass,
        value: parseFloat(a.amount?.amount || "0"),
        color: ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"][idx % 5],
      }))
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Financial Analytics & Cash Flow Trends</h2>
        <p className="text-xs text-slate-400">Comprehensive snapshot analytics over cash flow, asset allocation, investment returns & debt</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-slate-400">Total Income</p>
            {cfSnapshot.isCurrentPeriod && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                In progress
              </span>
            )}
          </div>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{formatCurrency(cfSnapshot.totalIncome)}</p>
          {cfSnapshot.isCurrentPeriod && (
            <p className="text-[11px] text-slate-500 mt-1">
              {cfSnapshot.incomeStillExpected === true
                ? "This month isn't over yet — expected income hasn't landed."
                : "This month is still in progress — not a confirmed final total."}
            </p>
          )}
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Total Expenses</p>
          <p className="text-2xl font-extrabold text-rose-400 mt-1">{formatCurrency(cfSnapshot.totalExpense)}</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Net Savings Surplus</p>
          <p className="text-2xl font-extrabold text-teal-400 mt-1">{formatCurrency(cfSnapshot.netSavings)}</p>
          <p className="text-xs text-teal-400 font-semibold">{formatPercent(cfSnapshot.savingsRate)} Savings Rate</p>
        </div>
      </div>

      {/* Backend Analytics Widgets Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Investment Returns Card */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h3 className="font-bold text-base text-slate-100">Investment Returns</h3>
          {investmentReturns && investmentReturns.length > 0 ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Total Value</span>
                <span className="font-bold text-slate-200">{formatCurrency(investmentReturns[0].totalMarketValue)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Unrealized Gain</span>
                <span className="font-bold text-emerald-400">{formatCurrency(investmentReturns[0].totalUnrealizedGain)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">XIRR</span>
                <span className="font-bold text-indigo-400">
                  {investmentReturns[0].xirr !== null
                    ? formatPercent(parseFloat(investmentReturns[0].xirr) * 100)
                    : "—"}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Live portfolio returns calculated from active holdings.</p>
          )}
        </div>

        {/* Debt Breakdown Card */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h3 className="font-bold text-base text-slate-100">Debt Breakdown</h3>
          {debtBreakdown ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Total Outstanding Debt</span>
                <span className="font-bold text-rose-400">{formatCurrency(debtBreakdown.totalDebt)}</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Active loans & credit obligations tracked</p>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Debt analysis across active loans and credit cards.</p>
          )}
        </div>

        {/* Retirement Forecast Card */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h3 className="font-bold text-base text-slate-100">Retirement Projection</h3>
          <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 block">Age</label>
              <input
                type="number"
                value={currentAgeInput}
                onChange={(e) => setCurrentAgeInput(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block">Target</label>
              <input
                type="number"
                value={retirementAgeInput}
                onChange={(e) => setRetirementAgeInput(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block">Return %</label>
              <input
                type="text"
                value={expectedReturnInput}
                onChange={(e) => setExpectedReturnInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-slate-200"
              />
            </div>
          </div>
          {retirementForecast?.projectedCorpus && (
            <div className="text-xs flex justify-between items-center pt-1 border-t border-slate-800/60">
              <span className="text-slate-400">Projected Corpus:</span>
              <span className="font-bold text-emerald-400 text-sm">{formatCurrency(retirementForecast.projectedCorpus)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Income vs Expense Trend */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="font-bold text-base text-slate-100">Income vs Expense Trend</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incomeExpenseTrendData && incomeExpenseTrendData.length > 0 ? incomeExpenseTrendData : monthlyTrendData}>
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                tickFormatter={(v) => {
                  const n = typeof v === "number" ? v : parseFloat(String(v || "0")) || 0;
                  return `₹${(n / 1000).toFixed(0)}k`;
                }}
              />
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }} />
              <Legend wrapperStyle={{ paddingTop: "10px" }} />
              <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Savings" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Asset Allocation & Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <h3 className="font-bold text-base text-slate-100">Category Spend Distribution</h3>
          <div className="h-56 w-full my-2">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No category breakdown available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" paddingAngle={4}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <h3 className="font-bold text-base text-slate-100">Asset Allocation Breakdown</h3>
          <div className="h-56 w-full my-2">
            {assetAllocData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Asset allocation precomputed per asset class.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={assetAllocData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" paddingAngle={4}>
                    {assetAllocData.map((entry, index) => (
                      <Cell key={`cell-alloc-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
