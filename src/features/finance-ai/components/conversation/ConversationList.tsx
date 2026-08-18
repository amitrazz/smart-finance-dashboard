import React from "react";
import { MessageSquarePlus } from "lucide-react";
import type { AiConversation } from "../../../../types";
import { formatRelativeTime } from "../../../../utils/formatters";

export const ConversationList: React.FC<{
  conversations: AiConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  isLoading?: boolean;
}> = ({ conversations, activeId, onSelect, onNew, isLoading = false }) => {
  return (
    <div className="flex h-full flex-col">
      <div className="p-2">
        <button
          type="button"
          onClick={onNew}
          className="flex w-full items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden="true" />
          New conversation
        </button>
      </div>

      <nav aria-label="Conversations" className="flex-1 overflow-y-auto px-2 pb-2">
        {isLoading ? (
          <ul className="space-y-1.5 animate-pulse" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-11 rounded-lg bg-slate-900/60" />
            ))}
          </ul>
        ) : conversations.length === 0 ? (
          <p className="px-2 py-4 text-center text-[11px] text-slate-600">
            No conversations yet — ask a question to start one.
          </p>
        ) : (
          <ul className="space-y-1">
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  aria-current={c.id === activeId ? "true" : undefined}
                  className={`w-full truncate rounded-lg px-2.5 py-2 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
                    c.id === activeId
                      ? "border border-blue-500/30 bg-blue-500/10 text-blue-200"
                      : "border border-transparent text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
                  }`}
                >
                  <span className="block truncate font-medium">{c.title || "Untitled conversation"}</span>
                  <span className="block text-[10px] text-slate-600">{formatRelativeTime(c.updatedAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </div>
  );
};

export default ConversationList;
