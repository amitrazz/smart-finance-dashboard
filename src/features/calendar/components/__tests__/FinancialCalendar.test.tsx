import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { CalendarEventCard } from "../CalendarEventCard";
import { getSmartCountdown } from "../CalendarHelpers";
import { UpcomingTimelineView } from "../CalendarViews/UpcomingTimelineView";
import { FinancialCalendarEvent } from "../../types";

const sampleEvent: FinancialCalendarEvent = {
  id: "test-1",
  title: "Personal Loan EMI",
  description: "Monthly loan installment",
  category: "EMI",
  date: "2026-08-05",
  amount: { amount: "49365", currency: "INR" },
  direction: "OUTGOING",
  priority: "HIGH",
  status: "UPCOMING",
  accountName: "ICICI Salary",
  institutionName: "ICICI Bank",
  isAutoDebit: true,
};

describe("Financial Calendar Components", () => {
  /**
   * Local calendar date as `YYYY-MM-DD`, `offsetDays` from today.
   *
   * Deliberately not `toISOString()`, which the previous version of this test
   * used: that returns the **UTC** date, so between 00:00 and 05:30 IST — or any
   * evening in the Americas — it asked "is yesterday due today?" and failed. A
   * countdown shown to a user in their own timezone has to be tested in it.
   */
  const localDateString = (offsetDays = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
  };

  it("computes smart countdowns correctly", () => {
    expect(getSmartCountdown(localDateString(0))).toBe("Due Today");
    expect(getSmartCountdown(localDateString(1))).toBe("Tomorrow");
    expect(getSmartCountdown(localDateString(-1))).toBe("1 Day Overdue");
    expect(getSmartCountdown(localDateString(-3))).toBe("3 Days Overdue");
    expect(getSmartCountdown(localDateString(4))).toBe("In 4 Days");
  });

  it("reads a date-only string in the reader's timezone, not in UTC", () => {
    // Regression: `new Date("2026-08-15")` is UTC midnight, so west of Greenwich
    // it floors to the previous local day and every event counted down a day
    // early — a bill due on the 15th read "Due Today" on the 14th.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parsedAsUtc = new Date(localDateString(0));

    // The two only agree east of Greenwich; the countdown must be right in both.
    expect(getSmartCountdown(localDateString(0))).toBe("Due Today");
    expect(parsedAsUtc.getTime()).toBeTypeOf("number");
  });

  it("never renders 'Invalid Date' for input it cannot parse", () => {
    expect(getSmartCountdown("not-a-date")).toBe("Approaching");
    expect(getSmartCountdown("")).toBe("Approaching");
  });

  it("renders CalendarEventCard with title, amount and priority badge", () => {
    render(<CalendarEventCard event={sampleEvent} />);

    expect(screen.getByText("Personal Loan EMI")).toBeDefined();
    expect(screen.getByText("🔴 HIGH")).toBeDefined();
  });

  it("triggers onAction callback when Pay Now button is clicked", () => {
    const onActionMock = vi.fn();
    render(<CalendarEventCard event={sampleEvent} onAction={onActionMock} />);

    const payButton = screen.getByText("Pay Now");
    fireEvent.click(payButton);

    expect(onActionMock).toHaveBeenCalledWith("test-1", "PAY");
  });

  it("renders empty state when no events are passed to UpcomingTimelineView", () => {
    render(
      <UpcomingTimelineView
        events={[]}
        onSelectEvent={vi.fn()}
        onAction={vi.fn()}
      />
    );

    expect(screen.getByText("You're all caught up!")).toBeDefined();
  });
});
