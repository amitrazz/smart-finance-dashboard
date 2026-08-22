export type ConfidenceLevel = "high" | "medium" | "low" | "not-detected";

/**
 * Buckets a raw 0-1 extraction confidence into a display-safe level. The
 * backend's document-level `confidenceScore`/`documentConfidence` is the
 * only confidence figure it currently exposes for a salary slip (per-field
 * confidence exists internally in the AI extraction envelope but isn't
 * returned by any API today) — this bucketing is deliberately the only
 * place a raw probability is ever converted to something shown in the UI;
 * the raw number itself is never rendered (spec: "do not expose raw model
 * probabilities").
 */
export function confidenceLevel(
  score: number | string | null | undefined,
): ConfidenceLevel {
  if (score === null || score === undefined || score === "") {
    return "not-detected";
  }
  const value = typeof score === "number" ? score : parseFloat(score);
  if (!Number.isFinite(value)) return "not-detected";
  if (value >= 0.9) return "high";
  if (value >= 0.6) return "medium";
  return "low";
}

export const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  "not-detected": "Not detected",
};
