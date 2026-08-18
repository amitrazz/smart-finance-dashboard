import React from "react";
import { Sparkles } from "lucide-react";
import type { AiMessageMode } from "../../../../types";

/**
 * Prompts reflect what the 21 registered read-only tools actually cover
 * (accounts, transactions, net worth, cash flow, spending breakdown,
 * credit/loan/liabilities, investment returns, goals, budgets, recurring
 * transactions, financial health, affordability, period comparisons — see
 * docs/19-finance-agent.md "Tool framework") — not an arbitrary chatbot
 * prompt list. This is illustrative, not exhaustive: any question about the
 * user's own finance data is fair game.
 */
const SUGGESTIONS: { mode: AiMessageMode; question: string }[] = [
  { mode: "ASK", question: "How much did I spend on dining last month?" },
  { mode: "EXPLAIN", question: "Why is my cash flow negative this month?" },
  { mode: "RECOMMEND", question: "How much can I safely invest this month?" },
  { mode: "ASK", question: "What are my biggest spending categories?" },
  { mode: "EXPLAIN", question: "Why did my expenses increase this month?" },
  { mode: "ASK", question: "How is my financial health score looking?" },
];

export const AiEmptyState: React.FC<{
  onSelectSuggestion: (mode: AiMessageMode, question: string) => void;
}> = ({ onSelectSuggestion }) => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 text-blue-400">
        <Sparkles className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-slate-100">Ask anything about your finances</h3>
        <p className="max-w-sm text-xs leading-relaxed text-slate-500">
          Answers are grounded in your own accounts and transactions — anything the assistant can't
          verify against your data is withheld rather than guessed.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 pt-1">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.question}
            type="button"
            onClick={() => onSelectSuggestion(s.mode, s.question)}
            className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-slate-700 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {s.question}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AiEmptyState;
