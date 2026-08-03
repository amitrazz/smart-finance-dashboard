import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
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

describe("Planning Module (unified Goals & Budgets workspace)", () => {
  it("renders PlanningNavigation with all 5 primary sections", () => {
    render(
      <PlanningNavigation activeSection="overview" activeSubsection={null} onNavigate={() => {}} />
    );

    expect(screen.getByText("Overview")).toBeDefined();
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

    expect(screen.getByText("Planning")).toBeDefined();
  });
});
