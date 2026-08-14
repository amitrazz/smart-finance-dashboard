import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { InsightsQueryResult } from "../hooks/useInsightsQueries";
import type { IntelligenceItem } from "../api/intelligenceModel";
import { useUIStore } from "../../../store/useUIStore";

const hooks = vi.hoisted(() => ({ useIntelligenceFeed: vi.fn() }));
vi.mock("../hooks/useInsightsQueries", () => hooks);

// Ask owns a separate data path and a network call of its own; this file is
// about the feed, so the tab is stubbed rather than exercised here.
vi.mock("../pages/intelligence/AskSection", () => ({
  AskSection: () => <div>Ask panel</div>,
}));

import { IntelligencePage } from "../pages/IntelligencePage";
import { InsightDetail } from "../components/intelligence/InsightDetail";

const money = (amount: string) => ({ amount, currency: "INR" });

const item = (over: Partial<IntelligenceItem> = {}): IntelligenceItem => ({
  id: "a1",
  nature: "risk",
  severity: "CRITICAL",
  category: "Credit",
  filters: ["all", "risk", "attention", "debt"],
  title: "Card payment overdue",
  observed: "Utilisation is 82% against a 30% target.",
  interpretation: "Your card is close to its limit.",
  suggestedAction: "Pay the statement balance before the due date.",
  financialImpact: money("18000"),
  dueInDays: -2,
  confidencePercent: 100,
  scoreImpact: -6,
  evidence: [
    {
      metric: "credit_utilisation",
      value: 0.82,
      unit: "RATIO",
      period: "Aug 2026",
      baseline: { value: 0.3, period: null, label: "your target" },
      comparison: { kind: "ABOVE", changePercent: 173, changeAbsolute: null },
      source: "SNAPSHOT",
      sourceEntityIds: [],
      confidence: 1,
    },
  ],
  affectedEntity: "HDFC Credit Card",
  deepLink: "credit-cards",
  component: null,
  rank: 80,
  ...over,
});

const opportunity = item({
  id: "o1",
  nature: "opportunity",
  severity: "LOW",
  category: "Savings",
  filters: ["all", "opportunity"],
  title: "Idle cash could be earning",
  observed: "₹1,20,000 has sat in a current account for three months.",
  interpretation: null,
  suggestedAction: null,
  financialImpact: money("120000"),
  dueInDays: null,
  confidencePercent: null,
  scoreImpact: null,
  evidence: [],
  affectedEntity: null,
  deepLink: null,
  rank: 20,
});

function result(data: IntelligenceItem[] | null, over: Partial<InsightsQueryResult<IntelligenceItem[]>> = {}) {
  return {
    data,
    isLoading: false,
    isError: false,
    isPartial: false,
    isStale: false,
    updatedAt: Date.parse("2026-08-14T09:00:00Z"),
    refetch: vi.fn(),
    ...over,
  };
}

const renderPage = (view: string | null = "feed") =>
  render(<IntelligencePage view={view} onNavigate={vi.fn()} />);

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  hooks.useIntelligenceFeed.mockReturnValue(result([item(), opportunity]));
  useUIStore.setState({ moneyVisible: true });
});

describe("the feed is one list, ranked", () => {
  it("counts what genuinely needs attention rather than everything detected", () => {
    renderPage();
    // Two items, but only the risk is severe — an opportunity is not a worry.
    expect(screen.getByRole("heading", { name: "1 thing deserves your attention" })).toBeInTheDocument();
  });

  it("leads with the observation, which is what earns the reader's trust", () => {
    renderPage();
    expect(screen.getByText("Utilisation is 82% against a 30% target.")).toBeInTheDocument();
  });

  it("labels nature in words, never in colour alone", () => {
    renderPage();
    // Scoped to the list: "Opportunity" is legitimately also a filter chip.
    const list = within(screen.getByRole("list"));
    expect(list.getByText("Critical")).toBeInTheDocument();
    expect(list.getByText("Opportunity")).toBeInTheDocument();
  });

  it("offers only filters that would return something", () => {
    renderPage();
    const filters = screen.getByRole("group", { name: "Filter intelligence" });

    expect(within(filters).getByRole("button", { name: /Risk/ })).toBeInTheDocument();
    // Nothing in the feed is tagged with these, so offering them would only
    // teach the reader that the filter row leads to empty screens.
    expect(within(filters).queryByRole("button", { name: /Goals/ })).not.toBeInTheDocument();
    expect(within(filters).queryByRole("button", { name: /Investments/ })).not.toBeInTheDocument();
  });

  it("filters the list without losing the way back", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /Opportunity 1/ }));
    expect(screen.getByText("Idle cash could be earning")).toBeInTheDocument();
    expect(screen.queryByText("Card payment overdue")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /All 2/ }));
    expect(screen.getByText("Card payment overdue")).toBeInTheDocument();
  });
});

