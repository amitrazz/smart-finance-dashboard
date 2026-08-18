import { describe, expect, it } from "vitest";
import { ApiError } from "../../../../services/api/client";
import { presentAiError } from "../aiErrorMessages";

describe("presentAiError", () => {
  it("maps 429 to a retryable rate-limit state, matching the documented 10-20/min throttles", () => {
    const err = new ApiError("Too Many Requests", 429, "RATE_LIMIT", "Too many requests.");
    const presented = presentAiError(err);
    expect(presented.kind).toBe("rate-limited");
    expect(presented.retryable).toBe(true);
  });

  it("maps a 409 CONCURRENCY_CONFLICT to a non-retryable 'already handled' state", () => {
    const err = new ApiError("Conflict", 409, "VALIDATION", "Conflict", "CONCURRENCY_CONFLICT");
    const presented = presentAiError(err);
    expect(presented.kind).toBe("concurrency-conflict");
    // Retrying a lost race would either no-op or double-submit — never offer it.
    expect(presented.retryable).toBe(false);
  });

  it("never surfaces the raw AI_* debugging code to the user", () => {
    const err = new ApiError("bad tool call", 400, "CLIENT", "bad tool call", "AI_TOOL_VALIDATION_FAILED");
    const presented = presentAiError(err);
    expect(presented.message).not.toContain("AI_TOOL_VALIDATION_FAILED");
    expect(presented.kind).toBe("unavailable");
  });

  it("maps a stale-plan business rule to plain-language guidance toward revise, not retry", () => {
    const err = new ApiError("nope", 422, "VALIDATION", "nope", "BUSINESS_RULE_VIOLATION", {
      rule: "FINANCE_PLAN_CANNOT_CANCEL",
    });
    const presented = presentAiError(err);
    expect(presented.kind).toBe("business-rule");
    expect(presented.message).toMatch(/cancel/i);
    expect(presented.retryable).toBe(false);
  });

  it("maps 404/ENTITY_NOT_FOUND without distinguishing ownership mismatch from not-found, per the backend's own contract", () => {
    const err = new ApiError("nope", 404, "CLIENT", "nope", "ENTITY_NOT_FOUND");
    expect(presentAiError(err).kind).toBe("not-found");
  });

  it("falls back to a generic-but-retryable state for a non-ApiError", () => {
    const presented = presentAiError(new Error("boom"));
    expect(presented.kind).toBe("unknown");
    expect(presented.retryable).toBe(true);
  });
});
