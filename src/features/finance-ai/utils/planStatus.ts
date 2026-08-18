import type { FinancePlanStatus } from "../../../types";

/**
 * One place that decides what a `FinancePlan.status` means for the UI —
 * label, tone, and which actions are legal from it. Mirrors the lifecycle
 * documented in backend-platform docs/20-finance-plans.md exactly; nothing
 * here re-derives a transition the backend didn't confirm.
 */

export type PlanStatusTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface PlanStatusPresentation {
  label: string;
  tone: PlanStatusTone;
  /** Short explanation of what this status means, for empty/detail states. */
  description: string;
}

const PRESENTATION: Record<FinancePlanStatus, PlanStatusPresentation> = {
  DRAFT: { label: "Draft", tone: "neutral", description: "Not yet ready for review." },
  READY_FOR_REVIEW: {
    label: "Awaiting your review",
    tone: "info",
    description: "Nothing has changed in your accounts yet — review the plan and accept, decline, or ask for changes.",
  },
  ACCEPTED: { label: "Accepted", tone: "info", description: "Accepted — about to be revalidated against current data." },
  DECLINED: { label: "Declined", tone: "neutral", description: "Declined — no changes were made to your accounts." },
  MODIFICATION_REQUESTED: {
    label: "Revision requested",
    tone: "neutral",
    description: "You asked for changes — see the newer version of this plan.",
  },
  REVALIDATING: { label: "Checking your data…", tone: "info", description: "Re-checking this plan against your current data before executing." },
  STALE: {
    label: "Out of date",
    tone: "warning",
    // NOTE: docs/20-finance-plans.md's own "stale-plan recovery" guidance says
    // to route to `revise`, but its "guard rails" section says `revise` only
    // succeeds from READY_FOR_REVIEW (422 FINANCE_PLAN_CANNOT_REVISE
    // otherwise) — a STALE plan can never satisfy that. This is a documented
    // backend contract gap (flagged, not silently worked around): there is
    // currently no successful recovery action for a STALE plan short of
    // generating a brand-new one from scratch. Copy reflects that honestly
    // rather than pointing at a button that would 422.
    description: "Your data changed since this plan was generated, so nothing executed. Generate a new plan to try again.",
  },
  EXECUTING: { label: "Executing…", tone: "info", description: "Applying this plan's actions to your accounts." },
  ACTIVE: { label: "Active", tone: "success", description: "Every action in this plan completed successfully." },
  EXECUTION_PARTIAL: {
    label: "Partially completed",
    tone: "warning",
    description: "Some actions completed and some failed — see the action list for details.",
  },
  FAILED: { label: "Failed", tone: "danger", description: "None of this plan's actions completed successfully." },
  CANCELLED: { label: "Cancelled", tone: "neutral", description: "Cancelled before execution — no changes were made." },
  EXPIRED: { label: "Expired", tone: "neutral", description: "This plan expired before being acted on." },
  COMPLETED: { label: "Completed", tone: "success", description: "This plan's goal has been reached." },
};

export function presentPlanStatus(status: FinancePlanStatus): PlanStatusPresentation {
  return PRESENTATION[status] ?? { label: status, tone: "neutral", description: "" };
}

/** Cancel only succeeds while `READY_FOR_REVIEW` or `ACCEPTED` — before EXECUTING starts. */
export function canCancelPlan(status: FinancePlanStatus): boolean {
  return status === "READY_FOR_REVIEW" || status === "ACCEPTED";
}

/** Revise only succeeds from `READY_FOR_REVIEW` — a plan already decided on can't ask for changes. */
export function canRevisePlan(status: FinancePlanStatus): boolean {
  return status === "READY_FOR_REVIEW";
}

/** Accept is only offered while still awaiting the user's first decision. */
export function canAcceptOrDeclinePlan(status: FinancePlanStatus): boolean {
  return status === "READY_FOR_REVIEW";
}

/** Terminal for this version — no further transition happens without a `revise`. */
export function isPlanTerminal(status: FinancePlanStatus): boolean {
  return (
    status === "DECLINED" ||
    status === "MODIFICATION_REQUESTED" ||
    status === "STALE" ||
    status === "CANCELLED" ||
    status === "EXPIRED" ||
    status === "ACTIVE" ||
    status === "EXECUTION_PARTIAL" ||
    status === "FAILED" ||
    status === "COMPLETED"
  );
}

/** True once accept has been requested — used to lock the confirm button against a double-submit. */
export function isPlanBeingExecuted(status: FinancePlanStatus): boolean {
  return status === "ACCEPTED" || status === "REVALIDATING" || status === "EXECUTING";
}
