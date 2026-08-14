import { describe, expect, it } from "vitest";
import { maskAmountsInProse } from "../maskAmounts";

/**
 * The written currency forms that appear in backend rule prose.
 *
 * This is the secondary privacy defence — the primary one is that every figure
 * the frontend renders goes through `<Money>`. These cases exist so the
 * secondary layer is at least known-good against the forms the API actually
 * produces, rather than assumed to work.
 */
describe("masking amounts written into prose", () => {
  const cases: [string, string][] = [
    ["Interest charged was ₹45,230 this period.", "₹45,230"],
    ["Interest charged was Rs. 45,230 this period.", "Rs. 45,230"],
    ["Interest charged was Rs45,230 this period.", "Rs45,230"],
    ["Interest charged was INR 45,230 this period.", "INR 45,230"],
    ["Interest charged was 45,230 INR this period.", "45,230 INR"],
    ["Your balance moved by -₹45,230 this period.", "₹45,230"],
    ["A corpus of ₹1,25,00,000 is projected.", "₹1,25,00,000"],
    ["Charged ₹649.50 against ₹499.00.", "₹649.50"],
  ];

  it.each(cases)("masks %s", (sentence, amount) => {
    const masked = maskAmountsInProse(sentence);
    expect(masked).not.toContain(amount);
    expect(masked).toContain("₹••••••");
  });

  it("masks every amount in a sentence, not just the first", () => {
    const masked = maskAmountsInProse("Charged ₹649 against an established ₹499 — a 30% increase.");
    expect(masked).not.toContain("649");
    expect(masked).not.toContain("499");
  });

  it("leaves rates, counts and durations alone", () => {
    // Masking these would destroy the sentence's meaning while protecting
    // nothing anyone could spend.
    const masked = maskAmountsInProse(
      "Utilisation is 82% against a 30% target across 42 transactions over 3 months.",
    );
    expect(masked).toBe(
      "Utilisation is 82% against a 30% target across 42 transactions over 3 months.",
    );
  });

  it("is a no-op on prose with no amounts", () => {
    expect(maskAmountsInProse("Review the statement before the next cycle closes.")).toBe(
      "Review the statement before the next cycle closes.",
    );
  });
});
