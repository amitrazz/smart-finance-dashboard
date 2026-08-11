import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MetricValue } from "../common/MetricValue";
import { NO_DATA_LABEL } from "../../utils/insightsFormat";
import { useUIStore } from "../../../../store/useUIStore";

afterEach(cleanup);
beforeEach(() => useUIStore.setState({ moneyVisible: true }));

describe("MetricValue", () => {
  it("says so when a figure is missing, rather than printing a zero", () => {
    render(<MetricValue value={null} money />);
    expect(screen.getByText(NO_DATA_LABEL)).toBeInTheDocument();
  });

  it("treats undefined and empty string as missing too", () => {
    const { rerender } = render(<MetricValue value={undefined} />);
    expect(screen.getByText(NO_DATA_LABEL)).toBeInTheDocument();

    rerender(<MetricValue value="" />);
    expect(screen.getByText(NO_DATA_LABEL)).toBeInTheDocument();
  });

  it("renders a real zero as a zero", () => {
    // Zero savings and unknown savings must not look the same. This is the
    // whole reason the component exists.
    render(<MetricValue value={0} suffix="%" precision={0} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.queryByText(NO_DATA_LABEL)).not.toBeInTheDocument();
  });

  it("formats money with locale grouping and the backend's currency", () => {
    render(<MetricValue value={{ amount: "842000", currency: "INR" }} money />);
    // Indian digit grouping (8,42,000), produced by Intl — not by concatenating
    // a "₹" onto a raw number, which is what the old charts and heatmap did.
    expect(screen.getByText("₹8,42,000.00")).toBeInTheDocument();
  });

  it("honours a non-INR currency from the backend", () => {
    render(<MetricValue value={{ amount: "1500.5", currency: "USD" }} money />);
    expect(screen.getByText(/1,500\.50/)).toBeInTheDocument();
    expect(screen.queryByText(/₹/)).not.toBeInTheDocument();
  });

  it("stays inside privacy mode instead of leaking the amount", () => {
    useUIStore.setState({ moneyVisible: false });
    render(<MetricValue value={{ amount: "842000", currency: "INR" }} money />);

    // Every Insights figure used to call formatCurrency() directly, so hiding
    // amounts masked the rest of the app and left this workspace exposed.
    expect(screen.queryByText("₹8,42,000.00")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Hidden financial value")).toBeInTheDocument();
  });

  it("applies the requested precision to plain numbers", () => {
    render(<MetricValue value={12.345} suffix="%" precision={1} />);
    expect(screen.getByText("12.3%")).toBeInTheDocument();
  });
});
