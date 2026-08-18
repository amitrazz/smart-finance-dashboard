import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  CloudOff,
  HelpCircle,
  Send,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Sparkles,
} from "lucide-react";
import { api } from "../../../../services/api/endpoints";
import { FinancialAnswer } from "../../../../types";

/**
 * Grounded Q&A over the user's own finances.
 *
 * The backend refuses to return an answer asserting a figure it cannot tie back
 * to a snapshot, the ledger or the health engine — so this screen's job is to
 * make that verification *visible* rather than hide it behind a chat bubble.
 * Three outcomes, three distinct treatments: a verified answer, a rejected one,
 * and no data to answer from. Rendering all three as plain text would throw
 * away the only property that makes financial Q&A trustworthy.
 *
 * Carried over from the previous workspace unchanged in behaviour; only the
 * chrome was brought in line with the rest of Intelligence.
 */

const SUGGESTIONS = [
  "Why did I spend more this month?",
  "What is my net worth?",
  "How much did I earn last month?",
  "How is my financial health score?",
];

// Every status the backend documents for this endpoint (backend-platform
// docs/21-frontend-finance-ai-agent-integration.md's own checklist: "Handle
// all 8 status values ... not just ANSWERED"). `INSUFFICIENT_DATA` and
// `UNSUPPORTED_QUERY` get distinct, actionable copy per that doc's guidance
// rather than folding into a generic failure state.
const STATUS_STYLES = {
  ANSWERED: {
    Icon: ShieldCheck,
    tone: "text-emerald-400",
    panel: "border-emerald-500/30 bg-emerald-500/5",
    label: "Verified against your data",
  },
  PARTIAL: {
    Icon: ShieldAlert,
    tone: "text-amber-400",
    panel: "border-amber-500/30 bg-amber-500/5",
    label: "Partially answered",
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
    panel: "border-slate-700 bg-slate-900/40",
    label: "No data to answer from",
  },
  INSUFFICIENT_DATA: {
    Icon: AlertCircle,
    tone: "text-sky-400",
    panel: "border-sky-500/30 bg-sky-500/5",
    label: "Not enough connected data to answer this",
  },
  UNSUPPORTED_QUERY: {
    Icon: HelpCircle,
    tone: "text-slate-400",
    panel: "border-slate-700 bg-slate-900/40",
    label: "Try rephrasing the question",
  },
  INVALID_QUERY: {
    Icon: HelpCircle,
    tone: "text-slate-400",
    panel: "border-slate-700 bg-slate-900/40",
    label: "Couldn't understand that question",
  },
  ERROR: {
    Icon: ShieldX,
    tone: "text-rose-400",
    panel: "border-rose-500/30 bg-rose-500/5",
    label: "Something went wrong answering that",
  },
} as const;

export const AskSection: React.FC = () => {
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
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold tracking-tight text-slate-100">Ask</h2>
        <p className="text-xs leading-relaxed text-slate-400">
          Answers come only from your recorded data. Any figure that can't be traced back to it is
          withheld rather than shown.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(question);
        }}
        className="flex items-center gap-2"
      >
        <div className="relative min-w-0 flex-1">
          <Sparkles
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about spending, cash flow, net worth, debt or your health score…"
            maxLength={500}
            aria-label="Ask a question about your finances"
            className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900/60 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={mutation.isPending || question.trim().length < 3}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{mutation.isPending ? "Asking…" : "Ask"}</span>
        </button>
      </form>

      {!result && !mutation.isPending && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => submit(suggestion)}
              className="rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:border-slate-700 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {mutation.isError && (
        <p
          className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs text-rose-300"
          role="alert"
        >
          Couldn't reach the assistant. Please try again.
        </p>
      )}

      {result && style && (
        <div className={`space-y-3 rounded-xl border p-4 ${style.panel}`} role="status">
          <div className="flex items-center gap-2">
            <style.Icon className={`h-4 w-4 ${style.tone}`} aria-hidden="true" />
            <span
              className={`text-[11px] font-semibold uppercase tracking-wide ${style.tone}`}
            >
              {style.label}
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] text-slate-500">{asked}</p>
            <p className="text-sm leading-relaxed text-slate-100">{result.answer}</p>
          </div>

          {result.status === "ANSWERED" && (
            <div className="space-y-2 border-t border-slate-800/60 pt-3">
              {result.usedMetrics.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Based on
                  </span>
                  {result.usedMetrics.map((metric, index) => {
                    const isObj = typeof metric === "object" && metric !== null;
                    const name = isObj ? metric.metric : metric;
                    const key = isObj ? `${metric.metric}-${index}` : metric;
                    const tooltip = isObj
                      ? `${metric.source}${metric.period ? ` (${metric.period.start} to ${metric.period.end})` : ""}`
                      : undefined;
                    return (
                      <span
                        key={key}
                        title={tooltip}
                        className="rounded border border-slate-800 bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] text-slate-300"
                      >
                        {name}
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500">
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
    </section>
  );
};
