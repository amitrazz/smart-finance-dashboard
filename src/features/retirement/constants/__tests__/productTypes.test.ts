import { describe, expect, it } from "vitest";
import {
  PRODUCT_TYPE_CONFIG,
  PRODUCT_TYPE_LIST,
  STATUS_LABELS,
  TRANSACTION_TYPE_LABELS,
  getAllowedTransactionTypes,
} from "../productTypes";

describe("PRODUCT_TYPE_CONFIG — employer contribution policy", () => {
  it("allows employer contribution for EPF", () => {
    expect(PRODUCT_TYPE_CONFIG.EPF.allowsEmployerContribution).toBe(true);
    expect(PRODUCT_TYPE_CONFIG.EPF.allowedTransactionTypes).toContain("EMPLOYER_CONTRIBUTION");
  });

  it("allows employer contribution for NPS", () => {
    expect(PRODUCT_TYPE_CONFIG.NPS.allowsEmployerContribution).toBe(true);
    expect(PRODUCT_TYPE_CONFIG.NPS.allowedTransactionTypes).toContain("EMPLOYER_CONTRIBUTION");
  });

  it("does not expose employer contribution for VPF", () => {
    expect(PRODUCT_TYPE_CONFIG.VPF.allowsEmployerContribution).toBe(false);
    expect(PRODUCT_TYPE_CONFIG.VPF.allowedTransactionTypes).not.toContain("EMPLOYER_CONTRIBUTION");
  });

  it("does not expose employer contribution for PPF", () => {
    expect(PRODUCT_TYPE_CONFIG.PPF.allowsEmployerContribution).toBe(false);
    expect(PRODUCT_TYPE_CONFIG.PPF.allowedTransactionTypes).not.toContain("EMPLOYER_CONTRIBUTION");
  });

  it("every product type in the list has a config entry", () => {
    PRODUCT_TYPE_LIST.forEach((pt) => {
      expect(PRODUCT_TYPE_CONFIG[pt]).toBeDefined();
      expect(PRODUCT_TYPE_CONFIG[pt].productType).toBe(pt);
    });
  });

  it("getAllowedTransactionTypes mirrors the config map", () => {
    expect(getAllowedTransactionTypes("PPF")).toEqual(PRODUCT_TYPE_CONFIG.PPF.allowedTransactionTypes);
  });
});

describe("TRANSACTION_TYPE_LABELS — cash-flow-safe copy", () => {
  it("never labels any retirement transaction type as an Expense", () => {
    Object.values(TRANSACTION_TYPE_LABELS).forEach((cfg) => {
      expect(cfg.label.toLowerCase()).not.toContain("expense");
      expect(cfg.helperText?.toLowerCase() ?? "").not.toContain("expense");
    });
  });

  it("employer contribution helper text explicitly says it does not reduce personal cash", () => {
    const helper = TRANSACTION_TYPE_LABELS.EMPLOYER_CONTRIBUTION.helperText ?? "";
    expect(helper).toMatch(/does not reduce your personal cash balance/i);
  });

  it("withdrawal is toned negative, contributions and interest are toned positive", () => {
    expect(TRANSACTION_TYPE_LABELS.WITHDRAWAL.tone).toBe("negative");
    expect(TRANSACTION_TYPE_LABELS.EMPLOYEE_CONTRIBUTION.tone).toBe("positive");
    expect(TRANSACTION_TYPE_LABELS.EMPLOYER_CONTRIBUTION.tone).toBe("positive");
    expect(TRANSACTION_TYPE_LABELS.CONTRIBUTION.tone).toBe("positive");
    expect(TRANSACTION_TYPE_LABELS.INTEREST.tone).toBe("positive");
  });

  it("valuation adjustment and manual adjustment are neutral, not gain/loss framed", () => {
    expect(TRANSACTION_TYPE_LABELS.VALUATION_ADJUSTMENT.tone).toBe("neutral");
    expect(TRANSACTION_TYPE_LABELS.ADJUSTMENT.tone).toBe("neutral");
  });
});

describe("STATUS_LABELS", () => {
  it("covers every close-status the backend accepts, plus ACTIVE", () => {
    expect(Object.keys(STATUS_LABELS).sort()).toEqual(
      ["ACTIVE", "CLOSED", "MATURED", "TRANSFERRED_OUT"].sort(),
    );
  });
});
