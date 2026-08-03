import React from "react";
import { useIncomeDashboard } from "../hooks/useInvestmentQueries";
import { IncomeCalendarView } from "../components/IncomeCalendarView";
import { CorporateActionTimeline } from "../components/CorporateActionTimeline";

export const IncomeView: React.FC = () => {
  const { data: income, isLoading } = useIncomeDashboard();

  if (isLoading || !income) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-28 bg-slate-900 rounded-3xl" />
        <div className="h-72 bg-slate-900 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Passive Income Stream Visualizations */}
      <IncomeCalendarView data={income} />

      {/* Corporate Action Payout Events */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-100">Dividend & Interest Payout Calendar</h3>
        <CorporateActionTimeline actions={[...income.upcomingEvents, ...income.recentEvents]} />
      </div>
    </div>
  );
};
