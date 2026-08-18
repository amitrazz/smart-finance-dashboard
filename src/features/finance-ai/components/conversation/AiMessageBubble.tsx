import React from "react";
import { Sparkles, User } from "lucide-react";
import type { AiMessage } from "../../../../types";
import { MarkdownLite } from "../../utils/markdownLite";
import { AiToolCallDisclosure } from "./AiToolCallDisclosure";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export const AiMessageBubble: React.FC<{ message: AiMessage; pending?: boolean }> = ({
  message,
  pending = false,
}) => {
  const isUser = message.role === "USER";

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
          isUser ? "border-blue-500/30 bg-blue-500/10 text-blue-400" : "border-slate-700 bg-slate-800 text-slate-300"
        }`}
        aria-hidden="true"
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
      </div>

      <div className={`min-w-0 max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          role="article"
          aria-label={isUser ? "Your message" : "Assistant response"}
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "rounded-tr-sm bg-blue-600 text-white"
              : "rounded-tl-sm border border-slate-800 bg-slate-900/60 text-slate-100"
          } ${pending ? "opacity-60" : ""}`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <MarkdownLite text={message.content} className="break-words" />
          )}
          {!isUser && <AiToolCallDisclosure toolCalls={message.toolCalls} />}
        </div>
        <span className="mt-1 px-1 text-[10px] text-slate-600">
          {pending ? "Sending…" : formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
};

export default AiMessageBubble;
