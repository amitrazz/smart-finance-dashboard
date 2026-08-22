import { describe, it, expect } from "vitest";
import { confidenceLevel } from "../confidence";

describe("confidenceLevel", () => {
  it("buckets >= 0.9 as high", () => {
    expect(confidenceLevel(0.9)).toBe("high");
    expect(confidenceLevel(0.99)).toBe("high");
    expect(confidenceLevel("0.95")).toBe("high");
  });

  it("buckets 0.6-0.89 as medium", () => {
    expect(confidenceLevel(0.6)).toBe("medium");
    expect(confidenceLevel(0.89)).toBe("medium");
  });

  it("buckets below 0.6 as low", () => {
    expect(confidenceLevel(0.59)).toBe("low");
    expect(confidenceLevel(0)).toBe("low");
  });

  it("treats null/undefined/empty/non-numeric as not-detected, never a fabricated bucket", () => {
    expect(confidenceLevel(null)).toBe("not-detected");
    expect(confidenceLevel(undefined)).toBe("not-detected");
    expect(confidenceLevel("")).toBe("not-detected");
    expect(confidenceLevel("not-a-number")).toBe("not-detected");
  });
});
