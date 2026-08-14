import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { mapSpending } from "../../../api/insightsMappers";
import { BreakdownList } from "../BreakdownList";

afterEach(cleanup);

const money = (amount: string) => ({ amount, currency: "INR" });

/**
 * Hunting "Cannot read properties of undefined (reading 'toFixed')" on the
 * Spending section by feeding the mapper the shapes a real response can take.
 */
describe("spending payload hostility", () => {
  const cases: Record<string, unknown> = {
    "percentage missing": { categoryId: "c1", categoryName: "Rent", amount: money("1000") },
    "percentage null": { categoryId: "c2", categoryName: "Food", amount: money("1000"), percentage: null },
    "percentage string": { categoryId: "c3", categoryName: "Fuel", amount: money("1000"), percentage: "12.5" },
    "percentage empty string": { categoryId: "c4", categoryName: "Misc", amount: money("1000"), percentage: "" },
  };

  for (const [label, row] of Object.entries(cases)) {
    it(`maps and renders with ${label}`, () => {
      const result = mapSpending([row] as never, null, null, []);
      expect(result).not.toBeNull();

      const percentage = result!.categories[0].percentage;
      // Whatever it is, it must be a number or null — never undefined, because
      // BreakdownList's guard is a null check and undefined would slip past it.
      expect(percentage === null || typeof percentage === "number").toBe(true);

      expect(() =>
        render(
          <BreakdownList
            title="By category"
            items={result!.categories.map((c) => ({
              category: c.categoryName,
              value: c.amount,
              percentage: c.percentage,
            }))}
            accent="#fb7185"
          />,
        ),
      ).not.toThrow();
    });
  }

  it("survives a category row with no amount at all", () => {
    // Regression: the currency was read off `categoriesRaw[0].amount.currency`,
    // so one amount-less row threw "Cannot read properties of undefined
    // (reading 'currency')" and took the whole section down. A list's currency
    // is a property of the list, not of whichever row happens to sort first.
    const result = mapSpending(
      [
        { categoryId: "c1", categoryName: "Rent", percentage: 10 },
        { categoryId: "c2", categoryName: "Food", amount: money("500"), percentage: 5 },
      ] as never,
      null,
      null,
      [],
    );

    expect(result!.totalSpent.currency).toBe("INR");
    // Rows are ranked by amount now, so the amount-less row sorts last — and it
    // still reports absence rather than a confident zero.
    const rent = result!.categories.find((c) => c.categoryName === "Rent")!;
    const food = result!.categories.find((c) => c.categoryName === "Food")!;
    expect(rent.amount).toBeNull();
    expect(food.amount).toEqual(money("500"));
    expect(result!.categories.map((c) => c.categoryName)).toEqual(["Food", "Rent"]);
  });

  it("falls back to a default currency when no row carries one", () => {
    const result = mapSpending(
      [{ categoryId: "c1", categoryName: "Rent", percentage: 10 }] as never,
      null,
      null,
      [],
    );
    expect(result!.totalSpent.currency).toBe("INR");
  });

  it("renders an absent amount as absent, never as zero", () => {
    const { container } = render(
      <BreakdownList
        title="x"
        items={[{ category: "Unknown", value: null, percentage: null }]}
        accent="#fb7185"
      />,
    );
    expect(container.textContent).toContain("Not enough data");
    expect(container.textContent).not.toContain("0.00");
  });

  it("survives a merchant row with no amount", () => {
    const result = mapSpending(
      [{ categoryId: "c1", categoryName: "Rent", amount: money("1000"), percentage: 10 }] as never,
      [{ merchantId: "m1", merchantName: "Landlord" }] as never,
      null,
      [],
    );
    expect(() =>
      render(
        <BreakdownList
          title="x"
          items={result!.topMerchants.map((m) => ({
            category: m.merchantName,
            value: m.amount,
            percentage: null,
          }))}
          accent="#fb7185"
        />,
      ),
    ).not.toThrow();
  });

  it("renders a bar for a real percentage and no bar for an absent one", () => {
    const { container } = render(
      <BreakdownList
        title="x"
        items={[
          { category: "Known", value: money("100"), percentage: 40 },
          { category: "Unknown", value: money("100"), percentage: null },
        ]}
        accent="#fb7185"
      />,
    );
    expect(container.textContent).toContain("40%");
    expect(container.querySelectorAll('[role="presentation"]')).toHaveLength(1);
  });
});
