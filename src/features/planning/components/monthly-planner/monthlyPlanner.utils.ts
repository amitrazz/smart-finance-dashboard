import { MonthlyPlanTiming, ObligationStatus } from "../../../../types";
import { StatusType } from "../../../../components/ui/StatusBadge";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatMonthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1] ?? ""} ${year}`;
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (((index % 12) + 12) % 12) + 1 };
}

export function getCurrentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

export function toMonthParam(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** Parses the "YYYY-MM" hash sub-segment; falls back to the real current month on anything absent or malformed, so a bad/old bookmarked link never renders a broken page. */
export function parseMonthParam(param: string | null): { year: number; month: number } {
  if (param) {
    const match = /^(\d{4})-(\d{2})$/.exec(param);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      if (month >= 1 && month <= 12) return { year, month };
    }
  }
  return getCurrentYearMonth();
}

export interface TimingLabels {
  /** Header word for the "planned" side of the plan. */
  plannedLabel: string;
  /** Header word for the "actual" side, or null when actuals don't apply (a pure-future month). */
  actualLabel: string | null;
  /** Whether a forward-looking "projected closing cash" framing applies. */
  showProjected: boolean;
  description: string;
}

export function getTimingLabels(timing: MonthlyPlanTiming): TimingLabels {
  switch (timing) {
    case "FUTURE":
      return {
        plannedLabel: "Planned",
        actualLabel: null,
        showProjected: true,
        description: "Projected — this month hasn't started yet, every figure is a projection.",
      };
    case "PAST":
      return {
        plannedLabel: "Planned",
        actualLabel: "Actual",
        showProjected: false,
        description: "Final — this month has ended. Plan vs. actual, not a forecast.",
      };
    case "CURRENT":
    default:
      return {
        plannedLabel: "Planned",
        actualLabel: "Actual",
        showProjected: true,
        description: "In progress — actuals so far, projected through month end.",
      };
  }
}

const OBLIGATION_STATUS_TO_BADGE: Record<ObligationStatus, StatusType> = {
  PLANNED: "pending",
  SCHEDULED: "pending",
  POSTED: "completed",
  OVERDUE: "failed",
};

export function obligationStatusToBadge(status: ObligationStatus): StatusType {
  return OBLIGATION_STATUS_TO_BADGE[status] ?? "pending";
}

const OBLIGATION_STATUS_LABEL: Record<ObligationStatus, string> = {
  PLANNED: "Upcoming",
  SCHEDULED: "Upcoming",
  POSTED: "Paid",
  OVERDUE: "Overdue",
};

export function obligationStatusLabel(status: ObligationStatus): string {
  return OBLIGATION_STATUS_LABEL[status] ?? status;
}
