import React from "react";
import {
  useDashboard,
  useNetWorthHistory,
  useLiabilitiesSummary,
  useInvestmentReturns,
  useCreditCards,
  useCashFlowAnalytics,
  useTransactions,
} from "../../hooks/useFinanceQueries";
import { OnboardingWidget } from "../onboarding/OnboardingWidget";

import { DashboardHeader } from "./components/DashboardHeader";
import { HeroNetWorthCard } from "./components/HeroNetWorthCard";
import { KPIGrid } from "./components/KPIGrid";
import { SpendingOverview } from "./components/SpendingOverview";
import { CashFlowCard } from "./components/CashFlowCard";
import { UpcomingEventsTimeline } from "./components/UpcomingEventsTimeline";
import { TransactionFeed } from "./components/TransactionFeed";
import { AIInsightsCard } from "./components/AIInsightsCard";
import { BudgetProgressCard } from "./components/BudgetProgressCard";
import { InvestmentSummaryCard } from "./components/InvestmentSummaryCard";
import { GoalsGrid } from "./components/GoalsGrid";
import { SubscriptionOverviewCard } from "./components/SubscriptionOverviewCard";
import { FinancialHealthCard } from "./components/FinancialHealthCard";
import { EmptyDashboardState } from "./components/EmptyDashboardState";
import { DashboardSkeleton } from "./components/DashboardSkeleton";
import { AddTransactionModal } from "./components/AddTransactionModal";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { CreditCard } from "../../types";

export const DashboardView: React.FC = () => {
  const { data: dashboard, isLoading, isError, error, refetch } = useDashboard();
  const { data: netWorthHistoryData } = useNetWorthHistory();
  const { data: liabilitiesData } = useLiabilitiesSummary();
  const { data: investmentReturnsData } = useInvestmentReturns();
  const { data: creditCardsData = [] } = useCreditCards();
  // The dashboard endpoint has no monthlyIncome/savingsRate fields — the
  // monthly cash-flow snapshot is the real backend source for both.
  const { data: cashFlowData } = useCashFlowAnalytics();
  const { data: recentTransactions = [] } = useTransactions({ limit: 1 });

  const netWorthHistory = Array.isArray(netWorthHistoryData) ? netWorthHistoryData : [];
  const currentCashFlow = Array.isArray(cashFlowData) && cashFlowData.length > 0 ? cashFlowData[0] : undefined;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !dashboard) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/80 border border-rose-500/20 text-center space-y-4 my-8">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Failed to Connect to Financial Engine</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not fetch dashboard analytics from backend."}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Retry Connection
        </button>
      </div>
    );
  }

  const netWorthVal = parseFloat(dashboard.netWorth?.amount || "0");
  const hasSparseData = netWorthVal === 0 && recentTransactions.length === 0;
  const monthlyIncome = currentCashFlow?.totalIncome;
  const savingsRate = currentCashFlow?.savingsRate;
  const debtCurrency = dashboard.netWorth?.currency || "INR";

  let totalCreditBalance = 0;
  let totalCreditLimit = 0;

  (creditCardsData as CreditCard[]).forEach((card) => {
    const balanceStr = typeof card.currentOutstanding === "object" ? card.currentOutstanding?.amount : String(card.currentOutstanding || "0");
    const limitStr = typeof card.creditLimit === "object" ? card.creditLimit?.amount : String(card.creditLimit || "0");
    totalCreditBalance += parseFloat(balanceStr || "0");
    totalCreditLimit += parseFloat(limitStr || "0");
  });

  const realCreditUtilization = totalCreditLimit > 0 ? (totalCreditBalance / totalCreditLimit) * 100 : 0;

  return (
    <div className="space-y-8 w-full pb-16">
      {/* Quick Add Transaction Modal */}
      <AddTransactionModal />

      {/* Top Header Bar */}
      <DashboardHeader />

      {/* Onboarding Setup Progress Banner */}
      <OnboardingWidget />

      {/* Hero Net Worth Card (Full Width) */}
      <HeroNetWorthCard
        netWorth={dashboard.netWorth}
        cashPosition={dashboard.cashPosition}
        savingsRate={savingsRate}
        netWorthHistory={netWorthHistory}
      />

      {/* Empty State Onboarding if data is sparse */}
      {hasSparseData && <EmptyDashboardState />}

      {/* 8-Metric Performance KPI Grid (Full Width) */}
      <KPIGrid
        cashPosition={dashboard.cashPosition}
        monthlyIncome={monthlyIncome}
        monthlySpend={dashboard.thisMonthSpend}
        savingsRate={savingsRate}
        totalInvestments={
          investmentReturnsData && investmentReturnsData.length > 0
            ? { amount: investmentReturnsData[0].totalMarketValue, currency: "INR" }
            : undefined
        }
        totalDebt={liabilitiesData ? { amount: liabilitiesData.totalDebt, currency: debtCurrency } : undefined}
        creditUtilizationPercent={realCreditUtilization}
        upcomingDuesCount={dashboard.topActions?.length || 0}
      />

      {/* Section Row 1: Spending Overview & Financial Health Index (2 Equal 50/50 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div className="flex">
          <SpendingOverview />
        </div>
        <div className="flex">
          <FinancialHealthCard />
        </div>
      </div>

      {/* Section Row 2: Cash Flow Allocation & AI Copilot (2 Equal 50/50 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div className="flex">
          <CashFlowCard
            monthlyIncome={monthlyIncome}
            monthlySpend={dashboard.thisMonthSpend}
            savingsRate={savingsRate}
          />
        </div>
        <div className="flex">
          <AIInsightsCard />
        </div>
      </div>

      {/* Section Row 3: Activity Feed & Upcoming Events (2 Equal 50/50 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div className="flex">
          <TransactionFeed />
        </div>
        <div className="flex">
          <UpcomingEventsTimeline upcomingBills={dashboard.upcomingBills} />
        </div>
      </div>

      {/* Section Row 4: Category Budgets & Investment Snapshot (2 Equal 50/50 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div className="flex">
          <BudgetProgressCard />
        </div>
        <div className="flex">
          <InvestmentSummaryCard />
        </div>
      </div>

      {/* Section Row 5: Financial Goals & Subscriptions Overview (2 Equal 50/50 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div className="flex">
          <GoalsGrid />
        </div>
        <div className="flex">
          <SubscriptionOverviewCard />
        </div>
      </div>
    </div>
  );
};
