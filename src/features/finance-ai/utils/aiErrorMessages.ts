import { ApiError } from "../../../services/api/client";

/**
 * Typed error states for the AI surfaces, per the backend's documented error
 * catalog (backend-platform docs/21-frontend-finance-ai-agent-integration.md
 * — "Rate limits and error codes"). `AiErrorKind` drives which UI treatment
 * renders; `retryable` decides whether a retry button appears at all.
 */
export type AiErrorKind =
  | "offline"
  | "network"
  | "timeout"
  | "auth"
  | "forbidden"
  | "not-found"
  | "rate-limited"
  | "concurrency-conflict"
  | "business-rule"
  | "validation"
  | "unavailable"
  | "unknown";

export interface AiErrorPresentation {
  kind: AiErrorKind;
  title: string;
  message: string;
  retryable: boolean;
}

const AI_INTERNAL_CODES = new Set([
  "AI_TOOL_NOT_FOUND",
  "AI_TOOL_VALIDATION_FAILED",
  "AI_MAX_ITERATIONS",
  "AI_CONTEXT_INSUFFICIENT",
]);

/**
 * Turns a caught error (expected: `ApiError` from `fetchWithAuth`, but
 * defensively handles anything) into UI-safe copy. Never surfaces a raw
 * backend `code`/`message` for the `AI_*` debugging codes — the backend docs
 * are explicit these are diagnostic aids, not user-facing states.
 */
export function presentAiError(err: unknown): AiErrorPresentation {
  if (!(err instanceof ApiError)) {
    return {
      kind: "unknown",
      title: "Something went wrong",
      message: "That didn't go through. Please try again.",
      retryable: true,
    };
  }

  if (err.category === "OFFLINE") {
    return {
      kind: "offline",
      title: "You're offline",
      message: "Check your connection and try again.",
      retryable: true,
    };
  }

  if (err.category === "NETWORK") {
    const timedOut = /timed out/i.test(err.message);
    return {
      kind: timedOut ? "timeout" : "network",
      title: timedOut ? "That took too long" : "Couldn't reach the assistant",
      message: timedOut
        ? "The assistant took too long to respond. Please try again."
        : "A network error stopped this request from completing. Please try again.",
      retryable: true,
    };
  }

  if (err.statusCode === 401) {
    return {
      kind: "auth",
      title: "Session expired",
      message: "Please sign in again to continue.",
      retryable: false,
    };
  }

  if (err.statusCode === 403) {
    return {
      kind: "forbidden",
      title: "Not available",
      message: "You don't have access to this conversation or plan.",
      retryable: false,
    };
  }

  if (err.statusCode === 404 || err.error === "ENTITY_NOT_FOUND") {
    return {
      kind: "not-found",
      title: "Not found",
      message: "This conversation or plan no longer exists, or isn't yours.",
      retryable: false,
    };
  }

  if (err.statusCode === 429) {
    return {
      kind: "rate-limited",
      title: "Slow down",
      message: "You've hit the request limit for this action. Try again in a minute.",
      retryable: true,
    };
  }

  if (err.statusCode === 409 || err.error === "CONCURRENCY_CONFLICT") {
    return {
      kind: "concurrency-conflict",
      title: "Already handled",
      message: "This was already processed by another request. Refreshing to show the current state.",
      retryable: false,
    };
  }

  if (err.statusCode === 422 || err.error === "BUSINESS_RULE_VIOLATION") {
    const rule = (err.details?.rule as string | undefined) ?? "";
    return {
      kind: "business-rule",
      title: "Can't do that right now",
      message: businessRuleMessage(rule) ?? err.userMessage,
      retryable: false,
    };
  }

  if (err.statusCode === 400 && err.error && AI_INTERNAL_CODES.has(err.error)) {
    return {
      kind: "unavailable",
      title: "Couldn't answer that",
      message: "Try rephrasing the question, or ask something more specific about your accounts.",
      retryable: true,
    };
  }

  if (err.category === "VALIDATION") {
    return {
      kind: "validation",
      title: "Check that input",
      message: err.userMessage,
      retryable: false,
    };
  }

  if (err.category === "SERVER") {
    return {
      kind: "unavailable",
      title: "Assistant unavailable",
      message: "The assistant is temporarily unavailable. Please try again shortly.",
      retryable: true,
    };
  }

  return {
    kind: "unknown",
    title: "Something went wrong",
    message: err.userMessage,
    retryable: true,
  };
}

function businessRuleMessage(rule: string): string | null {
  switch (rule) {
    case "FINANCE_PLAN_INVALID_TARGET_AMOUNT":
      return "The target amount isn't valid for this objective.";
    case "FINANCE_PLAN_CONSTRAINT_UNSUPPORTED":
      return "One of the constraints on this plan isn't supported.";
    case "FINANCE_PLAN_CANNOT_CANCEL":
      return "This plan can no longer be cancelled — it's already executing or further along.";
    case "FINANCE_PLAN_CANNOT_REVISE":
      return "This plan can no longer be revised — only a plan still awaiting your decision can be.";
    case "FINANCE_PLAN_REVISION_UNAVAILABLE":
      return "A revision isn't available for this plan.";
    default:
      return null;
  }
}
