import React, { useMemo } from "react";

import { motion, Variants } from "framer-motion";
import { useAccounts, useCashPosition, useTransfers } from "../../../hooks/useFinanceQueries";
import { useCreditCards } from "../../credit-cards/hooks/useCreditCardQueries";
import { formatCurrency } from "../../../utils/formatters";
import { BalanceCard } from "../components/BalanceCard";
import { CashSummary } from "../components/CashSummary";
import { AccountCard } from "../components/AccountCard";
import { TransferCard } from "../components/TransferCard";
import { Account, Money } from "../../../types";
import { useUIStore } from "../../../store/useUIStore";
import { type ActiveRoute } from "../components/AccountsNavigation";
import {
  DollarSign, TrendingUp, Landmark, CreditCard as CreditCardIcon,
  AlertTriangle, ArrowRightLeft, BarChart2, Building2, RefreshCw,
} from "lucide-react";

const moneyToNumber = (v?: Money | string | number): number => {
  if (v == null) return 0;
  if (typeof v === "object") return parseFloat(v.amount || "0") || 0;
  return parseFloat(String(v)) || 0;
};

interface AccountsOverviewViewProps {
  onNavigate: (route: ActiveRoute) => void;
  onSelectAccount: (account: Account) => void;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.3, ease: "easeOut" } }),
};

export const AccountsOverviewView: React.FC<AccountsOverviewViewProps> = ({ onNavigate, onSelectAccount }) => {
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: cashPosition } = useCashPosition();
  const { data: transfers = [] } = useTransfers();
  const { data: creditCards = [] } = useCreditCards();

  const totalCash = parseFloat(cashPosition?.totalCash?.amount || "0");
  const institutionCount = cashPosition?.institutionBreakdown?.length || 0;
  const creditTotal = creditCards.reduce((s, c) => s + moneyToNumber(c.currentOutstanding), 0);
  const limitTotal = creditCards.reduce((s, c) => s + moneyToNumber(c.creditLimit), 0);
  const utilPct = limitTotal > 0 ? Math.round((creditTotal / limitTotal) * 100) : 0;

  const topAccounts = [...accounts].sort((a, b) => parseFloat(b.currentBalance?.amount || "0") - parseFloat(a.currentBalance?.amount || "0")).slice(0, 3);

  const accountNameById = useMemo(() => new Map(accounts.map((a) => [a.id, a.name])), [accounts]);
  const recentTransfers = useMemo(
    () =>
      transfers.slice(0, 3).map((t) => ({
        ...t,
        fromAccountName: accountNameById.get(t.fromAccountId) || t.fromAccountId,
        toAccountName: accountNameById.get(t.toAccountId) || t.toAccountId,
      })),
    [transfers, accountNameById]
  );

  const kpiCards = [
    { title: "Total Cash", amount: formatCurrency(totalCash, "INR").replace(/[₹$€£]/g, ""), currency: "₹", subtitle: "All liquid assets", icon: <DollarSign className="w-5 h-5" />, gradient: "from-emerald-500/20 to-teal-500/20" },
    { title: "Accounts Connected", amount: String(accounts.length), currency: "", subtitle: "Across all account types", icon: <TrendingUp className="w-5 h-5" />, gradient: "from-indigo-500/20 to-purple-500/20" },
    { title: "Institutions", amount: String(institutionCount), currency: "", subtitle: "Connected banks & providers", icon: <Building2 className="w-5 h-5" />, gradient: "from-amber-500/20 to-orange-500/20" },
    { title: "Credit Utilization", amount: `${utilPct}%`, currency: "", subtitle: `${formatCurrency(creditTotal, "INR")} outstanding`, icon: <CreditCardIcon className="w-5 h-5" />, gradient: "from-purple-500/20 to-pink-500/20" },
  ];

  if (accountsLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(null).map((_, i) => <div key={i} className="h-36 bg-slate-900/60 rounded-3xl border border-slate-800" />)}
        </div>
        <div className="h-24 bg-slate-900/60 rounded-3xl border border-slate-800" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array(3).fill(null).map((_, i) => <div key={i} className="h-48 bg-slate-900/60 rounded-3xl border border-slate-800" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <motion.div key={card.title} custom={i} variants={cardVariants} initial="hidden" animate="visible">
            <BalanceCard
              title={card.title}
              amount={card.amount}
              currency={card.currency}
              subtitle={card.subtitle}
              icon={card.icon}
              gradient={card.gradient}
              onClick={() => onNavigate("cash-position")}
              actionLabel="View details"
              onAction={() => onNavigate("cash-position")}
            />
          </motion.div>
        ))}
      </div>

      {/* Cash Summary Strip */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
        <CashSummary accounts={accounts} creditCards={creditCards} />
      </motion.div>

      {/* Largest Accounts + Recent Transfers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Accounts */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-indigo-400" />
              Largest Accounts
            </h3>
            <button onClick={() => onNavigate("bank")} className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
              View all →
            </button>
          </div>
          <div className="space-y-3">
            {topAccounts.length > 0 ? topAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onViewDetails={onSelectAccount}
                onTransfer={() => onNavigate("transfers")}
                onStatement={() => onNavigate("statements-overview")}
              />
            )) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                <Landmark className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p>No accounts connected yet.</p>
                <button onClick={() => useUIStore.getState().setAddAccountOpen(true)} className="mt-2 text-emerald-400 hover:text-emerald-300 text-xs font-semibold">Add Account →</button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Transfers */}
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
              Recent Transfers
            </h3>
            <button onClick={() => onNavigate("transfers")} className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
              All transfers →
            </button>
          </div>
          <div className="space-y-3">
            {recentTransfers.length > 0 ? recentTransfers.map((transfer) => (
              <TransferCard key={transfer.id} transfer={transfer} />
            )) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                <ArrowRightLeft className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p>No transfers recorded yet.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Navigation Shortcuts */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {([
          { label: "Cash Position", sub: "Liquidity & allocation", icon: <BarChart2 className="w-5 h-5 text-teal-400" />, target: "cash-position" },
          { label: "Institutions", sub: "Connected banks", icon: <Building2 className="w-5 h-5 text-indigo-400" />, target: "institutions" },
          { label: "Reconciliation", sub: "Pending matches", icon: <AlertTriangle className="w-5 h-5 text-amber-400" />, target: "reconciliation" },
          { label: "Statements", sub: "Downloads & imports", icon: <RefreshCw className="w-5 h-5 text-purple-400" />, target: "statements-overview" },
        ] as Array<{ label: string; sub: string; icon: React.ReactNode; target: ActiveRoute }>).map((item) => (
          <button
            key={item.label}
            onClick={() => onNavigate(item.target)}
            className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 text-left transition-all duration-200 hover:shadow-lg hover:shadow-slate-900/40 group"
          >
            <div className="p-2.5 rounded-xl bg-slate-800/80 w-fit mb-3 group-hover:scale-105 transition-transform">{item.icon}</div>
            <p className="font-bold text-slate-100 text-sm">{item.label}</p>
            <p className="text-xs text-slate-400">{item.sub}</p>
          </button>
        ))}
      </motion.div>
    </div>
  );
};
