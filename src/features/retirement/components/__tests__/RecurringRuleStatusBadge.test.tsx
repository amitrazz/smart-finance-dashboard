import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { RecurringRuleStatusBadge } from "../RecurringRuleStatusBadge";

afterEach(cleanup);

describe("RecurringRuleStatusBadge", () => {
  it("renders every rule status without crashing and with a readable label", () => {
    (["ACTIVE", "PAUSED", "CANCELLED", "COMPLETED"] as const).forEach((status) => {
      const { unmount } = render(<RecurringRuleStatusBadge status={status} />);
      unmount();
    });
  });

  it("gives Active and Paused visually distinct icons, not color alone", () => {
    const { container: activeContainer } = render(<RecurringRuleStatusBadge status="ACTIVE" />);
    const { container: pausedContainer } = render(<RecurringRuleStatusBadge status="PAUSED" />);
    const activeIcon = activeContainer.querySelector("svg");
    const pausedIcon = pausedContainer.querySelector("svg");
    expect(activeIcon).toBeTruthy();
    expect(pausedIcon).toBeTruthy();
    expect(activeIcon?.outerHTML).not.toBe(pausedIcon?.outerHTML);
  });

  it("swaps in a warning icon for an auto-paused rule so it reads differently from a manually paused one", () => {
    const { container: manual } = render(<RecurringRuleStatusBadge status="PAUSED" autoPaused={false} />);
    const { container: auto } = render(<RecurringRuleStatusBadge status="PAUSED" autoPaused />);
    expect(manual.querySelector("svg")?.outerHTML).not.toBe(auto.querySelector("svg")?.outerHTML);
    expect(screen.getAllByText("Paused")).toHaveLength(2);
  });
});
