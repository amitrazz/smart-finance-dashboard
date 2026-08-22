import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { MonthNavigator } from "../MonthNavigator";
import { getCurrentYearMonth } from "../monthlyPlanner.utils";

afterEach(() => cleanup());

describe("MonthNavigator", () => {
  it("shows the formatted month label", () => {
    render(<MonthNavigator year={2026} month={8} onChange={() => {}} onRefresh={() => {}} />);
    expect(screen.getByText("August 2026")).toBeDefined();
  });

  it("calls onChange with the previous month when the prev arrow is clicked", () => {
    const onChange = vi.fn();
    render(<MonthNavigator year={2026} month={8} onChange={onChange} onRefresh={() => {}} />);
    fireEvent.click(screen.getByLabelText("Previous month"));
    expect(onChange).toHaveBeenCalledWith(2026, 7);
  });

  it("calls onChange with the next month when the next arrow is clicked, rolling over the year at December", () => {
    const onChange = vi.fn();
    render(<MonthNavigator year={2026} month={12} onChange={onChange} onRefresh={() => {}} />);
    fireEvent.click(screen.getByLabelText("Next month"));
    expect(onChange).toHaveBeenCalledWith(2027, 1);
  });

  it("hides the Current Month button when already on the current month, shows it otherwise", () => {
    const current = getCurrentYearMonth();
    const { rerender } = render(
      <MonthNavigator year={current.year} month={current.month} onChange={() => {}} onRefresh={() => {}} />
    );
    expect(screen.queryByText("Current Month")).toBeNull();

    rerender(<MonthNavigator year={2020} month={1} onChange={() => {}} onRefresh={() => {}} />);
    expect(screen.getByText("Current Month")).toBeDefined();
  });

  it("jumps to the current month when Current Month is clicked", () => {
    const onChange = vi.fn();
    const current = getCurrentYearMonth();
    render(<MonthNavigator year={2020} month={1} onChange={onChange} onRefresh={() => {}} />);
    fireEvent.click(screen.getByText("Current Month"));
    expect(onChange).toHaveBeenCalledWith(current.year, current.month);
  });

  it("calls onRefresh when the refresh button is clicked", () => {
    const onRefresh = vi.fn();
    render(<MonthNavigator year={2026} month={8} onChange={() => {}} onRefresh={onRefresh} />);
    fireEvent.click(screen.getByLabelText("Refresh monthly plan"));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