describe("the detail drawer makes the case", () => {
  const openDetail = () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Critical: Card payment overdue/ }));
    return screen.getByRole("dialog");
  };

  it("separates what was observed from what it means and what to do", () => {
    const dialog = openDetail();

    expect(within(dialog).getByText("What was observed")).toBeInTheDocument();
    expect(within(dialog).getByText("What this means")).toBeInTheDocument();
    expect(within(dialog).getByText("Suggested action")).toBeInTheDocument();
  });

  it("shows the measured figures behind the finding, with their baseline", () => {
    const dialog = openDetail();

    expect(within(dialog).getByText("Credit utilisation")).toBeInTheDocument();
    expect(within(dialog).getByText("82%")).toBeInTheDocument();
    expect(within(dialog).getByText(/vs.*30%.*your target/)).toBeInTheDocument();
  });

  it("is a modal dialog whose close button takes focus on open", () => {
    const dialog = openDetail();

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(document.activeElement).toBe(within(dialog).getByRole("button", { name: "Close detail" }));
  });

  it("asks to be closed on Escape", () => {
    // Asserted against the component rather than the page: `AnimatePresence`
    // keeps the node mounted through its exit transition, which never settles in
    // jsdom, so "did it unmount" is not the observable behaviour here — "did it
    // ask to close" is.
    const onClose = vi.fn();
    render(<InsightDetail item={item()} onClose={onClose} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps evidence amounts inside privacy mode", () => {
    useUIStore.setState({ moneyVisible: false });
    const dialog = openDetail();

    expect(dialog.textContent).toContain("••••");
    expect(dialog.textContent).not.toContain("18,000");
  });
});

describe("states", () => {
  it("says nothing needs attention rather than rendering an empty list", () => {
    hooks.useIntelligenceFeed.mockReturnValue(result(null));
    renderPage();

    expect(screen.getByText("Nothing needs your attention")).toBeInTheDocument();
  });

  it("keeps Ask reachable as its own route", () => {
    renderPage("ask");
    expect(screen.getByText("Ask panel")).toBeInTheDocument();
  });
});

describe("privacy reaches text the backend wrote", () => {
  it("masks amounts embedded in rule prose, not just rendered figures", () => {
    // Regression, found in visual QA of privacy mode: every `<Money>` masked
    // correctly and the card underneath still read "Interest charged was ₹3,870
    // against a 3-month average of ₹3,120" — backend explanations arrive as
    // prose with the amounts already formatted in, so they never passed through
    // the privacy layer at all.
    const withProseAmounts = item({
      observed: "Interest charged was ₹3,870 against a 3-month average of ₹3,120 — 24% above baseline.",
    });
    hooks.useIntelligenceFeed.mockReturnValue(result([withProseAmounts]));
    useUIStore.setState({ moneyVisible: false });
    renderPage();

    const list = screen.getByRole("list");
    expect(list.textContent).not.toContain("₹3,870");
    expect(list.textContent).not.toContain("₹3,120");
    // The comparison the sentence exists to make survives; only the amounts go.
    expect(list.textContent).toContain("24% above baseline");
  });

  it("leaves amounts in place when they are meant to be visible", () => {
    hooks.useIntelligenceFeed.mockReturnValue(
      result([item({ observed: "Interest charged was ₹3,870 this period." })]),
    );
    renderPage();

    expect(screen.getByRole("list").textContent).toContain("₹3,870");
  });
});
