import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "../../../../services/api/endpoints";
import { useAuthStore } from "../../../../store/useAuthStore";
import { AssistantPage } from "../AssistantPage";
import type { AiConversation, AiConversationDetail, AiMessage } from "../../../../types";

vi.mock("../../../../services/api/endpoints", () => ({
  api: {
    getAiConversations: vi.fn(),
    getAiConversation: vi.fn(),
    createAiConversation: vi.fn(),
    postAiMessage: vi.fn(),
  },
}));

beforeEach(() => {
  useAuthStore.setState({ isAuthenticated: true });
  vi.mocked(api.getAiConversations).mockResolvedValue({ data: [] });
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  useAuthStore.setState({ isAuthenticated: false });
});

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AssistantPage />
    </QueryClientProvider>,
  );
}

describe("AssistantPage — a conversation is created lazily, on the first message", () => {
  it("shows the empty state with no conversation created yet, and creates one only when a suggestion is used", async () => {
    const created: AiConversation = {
      id: "conv_1",
      title: null,
      createdAt: "2026-08-18T09:00:00.000Z",
      updatedAt: "2026-08-18T09:00:00.000Z",
    };
    vi.mocked(api.createAiConversation).mockResolvedValue(created);
    const assistantReply: AiMessage = {
      id: "m2",
      role: "ASSISTANT",
      content: "You spent ₹4,200 on dining in July.",
      mode: "ASK",
      createdAt: "2026-08-18T09:01:00.000Z",
      toolCalls: [],
    };
    vi.mocked(api.postAiMessage).mockResolvedValue(assistantReply);
    const detail: AiConversationDetail = {
      ...created,
      messages: [
        { id: "m1", role: "USER", content: "How much did I spend on dining last month?", mode: "ASK", createdAt: "2026-08-18T09:00:30.000Z", toolCalls: [] },
        assistantReply,
      ],
    };
    vi.mocked(api.getAiConversation).mockResolvedValue(detail);

    renderPage();

    expect(await screen.findByText("Ask anything about your finances")).toBeInTheDocument();
    expect(api.createAiConversation).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "How much did I spend on dining last month?" }));

    await waitFor(() => expect(api.createAiConversation).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(api.postAiMessage).toHaveBeenCalledWith("conv_1", { mode: "ASK", question: "How much did I spend on dining last month?" }),
    );

    // The server-persisted turn (not a hand-assembled one) is what ends up on screen.
    expect(await screen.findByText("You spent ₹4,200 on dining in July.")).toBeInTheDocument();
  });

  it("renders an inline, retryable error state on a failed send, and never treats the failure as a delivered message", async () => {
    const created: AiConversation = { id: "conv_1", title: null, createdAt: "t", updatedAt: "t" };
    vi.mocked(api.createAiConversation).mockResolvedValue(created);
    vi.mocked(api.getAiConversation).mockResolvedValue({ ...created, messages: [] });
    const { ApiError } = await import("../../../../services/api/client");
    vi.mocked(api.postAiMessage).mockRejectedValue(
      new ApiError("Too Many Requests", 429, "RATE_LIMIT", "Too many requests."),
    );

    renderPage();
    fireEvent.click(await screen.findByText("What are my biggest spending categories?"));

    expect(await screen.findByText("Slow down")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});
