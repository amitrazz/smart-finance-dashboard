import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AskSection } from "../AskSection";
import { api } from "../../../../../services/api/endpoints";

vi.mock("../../../../../services/api/endpoints", () => ({
  api: {
    askFinancialQuestion: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe("AskSection", () => {
  it("renders verified answer with simple string usedMetrics correctly", async () => {
    const mockAnswer = {
      status: "ANSWERED",
      intent: "CASH_FLOW",
      answer: "Your income was 1316182.29 INR.",
      usedMetrics: ["INCOME", "SAVINGS"],
      confidence: 1,
      asOf: "2026-08-01",
    };
    vi.mocked(api.askFinancialQuestion).mockResolvedValue(mockAnswer);

    renderWithQueryClient(<AskSection />);

    const input = screen.getByPlaceholderText(/Ask about spending/i);
    const form = input.closest("form");
    fireEvent.change(input, { target: { value: "How much did I earn last month?" } });
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText("Your income was 1316182.29 INR.")).toBeInTheDocument();
    });

    expect(screen.getByText("INCOME")).toBeInTheDocument();
    expect(screen.getByText("SAVINGS")).toBeInTheDocument();
  });

  it("renders verified answer with UsedMetric object usedMetrics correctly", async () => {
    const mockAnswer = {
      status: "ANSWERED",
      intent: "CASH_FLOW",
      answer: "Your income was 1316182.29 INR.",
      usedMetrics: [
        {
          metric: "INCOME",
          source: "SNAPSHOT",
          period: {
            start: "2026-07-01",
            end: "2026-07-31",
          },
        },
      ],
      confidence: 1,
      asOf: "2026-08-01",
    };
    vi.mocked(api.askFinancialQuestion).mockResolvedValue(mockAnswer);

    renderWithQueryClient(<AskSection />);

    const input = screen.getByPlaceholderText(/Ask about spending/i);
    const form = input.closest("form");
    fireEvent.change(input, { target: { value: "How much did I earn last month?" } });
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText("Your income was 1316182.29 INR.")).toBeInTheDocument();
    });

    const metricBadge = screen.getByText("INCOME");
    expect(metricBadge).toBeInTheDocument();
    expect(metricBadge).toHaveAttribute("title", "SNAPSHOT (2026-07-01 to 2026-07-31)");
  });
});
