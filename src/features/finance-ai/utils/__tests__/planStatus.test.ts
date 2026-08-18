import { describe, expect, it } from "vitest";
import {
  canAcceptOrDeclinePlan,
  canCancelPlan,
  canRevisePlan,
  isPlanBeingExecuted,
  isPlanTerminal,
  presentPlanStatus,
} from "../planStatus";
import type { FinancePlanStatus } from "../../../../types";

// Guard-rail matrix straight from backend-platform docs/20-finance-plans.md
// ("Cancel and revise have their own guard rails"). These functions are the
// single place the UI decides which buttons render — get this table wrong
// and the UI offers an action the backend will 422 on.
describe("Finance Plan lifecycle guard rails", () => {
  it("only allows accept/decline from READY_FOR_REVIEW", () => {
    expect(canAcceptOrDeclinePlan("READY_FOR_REVIEW")).toBe(true);
    (["ACCEPTED", "ACTIVE", "STALE", "DECLINED"] as FinancePlanStatus[]).forEach((s) =>
      expect(canAcceptOrDeclinePlan(s)).toBe(false),
    );
  });

  it("allows cancel only before EXECUTING starts (READY_FOR_REVIEW or ACCEPTED)", () => {
    expect(canCancelPlan("READY_FOR_REVIEW")).toBe(true);
    expect(canCancelPlan("ACCEPTED")).toBe(true);
    (["REVALIDATING", "EXECUTING", "ACTIVE", "STALE"] as FinancePlanStatus[]).forEach((s) =>
      expect(canCancelPlan(s)).toBe(false),
    );
  });

  it("allows revise only from READY_FOR_REVIEW — a stale plan must revise too, but only via its own path", () => {
    expect(canRevisePlan("READY_FOR_REVIEW")).toBe(true);
    expect(canRevisePlan("STALE")).toBe(false);
    expect(canRevisePlan("ACCEPTED")).toBe(false);
  });

  it("treats STALE, terminal execution outcomes, and decline/cancel as terminal for this version", () => {
    (["STALE", "DECLINED", "CANCELLED", "ACTIVE", "EXECUTION_PARTIAL", "FAILED", "COMPLETED"] as FinancePlanStatus[]).forEach(
      (s) => expect(isPlanTerminal(s)).toBe(true),
    );
    expect(isPlanTerminal("READY_FOR_REVIEW")).toBe(false);
  });

  it("flags ACCEPTED/REVALIDATING/EXECUTING as in-flight, to lock the accept button against a double-submit", () => {
    expect(isPlanBeingExecuted("ACCEPTED")).toBe(true);
    expect(isPlanBeingExecuted("REVALIDATING")).toBe(true);
    expect(isPlanBeingExecuted("EXECUTING")).toBe(true);
    expect(isPlanBeingExecuted("READY_FOR_REVIEW")).toBe(false);
  });

  it("presents an unrecognised status gracefully instead of throwing", () => {
    const presented = presentPlanStatus("SOMETHING_NEW" as FinancePlanStatus);
    expect(presented.label).toBe("SOMETHING_NEW");
    expect(presented.tone).toBe("neutral");
  });
});
