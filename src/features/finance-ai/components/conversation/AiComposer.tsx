import React, { useState } from "react";
import { Send } from "lucide-react";
import type { AiMessageMode } from "../../../../types";
import { Button } from "../../../../components/ui/Button";

const MIN_LENGTH = 3;
const MAX_LENGTH = 500;

// `ACT` is a documented-but-unimplemented 4th mode (backend-platform
// docs/21-frontend-finance-ai-agent-integration.md) — never offer it.
const MODES: { id: AiMessageMode; label: string; hint: string }[] = [
  { id: "ASK", label: "Ask", hint: "A direct question about your data" },
  { id: "EXPLAIN", label: "Explain", hint: "Why something is the way it is" },
  { id: "RECOMMEND", label: "Recommend", hint: "What you could do about it" },
];

export const AiComposer: React.FC<{
  disabled?: boolean;
  onSend: (mode: AiMessageMode, question: string) => void;
}> = ({ disabled = false, onSend }) => {
  const [mode, setMode] = useState<AiMessageMode>("ASK");
  const [question, setQuestion] = useState("");

  const trimmed = question.trim();
  const canSend = !disabled && trimmed.length >= MIN_LENGTH && trimmed.length <= MAX_LENGTH;

  const submit = () => {
    if (!canSend) return;
    onSend(mode, trimmed);
    setQuestion("");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-2"
    >
      <div role="radiogroup" aria-label="Question mode" className="flex flex-wrap gap-1.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={mode === m.id}
            title={m.hint}
            onClick={() => setMode(m.id)}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
              mode === m.id
                ? "border-blue-500/50 bg-blue-500/10 text-blue-300"
                : "border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            maxLength={MAX_LENGTH}
            placeholder="Ask about spending, cash flow, net worth, debt or your goals…"
            aria-label="Message the assistant"
            disabled={disabled}
            className="max-h-32 w-full resize-none rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none disabled:opacity-60"
          />
          <div className="mt-1 flex items-center justify-between px-1 text-[10px] text-slate-600">
            <span>Enter to send, Shift+Enter for a new line</span>
            <span className={trimmed.length > MAX_LENGTH ? "text-rose-400" : undefined}>
              {trimmed.length}/{MAX_LENGTH}
            </span>
          </div>
        </div>
        <Button
          type="submit"
          size="icon"
          disabled={!canSend}
          isLoading={disabled}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
};

export default AiComposer;
