import React, { useState } from "react";
import { ChevronDown, CheckCircle2, XCircle } from "lucide-react";
import type { AiToolCall } from "../../../../types";

/**
 * "How was this calculated" — collapsed by default per the backend team's
 * own checklist ("most users won't want to see raw tool JSON"). Renders the
 * tool name, its status, and its raw input/output verbatim — this is a debug
 * aid, not a place to reformat or interpret backend output, and never a
 * place to render hidden chain-of-thought (there is none in `toolCalls`;
 * only `{toolName, input, output, status, errorMessage}` is ever backend-sent).
 */
export const AiToolCallDisclosure: React.FC<{ toolCalls: AiToolCall[] }> = ({ toolCalls }) => {
  const [open, setOpen] = useState(false);
  if (toolCalls.length === 0) return null;

  const failedCount = toolCalls.filter((t) => t.status === "FAILED").length;

  return (
    <div className="mt-2 border-t border-slate-800/60 pt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 rounded"
      >
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        How was this calculated ({toolCalls.length} data lookup{toolCalls.length === 1 ? "" : "s"}
        {failedCount > 0 ? `, ${failedCount} failed` : ""})
      </button>

      {open && (
        <ul className="mt-2 space-y-1.5">
          {toolCalls.map((call, index) => (
            <li
              key={`${call.toolName}-${index}`}
              className="rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-2 text-[11px]"
            >
              <div className="flex items-center gap-1.5">
                {call.status === "SUCCEEDED" ? (
                  <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" aria-hidden="true" />
                ) : (
                  <XCircle className="h-3 w-3 shrink-0 text-rose-500" aria-hidden="true" />
                )}
                <span className="font-mono text-slate-300">{call.toolName}</span>
              </div>
              {call.status === "FAILED" && call.errorMessage && (
                <p className="mt-1 text-rose-400">{call.errorMessage}</p>
              )}
              {call.status === "SUCCEEDED" && (
                <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-words font-mono text-slate-500">
                  {safeStringify(call.output)}
                </pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
