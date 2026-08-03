// UI-only chart/display types for the Investments feature. These are not
// backend DTOs (those live in ../../../types, generated from the actual
// finance-service contracts) — just shapes the chart components render.
export interface AllocationBreakdownItem {
  name: string;
  value: number;
  percentage: number;
  color?: string;
}
