import { describe, expect, it } from "vitest";
import type { PortfolioSnapshot } from "../../../../types";
import { describePortfolioReturn, describeRealizedGain } from "../portfolioReturn";

const money = (amount: string) => ({ amount, currency: "INR" });

/** The real payload from `GET /finance/portfolio/:id`, trimmed to what matters. */
const snapshot = (over: Partial<PortfolioSnapshot> = {}): PortfolioSnapshot => ({
  snapshotDate: "2026-08-15",
  totalMarketValue: money("57939.4434"),
  totalCostBasis: money("57644.6117"),
  totalUnrealizedGain: money("294.8317"),
  totalRealizedGain: money("0"),
  allocationByAssetClass: { MUTUAL_FUND: 1 },
  xirr: "0.1679",
  performance: {
    gainLossAmount: money("294.8317"),
    actualPeriodReturnPercentage: "0.5114",
    annualizedMoneyWeightedReturnPercentage: "16.79",
    periodStart: "2026-08-03",
    periodEnd: "2026-08-15",
    periodDays: 12,
    isShortPeriod: true,
    headlineMetric: "ACTUAL_PERIOD_RETURN",
  },
  ...over,
});

describe("which return figure leads the card", () => {
  it("headlines the real period return when the backend says the period is too short", () => {
    // The bug this exists to prevent: a ₹294 gain on ₹57,644 — 0.51% over twelve
    // days — headlined as "+16.79%" because XIRR annualises. That reads as a
    // track record; it is twelve days of noise.
    const display = describePortfolioReturn(snapshot());

    expect(display.title).toBe("Return");
    expect(display.value).toBe("+0.51%");
    expect(display.isAnnualised).toBe(false);
  });

  it("still offers the annualised figure, named and dated, as context", () => {
    const display = describePortfolioReturn(snapshot());
    expect(display.subtitle).toBe("Over 12 days · +16.79% annualised");
  });

  it("headlines XIRR once the backend judges the period long enough", () => {
    const display = describePortfolioReturn(
      snapshot({
        performance: {
          ...snapshot().performance!,
          periodDays: 420,
          isShortPeriod: false,
          headlineMetric: "ANNUALIZED_MONEY_WEIGHTED_RETURN",
        },
      }),
    );

    expect(display.title).toBe("XIRR");
    expect(display.value).toBe("+16.79%");
    expect(display.isAnnualised).toBe(true);
  });

  it("keeps the sign on a losing period", () => {
    const display = describePortfolioReturn(
      snapshot({
        performance: { ...snapshot().performance!, actualPeriodReturnPercentage: "-1.2400" },
      }),
    );

    expect(display.value).toBe("−1.24%");
  });

  it("falls back to the raw fraction for snapshots predating the performance block", () => {
    const display = describePortfolioReturn(snapshot({ performance: undefined }));

    // "0.1679" is a fraction — 16.79%, not 0.17%.
    expect(display.value).toBe("+16.79%");
    expect(display.isAnnualised).toBe(true);
  });

  it("reports nothing rather than 0% when XIRR could not be computed", () => {
    const display = describePortfolioReturn(snapshot({ xirr: null, performance: undefined }));
    expect(display.value).toBeNull();
  });
});

describe("explaining a realized gain of zero", () => {
  it("says why it is zero rather than leaving the reader to guess", () => {
    // A true zero: every position is still open, so nothing has been realised.
    // It must still render as ₹0.00 — this is not a missing figure.
    expect(describeRealizedGain(snapshot())).toBe(
      "No profit taken yet — gains realise when you sell",
    );
  });

  it("never captions realised gain with a count of open holdings", () => {
    // The dashboard used to read "6 open holdings" under a ₹0.00 realised gain,
    // pointing at the one number unrelated to it — those holdings are exactly
    // where the ₹294.83 of *unrealised* profit sits.
    expect(describeRealizedGain(snapshot())).not.toMatch(/open holdings/);
  });

  it("switches wording once something has actually been realised", () => {
    const closed = describeRealizedGain(snapshot({ totalRealizedGain: money("1250.40") }));
    expect(closed).toBe("From positions you've closed");
  });

  it("handles a realised loss as a closed position, not as nothing sold", () => {
    const loss = describeRealizedGain(snapshot({ totalRealizedGain: money("-430.00") }));
    expect(loss).toBe("From positions you've closed");
  });
});
