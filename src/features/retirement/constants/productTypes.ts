import {
  RecurringContributionExecutionStatus,
  RecurringContributionRuleStatus,
  RetirementAccountStatus,
  RetirementProductType,
  RetirementTransactionType,
} from "../../../types";

// Centralized frontend configuration derived from the backend's
// RetirementProductType enum (EPF | VPF | PPF | NPS). The backend transaction
// `type` enum is global — it does not itself restrict which types apply to
// which product — so `allowedTransactionTypes` here is a FRONTEND-ONLY UX
// affordance (only offer the buttons that make sense for the product).
// Backend validation remains the real authority; this never claims the
// server rejects a combination this list omits.
export interface ProductTypeConfig {
  productType: RetirementProductType;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  allowsEmployerContribution: boolean;
  allowedTransactionTypes: RetirementTransactionType[];
}

export const PRODUCT_TYPE_CONFIG: Record<RetirementProductType, ProductTypeConfig> = {
  EPF: {
    productType: "EPF",
    label: "Employees' Provident Fund",
    shortLabel: "EPF",
    description: "Mandatory salaried-employee retirement fund with matched employer contributions.",
    color: "#8b5cf6",
    allowsEmployerContribution: true,
    allowedTransactionTypes: [
      "EMPLOYEE_CONTRIBUTION",
      "EMPLOYER_CONTRIBUTION",
      "INTEREST",
      "WITHDRAWAL",
      "OPENING_BALANCE",
      "ADJUSTMENT",
    ],
  },
  VPF: {
    productType: "VPF",
    label: "Voluntary Provident Fund",
    shortLabel: "VPF",
    description: "Optional additional employee-only contribution on top of EPF, same interest rate.",
    color: "#a78bfa",
    allowsEmployerContribution: false,
    allowedTransactionTypes: ["EMPLOYEE_CONTRIBUTION", "INTEREST", "WITHDRAWAL", "OPENING_BALANCE", "ADJUSTMENT"],
  },
  PPF: {
    productType: "PPF",
    label: "Public Provident Fund",
    shortLabel: "PPF",
    description: "Government-backed long-term savings scheme, not tied to employment.",
    color: "#6366f1",
    allowsEmployerContribution: false,
    allowedTransactionTypes: ["CONTRIBUTION", "INTEREST", "WITHDRAWAL", "OPENING_BALANCE", "ADJUSTMENT"],
  },
  NPS: {
    productType: "NPS",
    label: "National Pension System",
    shortLabel: "NPS",
    description: "Market-linked pension account with optional employer co-contribution.",
    color: "#14b8a6",
    allowsEmployerContribution: true,
    allowedTransactionTypes: [
      "CONTRIBUTION",
      "EMPLOYER_CONTRIBUTION",
      "VALUATION_ADJUSTMENT",
      "WITHDRAWAL",
      "OPENING_BALANCE",
      "ADJUSTMENT",
    ],
  },
};

export const PRODUCT_TYPE_LIST: RetirementProductType[] = ["EPF", "VPF", "PPF", "NPS"];

export type TransactionTone = "positive" | "negative" | "neutral";

export interface TransactionTypeConfig {
  label: string;
  tone: TransactionTone;
  helperText?: string;
}

// Contributions/interest increase the corpus (positive), withdrawals
// decrease it (negative), valuation/adjustment/opening-balance are neutral
// bookkeeping entries — never labelled as an "Expense" or personal income,
// since these are a structurally separate resource from bank Transactions
// (only EMPLOYEE_CONTRIBUTION/CONTRIBUTION/WITHDRAWAL optionally bridge to a
// linked bank account, and that bridge is auto-excluded from cash-flow
// totals server-side).
export const TRANSACTION_TYPE_LABELS: Record<RetirementTransactionType, TransactionTypeConfig> = {
  OPENING_BALANCE: { label: "Opening Balance", tone: "neutral" },
  EMPLOYEE_CONTRIBUTION: {
    label: "Employee Contribution",
    tone: "positive",
    helperText: "Your own contribution. Increases your retirement corpus.",
  },
  EMPLOYER_CONTRIBUTION: {
    label: "Employer Contribution",
    tone: "positive",
    helperText: "This increases your retirement corpus but does not reduce your personal cash balance.",
  },
  CONTRIBUTION: {
    label: "Contribution",
    tone: "positive",
    helperText: "Increases your retirement corpus.",
  },
  INTEREST: { label: "Interest", tone: "positive", helperText: "Interest credited by the scheme." },
  VALUATION_ADJUSTMENT: {
    label: "Valuation Adjustment",
    tone: "neutral",
    helperText: "Marks the account to its latest reported value (e.g. NPS NAV update).",
  },
  WITHDRAWAL: {
    label: "Withdrawal",
    tone: "negative",
    helperText: "Reduces your retirement balance; increases the linked cash/bank account if one is set.",
  },
  ADJUSTMENT: { label: "Adjustment", tone: "neutral", helperText: "A manual correction to the balance." },
};

export const STATUS_LABELS: Record<RetirementAccountStatus, string> = {
  ACTIVE: "Active",
  MATURED: "Matured",
  CLOSED: "Closed",
  TRANSFERRED_OUT: "Transferred Out",
};

export function getAllowedTransactionTypes(productType: RetirementProductType): RetirementTransactionType[] {
  return PRODUCT_TYPE_CONFIG[productType].allowedTransactionTypes;
}

// Only these three transaction types can ever be scheduled as a recurring
// contribution (enforced authoritatively by the backend's
// RecurringContributionRuleValidationService). Intersecting with each
// product's own allowedTransactionTypes above — rather than hardcoding a
// second per-product policy here — keeps this in lockstep with the backend's
// RETIREMENT_PRODUCT_CATALOG (e.g. VPF/PPF never offer EMPLOYER_CONTRIBUTION)
// without duplicating that decision.
const SCHEDULABLE_TRANSACTION_TYPES: RetirementTransactionType[] = [
  "EMPLOYEE_CONTRIBUTION",
  "EMPLOYER_CONTRIBUTION",
  "CONTRIBUTION",
];

export function getSchedulableContributionTypes(productType: RetirementProductType): RetirementTransactionType[] {
  return PRODUCT_TYPE_CONFIG[productType].allowedTransactionTypes.filter((t) =>
    SCHEDULABLE_TRANSACTION_TYPES.includes(t),
  );
}

export const RECURRING_RULE_STATUS_LABELS: Record<RecurringContributionRuleStatus, string> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

export const EXECUTION_STATUS_LABELS: Record<RecurringContributionExecutionStatus, string> = {
  SUCCEEDED: "Succeeded",
  SKIPPED: "Skipped",
  FAILED: "Failed",
};
