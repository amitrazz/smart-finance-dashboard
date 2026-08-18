import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "../../../../services/api/endpoints";
import { useAuthStore } from "../../../../store/useAuthStore";
import { AI_CONVERSATION_QUERY_KEYS, usePostAiMessage } from "../useFinanceAgentQueries";
import type { AiMessage } from "../../../../types";

vi.mock("../../../../services/api/endpoints", () => ({
  api: { postAiMessage: vi.fn() },
}));

beforeEach(() => {
  useAuthStore.setState({ isAuthenticated: true });
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  useAuthStore.setState({ isAuthenticated: false });
});

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, queryClient };
}

const assistantReply: AiMessage = {
  id: "msg_2",
  role: "ASSISTANT",
  content: "You spent ₹4,200 on dining in July across 6 transactions.",
  mode: "ASK",
  createdAt: "2026-08-18T09:01:03.000Z",
  toolCalls: [
    {
      toolName: "get_spending_by_merchant",
      input: { category: "Dining", period: "2026-07" },
      output: { total: { amount: "4200.00", currency: "INR" }, count: 6 },
      status: "SUCCEEDED",
      errorMessage: null,
    },
  ],
};

describe("usePostAiMessage — the conversation query is the single source of truth", () => {
  it("on success, invalidates the conversation detail so the UI re-fetches the full (user+assistant) turn, rather than hand-assembling it from the partial response", async () => {
    vi.mocked(api.postAiMessage).mockResolvedValue(assistantReply);
    const { wrapper, queryClient } = makeWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => usePostAiMessage(), { wrapper });
    result.current.mutate({ conversationId: "conv_1", mode: "ASK", question: "How much did I spend on dining?" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => JSON.stringify(call[0]?.queryKey));
    expect(invalidatedKeys).toContainEqual(JSON.stringify(AI_CONVERSATION_QUERY_KEYS.detail("conv_1")));
  });

  it("exposes the just-sent question via `variables` while pending — the composer renders this as the optimistic bubble instead of writing a synthetic message into the cache", async () => {
    let resolvePost: (value: AiMessage) => void = () => {};
    vi.mocked(api.postAiMessage).mockReturnValue(
      new Promise((resolve) => {
        resolvePost = resolve;
      }),
    );
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => usePostAiMessage(), { wrapper });

    result.current.mutate({ conversationId: "conv_1", mode: "ASK", question: "Why did my expenses rise?" });

    await waitFor(() => expect(result.current.isPending).toBe(true));
    expect(result.current.variables?.question).toBe("Why did my expenses rise?");

    resolvePost(assistantReply);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("surfaces a rejected 10/min rate limit as a plain error the caller can present inline, without retrying automatically", async () => {
    const { ApiError } = await import("../../../../services/api/client");
    vi.mocked(api.postAiMessage).mockRejectedValue(
      new ApiError("Too Many Requests", 429, "RATE_LIMIT", "Too many requests."),
    );
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => usePostAiMessage(), { wrapper });

    result.current.mutate({ conversationId: "conv_1", mode: "ASK", question: "Another question" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(api.postAiMessage).toHaveBeenCalledTimes(1);
  });
});
