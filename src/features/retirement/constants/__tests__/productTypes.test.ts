import { describe, expect, it } from "vitest";
import {
  EXECUTION_STATUS_LABELS,
  PRODUCT_TYPE_CONFIG,
  PRODUCT_TYPE_LIST,
  RECURRING_RULE_STATUS_LABELS,
  STATUS_LABELS,
  TRANSACTION_TYPE_LABELS,
  getAllowedTransactionTypes,
  getSchedulableContributionTypes,
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

describe("getSchedulableContributionTypes — recurring-contribution product policy", () => {
  it("EPF can schedule both employee and employer contributions", () => {
    expect(getSchedulableContributionTypes("EPF").sort()).toEqual(
      ["EMPLOYEE_CONTRIBUTION", "EMPLOYER_CONTRIBUTION"].sort(),
    );
  });

  it("VPF can only schedule an employee contribution — never an employer one", () => {
    expect(getSchedulableContributionTypes("VPF")).toEqual(["EMPLOYEE_CONTRIBUTION"]);
  });

  it("PPF can only schedule a (single-party) contribution — never an employer one", () => {
    expect(getSchedulableContributionTypes("PPF")).toEqual(["CONTRIBUTION"]);
  });

  it("NPS can schedule both contribution and employer contribution", () => {
    expect(getSchedulableContributionTypes("NPS").sort()).toEqual(["CONTRIBUTION", "EMPLOYER_CONTRIBUTION"].sort());
  });

  it("never includes a non-schedulable type like INTEREST or WITHDRAWAL for any product", () => {
    PRODUCT_TYPE_LIST.forEach((pt) => {
      const schedulable = getSchedulableContributionTypes(pt);
      expect(schedulable).not.toContain("INTEREST");
      expect(schedulable).not.toContain("WITHDRAWAL");
      expect(schedulable).not.toContain("OPENING_BALANCE");
      expect(schedulable).not.toContain("VALUATION_ADJUSTMENT");
      expect(schedulable).not.toContain("ADJUSTMENT");
    });
  });
});

describe("RECURRING_RULE_STATUS_LABELS / EXECUTION_STATUS_LABELS", () => {
  it("covers exactly the backend's RecurringContributionRuleStatus enum", () => {
    expect(Object.keys(RECURRING_RULE_STATUS_LABELS).sort()).toEqual(
      ["ACTIVE", "PAUSED", "CANCELLED", "COMPLETED"].sort(),
    );
  });

  it("covers exactly the backend's RecurringContributionExecutionStatus enum", () => {
    expect(Object.keys(EXECUTION_STATUS_LABELS).sort()).toEqual(["SUCCEEDED", "SKIPPED", "FAILED"].sort());
  });
});
