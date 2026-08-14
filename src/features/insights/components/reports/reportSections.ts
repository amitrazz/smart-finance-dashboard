/**
 * What a report can contain.
 *
 * Kept apart from `ReportDocument` so the builder can offer the list without
 * importing the document that renders it — and so the two can never disagree
 * about which sections exist.
 */
export type ReportSectionId =
  | "cash-flow"
  | "spending"
  | "income"
  | "net-worth"
  | "debt"
  | "investments"
  | "goals"
  | "budget"
  | "subscriptions"
  | "health"
  | "intelligence";

export const REPORT_SECTIONS: { id: ReportSectionId; label: string }[] = [
  { id: "cash-flow", label: "Cash flow" },
  { id: "spending", label: "Spending" },
  { id: "income", label: "Income" },
  { id: "net-worth", label: "Net worth" },
  { id: "debt", label: "Debt" },
  { id: "investments", label: "Investments" },
  { id: "goals", label: "Goals" },
  { id: "budget", label: "Budget" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "health", label: "Financial health" },
  { id: "intelligence", label: "Key findings" },
];
