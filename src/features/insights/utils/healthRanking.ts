import { HealthDimension } from "../types/insightsTypes";

/**
 * Ranks dimensions worst-first, so the grid opens on what is actually wrong.
 *
 * Unscored dimensions sort to the end rather than to the front: `null` is not a
 * bad score, and letting it sort as zero would put "we couldn't measure this"
 * above a genuine crisis.
 */
export function rankDimensions(dimensions: HealthDimension[]): HealthDimension[] {
  return [...dimensions].sort((a, b) => {
    if (a.score === null && b.score === null) return (a.label ?? "").localeCompare(b.label ?? "");
    if (a.score === null) return 1;
    if (b.score === null) return -1;
    return a.score - b.score;
  });
}

/** The dimensions most worth acting on: lowest scored, and scored at all. */
export function lowestScoringDimensions(dimensions: HealthDimension[], count: number) {
  return rankDimensions(dimensions)
    .filter((d) => d.score !== null)
    .slice(0, count);
}
