import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AiMessageBubble } from "../AiMessageBubble";
import type { AiMessage } from "../../../../../types";

afterEach(cleanup);

const userMessage: AiMessage = {
  id: "m1",
  role: "USER",
  content: "How much did I spend on dining last month?",
  mode: "ASK",
  createdAt: "2026-08-18T09:00:00.000Z",
  toolCalls: [],
};

const assistantMessage: AiMessage = {
  id: "m2",
  role: "ASSISTANT",
  content: "You spent **₹4,200** on dining in July across 6 transactions.",
  mode: "ASK",
  createdAt: "2026-08-18T09:01:03.000Z",
  toolCalls: [
    {
      toolName: "get_spending_by_merchant",
      input: { category: "Dining" },
      output: { total: { amount: "4200.00", currency: "INR" } },
      status: "SUCCEEDED",
      errorMessage: null,
    },
  ],
};

describe("AiMessageBubble", () => {
  it("labels a user message distinctly from an assistant message", () => {
    render(<AiMessageBubble message={userMessage} />);
    expect(screen.getByRole("article", { name: "Your message" })).toBeInTheDocument();
  });

  it("renders assistant prose through the markdown-lite renderer", () => {
    render(<AiMessageBubble message={assistantMessage} />);
    expect(screen.getByRole("article", { name: "Assistant response" })).toBeInTheDocument();
    expect(screen.getByText("₹4,200").tagName).toBe("STRONG");
  });

  it("keeps tool calls collapsed by default, and reveals them on request", () => {
    render(<AiMessageBubble message={assistantMessage} />);
    expect(screen.queryByText("get_spending_by_merchant")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /how was this calculated/i }));
    expect(screen.getByText("get_spending_by_merchant")).toBeInTheDocument();
  });

  it("never renders tool call disclosure for a user message — toolCalls is always empty there", () => {
    render(<AiMessageBubble message={userMessage} />);
    expect(screen.queryByRole("button", { name: /how was this calculated/i })).not.toBeInTheDocument();
  });

  it("marks a pending optimistic bubble as sending, not with a real timestamp", () => {
    render(<AiMessageBubble message={userMessage} pending />);
    expect(screen.getByText("Sending…")).toBeInTheDocument();
  });
});
