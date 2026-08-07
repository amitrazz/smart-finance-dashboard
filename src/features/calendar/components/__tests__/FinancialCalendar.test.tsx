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
  it("computes smart countdowns correctly", () => {
    const todayStr = new Date().toISOString().split("T")[0];
    expect(getSmartCountdown(todayStr)).toBe("Due Today");
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
