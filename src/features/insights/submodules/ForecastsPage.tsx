import React, { useState } from "react";
import { useForecastAnalytics } from "../hooks/useInsightsQueries";
import { AnalyticsHeader } from "../components/AnalyticsHeader";
import { ForecastChart } from "../components/ForecastChart";
import { TimeHorizon } from "../types/insightsTypes";
import { CheckCircle2 } from "lucide-react";

export const ForecastsPage: React.FC = () => {
  const [horizon, setHorizon] = useState<TimeHorizon>("1Y");
  const { data: forecast, isLoading } = useForecastAnalytics(horizon);

  if (isLoading || !forecast) return null;

  return (
    <div className="space-y-8">
      <AnalyticsHeader
        title="Predictive Wealth & Cash Flow Forecasts"
        description="Statistical model projections across 30 Days, 90 Days, 6 Months, 1 Year, and 3 Years"
        horizon={horizon}
        onHorizonChange={(h) => setHorizon(h)}
      />

      <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300 flex items-center justify-between">
        <span className="font-semibold flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Forecast Confidence Score: <strong>{forecast.confidenceScorePercent}% Confidence</strong>
        </span>
        <span>Models updated daily based on live recurring transactions & SIPs</span>
      </div>

      <ForecastChart data={forecast.forecasts} title={`Wealth Forecast Horizon (${horizon})`} />
    </div>
  );
};
