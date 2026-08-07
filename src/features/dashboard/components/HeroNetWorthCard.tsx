import React from "react";
import { TrendingUp, PlusCircle, ArrowLeftRight, UploadCloud, ShieldCheck, Zap } from "lucide-react";
import { getMaskedOrFormatted } from "../../../utils/formatters";
import { useUIStore } from "../../../store/useUIStore";
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis } from "recharts";
import { Money, NetWorthSnapshot } from "../../../types";
import { Money as MoneyDisplay } from "../../../components/common/Money";

interface HeroNetWorthCardProps {
  netWorth?: Money;
  cashPosition?: Money;
  savingsRate?: number;
  netWorthHistory?: NetWorthSnapshot[];
}

export const HeroNetWorthCard: React.FC<HeroNetWorthCardProps> = ({
  netWorth,
  cashPosition,
  savingsRate = 0,
  netWorthHistory = [],
}) => {
  const { setAddTransactionOpen, setImportModalOpen, setActiveTab, moneyVisible } = useUIStore();

  const netWorthVal = parseFloat(netWorth?.amount || "0");
  const currency = netWorth?.currency || "INR";

  let monthlyDeltaVal = 0;
  let monthlyDeltaPercent = 0;

  if (netWorthHistory.length >= 2) {
    const latest = parseFloat(netWorthHistory[netWorthHistory.length - 1].netWorth?.amount || "0");
    const prev = parseFloat(netWorthHistory[netWorthHistory.length - 2].netWorth?.amount || "0");
    if (prev !== 0) {
      monthlyDeltaVal = latest - prev;
      monthlyDeltaPercent = (monthlyDeltaVal / Math.abs(prev)) * 100;
    }
  }

  const chartData = netWorthHistory.map((item) => ({
    date: item.date ? new Date(item.date).toLocaleDateString("en-IN", { month: "short" }) : "—",
    NetWorth: parseFloat(item.netWorth?.amount || "0"),
  }));

  const liveSparkline = chartData.length > 0 ? chartData : [
    { date: "Current", NetWorth: netWorthVal }
  ];

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/20 shadow-2xl relative overflow-hidden space-y-6">
      {/* Ambient Glow */}
      <div className="absolute -right-16 -top-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Row */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Stats Column */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-400 uppercase tracking-widest">
            <Zap className="w-3.5 h-3.5" /> Consolidated Net Worth
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-sans whitespace-nowrap">
              <MoneyDisplay value={netWorth || { amount: String(netWorthVal), currency }} />
            </h2>

            {monthlyDeltaVal !== 0 && (
              <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-sm whitespace-nowrap">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>
                  {monthlyDeltaVal >= 0 ? "+" : ""}
                  <MoneyDisplay value={{ amount: String(Math.abs(monthlyDeltaVal)), currency }} className="inline" />
                  {" "}({monthlyDeltaPercent.toFixed(1)}%) this month
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Consolidated live balance across liquid cash, investments, real estate, minus liabilities.
          </p>

          <div className="flex items-center gap-4 pt-1 flex-wrap text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>
                Liquid Cash:{" "}
                <strong className="text-white">
                  <MoneyDisplay value={cashPosition || { amount: "0", currency }} className="inline" />
                </strong>
              </span>
            </div>
            <div className="w-px h-3.5 bg-slate-800 hidden sm:block" />
            <div>
              Savings Rate: <strong className="text-emerald-400">{savingsRate.toFixed(0)}%</strong>
            </div>
          </div>
        </div>

        {/* Right Sparkline Chart */}
        <div className="lg:col-span-5 h-36 relative w-full bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={liveSparkline}>
              <defs>
                <linearGradient id="heroNwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc", fontSize: "12px" }}
                formatter={(val: unknown) => [getMaskedOrFormatted(val, moneyVisible, currency), "Net Worth"]}
              />
              <Area type="monotone" dataKey="NetWorth" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#heroNwGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Horizontal Quick Action Buttons Row */}
      <div className="relative z-10 flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800/80">
        <button
          onClick={() => setAddTransactionOpen(true)}
          type="button"
          className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Transaction</span>
        </button>

        <button
          onClick={() => setActiveTab("transactions", "transfers")}
          type="button"
          className="px-5 py-2.5 rounded-2xl bg-slate-950/80 hover:bg-slate-900 text-slate-200 hover:text-white font-semibold text-xs border border-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
          <span>Transfer / Log</span>
        </button>

        <button
          onClick={() => setImportModalOpen(true)}
          type="button"
          className="px-5 py-2.5 rounded-2xl bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white font-semibold text-xs border border-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <UploadCloud className="w-4 h-4 text-indigo-400" />
          <span>Import Statement</span>
        </button>
      </div>
    </div>
  );
};
