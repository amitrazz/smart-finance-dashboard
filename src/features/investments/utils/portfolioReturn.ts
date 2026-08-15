import { PortfolioSnapshot } from "../../../types";

export interface PortfolioReturnDisplay {
  /** Card title — names the metric being shown, so the two never get confused. */
  title: string;
  /** Formatted percentage, or `null` when nothing can be reported. */
  value: string | null;
  /** What the figure measures, including the period it covers. */
  subtitle: string;
  /** True when the figure shown is the annualised one. */
  isAnnualised: boolean;
}

const formatPercent = (value: number): string => `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(2)}%`;

const num = (value: string | null | undefined): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Which return figure to headline, decided by the backend rather than by us.
 *
 * XIRR is annualised by definition, so across a short holding period it turns a
 * rounding-scale move into a headline number: this portfolio's real 12-day gain
 * of ₹294 — **0.51%** — annualises to **16.79%**. Shown as "XIRR +16.79%
 * (cash-flow weighted return)", that reads as a track record. It is twelve days
 * of noise.
 *
 * The snapshot's `performance` block already resolves this: it publishes the
 * measured period, the actual return over it, the annualised figure, an
 * `isShortPeriod` flag and a `headlineMetric` naming which one to lead with. So
 * no threshold is invented here — the client honours the backend's call, which
 * also means the rule can change server-side without a frontend release.
 *
 * When `performance` is absent (older snapshots) this falls back to the raw
 * `xirr` fraction, scaled and labelled as annualised. It never silently drops
 * to "not short" — absence of guidance is not a claim that the period is long.
 */
/**
 * Why "Realized Gain (Lifetime)" so often reads ₹0.00, said on the card.
 *
 * Realised gain only accrues when a position is *closed*. A portfolio of open
 * holdings sitting on a healthy paper profit therefore shows ₹0.00 here quite
 * correctly — this is a true zero, not a missing figure, and it must keep
 * rendering as ₹0.00 rather than "Not enough data".
 *
 * What was missing is the reason. The dashboard even captioned it with the
 * count of *open* holdings, which points at the one number that has nothing to
 * do with realised gain: those holdings are precisely where the unrealised
 * profit is. A reader was left to conclude their gains had evaporated.
 *
 * The wording avoids claiming "you have never sold" — a sale at exactly
 * break-even would also produce zero — and states only what the figure means.
 */
export function describeRealizedGain(snapshot: PortfolioSnapshot): string {
  const realized = num(snapshot.totalRealizedGain?.amount);
  if (realized === 0) return "No profit taken yet — gains realise when you sell";
  return "From positions you've closed";
}

export function describePortfolioReturn(snapshot: PortfolioSnapshot): PortfolioReturnDisplay {
  const performance = snapshot.performance;

  if (performance) {
    const annualised = num(performance.annualizedMoneyWeightedReturnPercentage);
    const actual = num(performance.actualPeriodReturnPercentage);
    const days = performance.periodDays;

    if (performance.headlineMetric === "ACTUAL_PERIOD_RETURN") {
      return {
        title: "Return",
        value: actual === null ? null : formatPercent(actual),
        // The annualised figure is still offered, but as context and explicitly
        // named — not as the number the eye lands on first.
        subtitle:
          annualised === null
            ? `Over ${days} days`
            : `Over ${days} days · ${formatPercent(annualised)} annualised`,
        isAnnualised: false,
      };
    }

    return {
      title: "XIRR",
      value: annualised === null ? null : formatPercent(annualised),
      subtitle: `Annualised, money-weighted · ${days} days`,
      isAnnualised: true,
    };
  }

  // Legacy snapshots: a bare fraction, e.g. "0.1679" for 16.79%.
  const fraction = num(snapshot.xirr);
  return {
    title: "XIRR",
    value: fraction === null ? null : formatPercent(fraction * 100),
    subtitle: "Annualised, money-weighted",
    isAnnualised: true,
  };
}
