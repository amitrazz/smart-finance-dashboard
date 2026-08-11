import React from "react";
import { HealthDimension } from "../../types/insightsTypes";
import { HealthDimensionCard } from "./HealthDimensionCard";
import { EmptyAnalyticsState } from "../common/AnalyticsStates";
import { rankDimensions } from "../../utils/healthRanking";

export const HealthDimensionGrid: React.FC<{ dimensions: HealthDimension[] }> = ({
  dimensions,
}) => {
  if (dimensions.length === 0) {
    return (
      <EmptyAnalyticsState
        title="No dimensions scored"
        message="The health engine hasn't produced a component breakdown yet."
      />
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {rankDimensions(dimensions).map((dimension) => (
        <HealthDimensionCard key={dimension.code} dimension={dimension} />
      ))}
    </div>
  );
};
