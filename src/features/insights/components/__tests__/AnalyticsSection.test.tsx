import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AnalyticsSection } from "../common/AnalyticsSection";
import type { InsightsQueryResult } from "../../hooks/useInsightsQueries";

afterEach(cleanup);

function result<T>(over: Partial<InsightsQueryResult<T>> = {}): InsightsQueryResult<T> {
  return {
    data: null,
    isLoading: false,
    isError: false,
    isPartial: false,
    isStale: false,
    updatedAt: null,
    refetch: vi.fn(),
    ...over,
  };
}

const renderSection = (r: InsightsQueryResult<string>, extra = {}) =>
  render(
    <AnalyticsSection title="Net worth" result={r} {...extra}>
      {(data) => <p>Body: {data}</p>}
    </AnalyticsSection>,
  );

/**
 * Every analytics section routes through this component, so testing the state
 * machine once covers the "all five states everywhere" requirement structurally
 * rather than section by section.
 */
describe("AnalyticsSection state machine", () => {
  it("shows a skeleton and marks the region busy while loading", () => {
    renderSection(result({ isLoading: true }));

    expect(screen.getByRole("region", { name: "Net worth" })).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText(/^Body:/)).not.toBeInTheDocument();
  });

  it("shows an error with a working retry when the request failed", () => {
    const refetch = vi.fn();
    renderSection(result({ isError: true, refetch }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Retry/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("prefers the error state over the empty state when both could apply", () => {
    // `data` is null during an error too; reporting "nothing here yet" would
    // tell the user their account is empty when the request simply failed.
    renderSection(result({ isError: true }));
    expect(screen.queryByText("Nothing to show yet")).not.toBeInTheDocument();
  });

  it("explains an empty section rather than rendering a blank region", () => {
    renderSection(result({ data: null }), {
      emptyTitle: "No net-worth snapshot",
      emptyMessage: "Add an account and a snapshot will be recorded.",
    });

    expect(screen.getByText("No net-worth snapshot")).toBeInTheDocument();
    expect(screen.getByText("Add an account and a snapshot will be recorded.")).toBeInTheDocument();
  });

  it("renders the body with non-null data, so children never guard for null", () => {
    renderSection(result({ data: "ok" }));
    expect(screen.getByText("Body: ok")).toBeInTheDocument();
  });

  it("shows the partial notice above real content, not instead of it", () => {
    renderSection(result({ data: "ok", isPartial: true }));

    expect(screen.getByText(/Part of this section's data didn't load/)).toBeInTheDocument();
    expect(screen.getByText("Body: ok")).toBeInTheDocument();
  });

  it("keeps cached content on screen while a refresh runs, and leaves the notice to the header", () => {
    // Freshness is a property of the workspace, not of each card: one refresh
    // used to stamp "Updating…" on every section at once. The header states it
    // once now, so a section's only job while stale is to keep showing what it
    // has rather than blanking.
    renderSection(result({ data: "ok", isStale: true }));

    expect(screen.getByText("Body: ok")).toBeInTheDocument();
    expect(screen.queryByText("Updating…")).not.toBeInTheDocument();
  });

  it("does not blank a section that is loading for the first time", () => {
    renderSection(result({ isLoading: true, isStale: true }));
    expect(screen.queryByText("Body:")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Net worth" })).toHaveAttribute("aria-busy", "true");
  });

  it("offers a handoff to the module that owns the domain", () => {
    const onClick = vi.fn();
    renderSection(result({ data: "ok" }), { link: { label: "Accounts & Cash", onClick } });

    fireEvent.click(screen.getByRole("button", { name: /Accounts & Cash/ }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("uses a real heading so the page has a navigable outline", () => {
    renderSection(result({ data: "ok" }));
    expect(screen.getByRole("heading", { name: "Net worth", level: 2 })).toBeInTheDocument();
  });

  it("can nest as a level-3 heading inside a page that owns level 2", () => {
    renderSection(result({ data: "ok" }), { headingLevel: "h3" });
    expect(screen.getByRole("heading", { name: "Net worth", level: 3 })).toBeInTheDocument();
  });
});
