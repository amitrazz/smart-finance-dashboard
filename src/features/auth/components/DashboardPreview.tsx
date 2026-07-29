import React from "react";
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  PieChart as PieIcon,
  CreditCard,
  Building2,
  Calendar,
  Sparkles,
  Activity
} from "lucide-react";

export const DashboardPreview: React.FC = () => {
  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 lg:p-12 overflow-hidden select-none">
      {/* Background Decorative Gradients & Grid Lines */}
      <div className="absolute inset-0 bg-grid-slate-800/[0.04] dark:bg-grid-slate-100/[0.03] bg-[bottom_1px_center]" />
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Brand & Tagline */}
      <div className="relative z-10 space-y-4">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-slate-900/60 dark:bg-slate-900/80 border border-slate-700/50 dark:border-slate-800/80 backdrop-blur-md shadow-lg">
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-[10px] text-slate-950 shadow-sm">
            ◉
          </div>
          <span className="text-xs font-bold tracking-widest uppercase text-slate-300">
            PFOS <span className="text-slate-500 font-normal">| Financial Operating System</span>
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Your Complete Financial <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              Operating System
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium pt-1">
            Understand. Organize. Grow your wealth in real-time.
          </p>
        </div>
      </div>

      {/* Mock Operating System Dashboard Window */}
      <div className="relative z-10 my-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700">
        {/* Window Chrome Controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-100/80 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-slate-200/50 dark:bg-slate-800/60 text-[11px] font-mono text-slate-600 dark:text-slate-400 border border-slate-300/30 dark:border-slate-700/30">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>pfos.app/analytics/overview</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-semibold tracking-wider text-emerald-500">LIVE SYNC</span>
          </div>
        </div>

        {/* Dashboard Content Mockup */}
        <div className="p-5 space-y-5 text-slate-900 dark:text-slate-100">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-3 gap-3">
            {/* Net Worth */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/40 relative overflow-hidden group">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Net Worth</span>
                <span className="flex items-center text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" /> +14.2%
                </span>
              </div>
              <div className="text-xl font-extrabold tracking-tight mt-1">₹ 1.82 Cr</div>
              <div className="text-[10px] text-slate-400 mt-1">Updated 2 mins ago</div>
            </div>

            {/* Assets */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/40">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Total Assets</span>
                <Building2 className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <div className="text-xl font-extrabold tracking-tight mt-1 text-teal-600 dark:text-teal-400">
                ₹ 2.45 Cr
              </div>
              <div className="text-[10px] text-slate-400 mt-1">across 12 accounts</div>
            </div>

            {/* Liabilities */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/40">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Liabilities</span>
                <CreditCard className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="text-xl font-extrabold tracking-tight mt-1 text-rose-500 dark:text-rose-400">
                ₹ 63.0 L
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Home Loan & Credit</div>
            </div>
          </div>

          {/* Cash Flow & Asset Allocation Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Monthly Cash Flow & Savings Rate */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" /> Cash Flow (This Month)
                </span>
                <span className="text-emerald-500 text-[11px] font-bold">68% Savings</span>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <div>
                  <div className="text-[10px] text-slate-400">Income</div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹ 4,50,000</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Expenses</div>
                  <div className="text-sm font-bold text-rose-500 dark:text-rose-400">₹ 1,44,000</div>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                <div className="h-full bg-emerald-500 rounded-l-full" style={{ width: "68%" }} />
                <div className="h-full bg-rose-500 rounded-r-full" style={{ width: "32%" }} />
              </div>
            </div>

            {/* Asset Allocation Stack */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <PieIcon className="w-3.5 h-3.5 text-emerald-400" /> Asset Allocation
                </span>
                <span className="text-[10px] font-mono text-slate-400">6 Asset Types</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex gap-0.5">
                <div className="h-full bg-emerald-500" style={{ width: "42%" }} title="Stocks 42%" />
                <div className="h-full bg-teal-400" style={{ width: "28%" }} title="Mutual Funds 28%" />
                <div className="h-full bg-indigo-500" style={{ width: "12%" }} title="FDs 12%" />
                <div className="h-full bg-amber-400" style={{ width: "8%" }} title="Gold 8%" />
                <div className="h-full bg-violet-500" style={{ width: "6%" }} title="Crypto 6%" />
                <div className="h-full bg-slate-400" style={{ width: "4%" }} title="Cash 4%" />
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-600 dark:text-slate-400 pt-0.5">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Stocks 42%</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-teal-400" /> MF 28%</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> FDs 12%</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Gold 8%</span>
              </div>
            </div>
          </div>

          {/* Bottom Row - Recent Activity & Upcoming Bills */}
          <div className="grid grid-cols-2 gap-3">
            {/* Recent Transactions */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/40 space-y-2">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Recent Activity
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/40">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[10px] font-bold">
                      SIP
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">Zerodha Nifty 50 Index</div>
                      <div className="text-[9px] text-slate-400">Investment</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-emerald-500 text-[11px]">+₹ 50,000</span>
                </div>

                <div className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/40">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-500 flex items-center justify-center text-[10px] font-bold">
                      CC
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">HDFC Infinia Statement</div>
                      <div className="text-[9px] text-slate-400">Credit Card</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-rose-500 text-[11px]">-₹ 14,250</span>
                </div>
              </div>
            </div>

            {/* Upcoming Smart Bills */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/40 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <span>Upcoming Obligations</span>
                <Calendar className="w-3 h-3 text-indigo-400" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">HDFC Home Loan EMI</div>
                    <div className="text-[9px] text-amber-500 font-medium">Due in 3 days</div>
                  </div>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">₹ 68,500</span>
                </div>

                <div className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/30">
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">ICICI Health Policy</div>
                    <div className="text-[9px] text-slate-400">Due in 12 days</div>
                  </div>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">₹ 24,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Bullet Strip */}
      <div className="relative z-10 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 pt-2">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> AI Wealth Insights
        </span>
        <span className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" /> Automated Bank Import
        </span>
        <span className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> Real-time Portfolio Sync
        </span>
      </div>
    </div>
  );
};
