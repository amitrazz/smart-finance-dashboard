import React, { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import type { AiMessageMode } from "../../../types";
import {
  useAiConversation,
  useAiConversations,
  useCreateAiConversation,
  usePostAiMessage,
} from "../hooks/useFinanceAgentQueries";
import { ConversationList } from "../components/conversation/ConversationList";
import { AiMessageBubble } from "../components/conversation/AiMessageBubble";
import { AiComposer } from "../components/conversation/AiComposer";
import { AiEmptyState } from "../components/conversation/AiEmptyState";
import { AiErrorState } from "../components/conversation/AiErrorState";

/**
 * The Finance Agent's conversational surface. A conversation is created
 * lazily on the first message (backend team's own checklist — avoids empty
 * rows piling up in the list), and the conversation query is the sole source
 * of truth for message history: nothing here treats `localStorage` or a
 * client-side message array as authoritative, and every successful send
 * re-fetches the conversation rather than hand-assembling the turn.
 *
 * There is no streaming — the backend answers a whole turn synchronously
 * (docs/19-finance-agent.md's bounded tool loop resolves before responding)
 * — so this deliberately doesn't fake character-by-character reveal.
 */
export const AssistantPage: React.FC = () => {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [liveStatus, setLiveStatus] = useState("");

  const conversationsQuery = useAiConversations();
  const conversationQuery = useAiConversation(activeConversationId);
  const createConversation = useCreateAiConversation();
  const postMessage = usePostAiMessage();

  const conversations = conversationsQuery.data?.data ?? [];
  const messages = conversationQuery.data?.messages ?? [];

  useEffect(() => {
    const el = scrollRef.current;
    // jsdom (used in tests) doesn't implement `scrollTo` — guard rather than
    // assume a browser DOM.
    if (el && typeof el.scrollTo === "function") {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length, postMessage.isPending]);

  useEffect(() => {
    if (postMessage.isPending) setLiveStatus("Thinking…");
    else if (postMessage.isSuccess) setLiveStatus("New response received.");
  }, [postMessage.isPending, postMessage.isSuccess]);

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setSidebarOpen(false);
    postMessage.reset();
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setSidebarOpen(false);
    postMessage.reset();
  };

  const handleSend = async (mode: AiMessageMode, question: string) => {
    let conversationId = activeConversationId;
    if (!conversationId) {
      try {
        const created = await createConversation.mutateAsync(undefined);
        conversationId = created.id;
        setActiveConversationId(created.id);
      } catch {
        return;
      }
    }
    postMessage.mutate({ conversationId, mode, question });
  };

  const handleRetry = () => {
    if (postMessage.variables) postMessage.mutate(postMessage.variables);
  };

  const isConversationLoading = Boolean(activeConversationId) && conversationQuery.isLoading;
  const composerDisabled = postMessage.isPending || createConversation.isPending;

  return (
    <div className="flex h-[70vh] min-h-[520px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40">
      {/* Sidebar — always visible on desktop, a slide-over on mobile per the app's existing responsive convention. */}
      <div className="hidden w-64 shrink-0 border-r border-slate-800 md:block">
        <ConversationList
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={handleSelectConversation}
          onNew={handleNewConversation}
          isLoading={conversationsQuery.isLoading}
        />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="w-72 border-r border-slate-800 bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
              <span className="text-xs font-semibold text-slate-300">Conversations</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close conversation list"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ConversationList
              conversations={conversations}
              activeId={activeConversationId}
              onSelect={handleSelectConversation}
              onNew={handleNewConversation}
              isLoading={conversationsQuery.isLoading}
            />
          </div>
          <button
            type="button"
            aria-label="Close conversation list"
            className="flex-1 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-slate-800 px-3 py-2 md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open conversation list"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="truncate text-xs font-medium text-slate-400">
            {conversationQuery.data?.title || "New conversation"}
          </span>
        </div>

        <div ref={scrollRef} className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
          <span className="sr-only" role="status" aria-live="polite">
            {liveStatus}
          </span>

          {isConversationLoading ? (
            <div className="flex-1 space-y-3 animate-pulse" aria-hidden="true">
              <div className="h-14 w-2/3 rounded-2xl bg-slate-900/60" />
              <div className="ml-auto h-10 w-1/2 rounded-2xl bg-slate-900/60" />
              <div className="h-16 w-3/4 rounded-2xl bg-slate-900/60" />
            </div>
          ) : conversationQuery.isError ? (
            <div className="flex flex-1 items-center justify-center">
              <AiErrorState error={conversationQuery.error} onRetry={() => conversationQuery.refetch()} />
            </div>
          ) : messages.length === 0 && !postMessage.isPending ? (
            <AiEmptyState onSelectSuggestion={handleSend} />
          ) : (
            <div className="flex-1 space-y-4">
              {messages.map((message) => (
                <AiMessageBubble key={message.id} message={message} />
              ))}

              {postMessage.isPending && postMessage.variables && (
                <AiMessageBubble
                  pending
                  message={{
                    id: "pending",
                    role: "USER",
                    content: postMessage.variables.question,
                    mode: postMessage.variables.mode,
                    createdAt: new Date().toISOString(),
                    toolCalls: [],
                  }}
                />
              )}
            </div>
          )}

          {postMessage.isError && (
            <div className="mt-3">
              <AiErrorState error={postMessage.error} onRetry={handleRetry} />
            </div>
          )}
        </div>

        <div className="border-t border-slate-800 p-3">
          <AiComposer disabled={composerDisabled} onSend={handleSend} />
        </div>
      </div>
    </div>
  );
};

export default AssistantPage;
