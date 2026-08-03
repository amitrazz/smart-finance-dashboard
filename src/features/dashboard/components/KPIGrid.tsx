import React from "react";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  PieChart,
  ShieldAlert,
  CreditCard,
  Calendar,
} from "lucide-react";
import { MetricCard } from "./MetricCard";
import { formatCurrency, formatPercent } from "../../../utils/formatters";
import { useUIStore } from "../../../store/useUIStore";
import { Money } from "../../../types";

interface KPIGridProps {
  cashPosition?: Money;
  monthlyIncome?: Money;
  monthlySpend?: Money;
  savingsRate?: number;
  totalInvestments?: Money;
  totalDebt?: Money;
  creditUtilizationPercent?: number;
  upcomingDuesCount?: number;
  upcomingDuesTotal?: Money;
}

export const KPIGrid: React.FC<KPIGridProps> = ({
  cashPosition,
  monthlyIncome,
  monthlySpend,
  savingsRate,
  totalInvestments,
  totalDebt,
  creditUtilizationPercent,
  upcomingDuesCount,
}) => {
  const { setActiveTab } = useUIStore();

  const currency = cashPosition?.currency || "INR";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
          Financial Performance Metrics
        </h3>
        <span className="text-[10px] text-slate-400 font-mono">Live API Feeds</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Cash Balance */}
        <MetricCard
          title="Cash Balance"
          value={formatCurrency(cashPosition || { amount: "0", currency })}
          subtitle="Liquid Cash & Bank"
          delta="Real-Time"
          isPositiveDelta={true}
          icon={<Wallet className="w-4 h-4 text-emerald-400" />}
          onClick={() => setActiveTab("accounts")}
        />

        {/* 2. Monthly Income */}
        <MetricCard
          title="Monthly Income"
          value={formatCurrency(monthlyIncome || { amount: "0", currency })}
          subtitle="Inflow This Month"
          delta="Current Period"
          isPositiveDelta={true}
          icon={<ArrowDownLeft className="w-4 h-4 text-emerald-400" />}
          onClick={() => setActiveTab("analytics")}
        />

        {/* 3. Monthly Expenses */}
        <MetricCard
          title="Monthly Expenses"
          value={formatCurrency(monthlySpend || { amount: "0", currency })}
          subtitle="Outflow This Month"
          delta="Current Period"
          isPositiveDelta={false}
          icon={<ArrowUpRight className="w-4 h-4 text-rose-400" />}
          onClick={() => setActiveTab("planning", "budgets")}
        />

        {/* 4. Savings Rate */}
        <MetricCard
          title="Savings Rate"
          value={formatPercent(savingsRate || 0)}
          subtitle="Target: > 30%"
          delta={savingsRate && savingsRate >= 30 ? "Healthy" : "Active Tracking"}
          isPositiveDelta={savingsRate ? savingsRate >= 25 : false}
          icon={<PiggyBank className="w-4 h-4 text-teal-400" />}
          progressPercent={savingsRate || 0}
          progressBarColor={savingsRate && savingsRate >= 30 ? "bg-emerald-500" : "bg-amber-500"}
          onClick={() => setActiveTab("analytics")}
        />

        {/* 5. Investments */}
        <MetricCard
          title="Total Investments"
          value={formatCurrency(totalInvestments || { amount: "0", currency })}
          subtitle="Portfolio Assets"
          delta="Portfolio Value"
          isPositiveDelta={true}
          icon={<PieChart className="w-4 h-4 text-indigo-400" />}
          onClick={() => setActiveTab("investments")}
        />

        {/* 6. Loans & Debt */}
        <MetricCard
          title="Loans & Debt"
          value={formatCurrency(totalDebt || { amount: "0", currency })}
          subtitle="Outstanding Principal"
          delta="Live Liability"
          isPositiveDelta={false}
          icon={<ShieldAlert className="w-4 h-4 text-amber-400" />}
          onClick={() => setActiveTab("loans")}
        />

        {/* 7. Credit Utilization */}
        <MetricCard
          title="Credit Usage"
          value={formatPercent(creditUtilizationPercent || 0)}
          subtitle="Limit Used"
          delta={creditUtilizationPercent && creditUtilizationPercent <= 30 ? "Ideal <30%" : "High Usage"}
          isPositiveDelta={creditUtilizationPercent ? creditUtilizationPercent <= 30 : true}
          icon={<CreditCard className="w-4 h-4 text-purple-400" />}
          progressPercent={creditUtilizationPercent || 0}
          progressBarColor={creditUtilizationPercent && creditUtilizationPercent <= 30 ? "bg-purple-500" : "bg-rose-500"}
          onClick={() => setActiveTab("accounts")}
        />

        {/* 8. Scheduled Dues */}
        <MetricCard
          title="Upcoming Dues"
          value={String(upcomingDuesCount || 0)}
          subtitle={upcomingDuesCount ? `${upcomingDuesCount} due next 30 days` : "No urgent dues"}
          delta={upcomingDuesCount && upcomingDuesCount > 0 ? "Action Required" : "All Clear"}
          isPositiveDelta={(upcomingDuesCount || 0) === 0}
          icon={<Calendar className="w-4 h-4 text-sky-400" />}
          onClick={() => setActiveTab("notifications")}
        />
      </div>
    </div>
  );
};
