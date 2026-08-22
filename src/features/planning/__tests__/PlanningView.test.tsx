import { describe, it, expect, afterEach } from "vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PlanningView } from "../PlanningView";
import { PlanningNavigation } from "../components/PlanningNavigation";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

afterEach(() => cleanup());

describe("Planning Module (unified Goals & Budgets workspace)", () => {
  it("renders PlanningNavigation with all 6 primary sections", () => {
    render(
      <PlanningNavigation activeSection="overview" activeSubsection={null} onNavigate={() => {}} />
    );

    expect(screen.getByText("Overview")).toBeDefined();
    expect(screen.getByText("Monthly Plan")).toBeDefined();
    expect(screen.getByText("Goals")).toBeDefined();
    expect(screen.getByText("Budgets")).toBeDefined();
    expect(screen.getByText("Insights")).toBeDefined();
    expect(screen.getByText("Reports")).toBeDefined();
  });

  it("renders PlanningView container with QueryClientProvider", () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <PlanningView />
      </QueryClientProvider>
    );

    // Pre-existing ambiguity, unrelated to the Monthly Plan tab: the page
    // <h1> and the breadcrumb both render the literal text "Planning" for
    // the default "overview" section, so a plain getByText matches both.
    // The <h1> is the one truly unique landmark.
    expect(screen.getByRole("heading", { name: "Planning" })).toBeDefined();
  });
});
