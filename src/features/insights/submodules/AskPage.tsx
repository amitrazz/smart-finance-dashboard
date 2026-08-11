import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Send, ShieldCheck, ShieldAlert, CloudOff } from "lucide-react";
import { api } from "../../../services/api/endpoints";
import { FinancialAnswer } from "../../../types";
import { AnalyticsHeader } from "../components/AnalyticsHeader";

/**
 * Grounded Q&A over the user's own finances.
 *
 * The backend refuses to return an answer that asserts a figure it cannot tie
 * back to a snapshot, the ledger or the health engine — so this screen's job is
 * to make that verification *visible* rather than hide it behind a chat bubble.
 * Three outcomes, three distinct treatments: a verified answer, a rejected one,
 * and no data to answer from. Rendering all three as plain text would throw
 * away the only property that makes financial Q&A trustworthy.
 */

const SUGGESTIONS = [
  "Why did I spend more this month?",
  "What is my net worth?",
  "How much did I earn last month?",
  "How is my financial health score?",
];

const STATUS_STYLES = {
  ANSWERED: {
    Icon: ShieldCheck,
    tone: "text-emerald-400",
    panel: "border-emerald-500/30 bg-emerald-500/5",
    label: "Verified against your data",
  },
  UNGROUNDED: {
    Icon: ShieldAlert,
    tone: "text-amber-400",
    panel: "border-amber-500/30 bg-amber-500/5",
    label: "Answer withheld — could not be verified",
  },
  UNAVAILABLE: {
    Icon: CloudOff,
    tone: "text-slate-400",
    panel: "border-slate-700 bg-slate-900/60",
    label: "No data to answer from",
  },
} as const;

export const AskPage: React.FC = () => {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState("");

  const mutation = useMutation<FinancialAnswer, Error, string>({
    mutationFn: (q: string) => api.askFinancialQuestion(q),
  });

  const submit = (q: string) => {
    const trimmed = q.trim();
    // The backend bounds this at 3–500 chars; matching it here turns a 400 into
    // an inert button rather than a failed round-trip.
    if (trimmed.length < 3 || trimmed.length > 500) return;
    setAsked(trimmed);
    setQuestion(trimmed);
    mutation.mutate(trimmed);
  };

  const result = mutation.data;
  const style = result ? STATUS_STYLES[result.status] : null;

  return (
    <div className="space-y-6">
      <AnalyticsHeader
        title="Ask Your Finances"
        description="Answers are drawn only from your recorded data — any figure that can't be traced back to it is rejected rather than shown"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(question);
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <Sparkles className="w-4 h-4 text-indigo-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about your spending, cash flow, net worth, debts or health score…"
            maxLength={500}
            aria-label="Ask a question about your finances"
            className="w-full pl-10 pr-3 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={mutation.isPending || question.trim().length < 3}
          className="px-4 py-3 rounded-2xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shrink-0"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">{mutation.isPending ? "Asking…" : "Ask"}</span>
        </button>
      </form>

      {!result && !mutation.isPending && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => submit(s)}
              className="px-3 py-1.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-300 hover:border-indigo-500/40 hover:text-indigo-300 transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {mutation.isError && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 text-sm text-rose-300">
          Couldn't reach the assistant. Please try again.
        </div>
      )}

      {result && style && (
        <div className={`p-5 rounded-3xl border space-y-4 ${style.panel}`}>
          <div className="flex items-center gap-2">
            <style.Icon className={`w-4 h-4 ${style.tone}`} />
            <span className={`text-[11px] font-bold uppercase tracking-wider ${style.tone}`}>
              {style.label}
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] text-slate-500">{asked}</p>
            <p className="text-sm text-slate-100 leading-relaxed">{result.answer}</p>
          </div>

          {result.status === "ANSWERED" && (
            <div className="pt-3 border-t border-slate-800/60 space-y-2">
              {result.usedMetrics.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Based on
                  </span>
                  {result.usedMetrics.map((m) => (
                    <span
                      key={m}
                      className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                {/* asOf is never "now" — figures describe a snapshot date. */}
                <span>
                  Figures as of <strong className="text-slate-400">{result.asOf}</strong>
                </span>
                <span>
                  Model confidence{" "}
                  <strong className="text-slate-400">
                    {Math.round(result.confidence * 100)}%
                  </strong>
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
