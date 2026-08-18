import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../services/api/endpoints";
import { useAuthStore } from "../../../store/useAuthStore";
import { useUIStore } from "../../../store/useUIStore";
import type {
  AiConversation,
  AiConversationDetail,
  AiMessage,
  AiMessageMode,
} from "../../../types";
import { presentAiError } from "../utils/aiErrorMessages";

const isAuth = () => useAuthStore.getState().isAuthenticated;

/**
 * Query-key factory, following the `<FEATURE>_QUERY_KEYS` convention
 * established in `src/features/goals/hooks/useGoalQueries.ts`.
 */
export const AI_CONVERSATION_QUERY_KEYS = {
  all: ["aiConversations"] as const,
  list: (params?: Record<string, unknown>) => ["aiConversations", "list", params] as const,
  detail: (id: string) => ["aiConversations", "detail", id] as const,
};

export function useAiConversations(params?: { cursor?: string; limit?: number }) {
  return useQuery({
    queryKey: AI_CONVERSATION_QUERY_KEYS.list(params),
    queryFn: async () => api.getAiConversations(params),
    enabled: isAuth(),
  });
}

export function useAiConversation(id: string | null) {
  return useQuery({
    queryKey: AI_CONVERSATION_QUERY_KEYS.detail(id ?? ""),
    queryFn: async (): Promise<AiConversationDetail> => api.getAiConversation(id as string),
    enabled: isAuth() && Boolean(id),
  });
}

/**
 * Conversations are created lazily, on the first message — not eagerly on
 * page load — per the backend team's own checklist (avoids empty
 * conversations piling up in the list view). Callers create one right
 * before posting the first question.
 */
export function useCreateAiConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title?: string) => api.createAiConversation(title),
    onSuccess: (conversation: AiConversation) => {
      queryClient.invalidateQueries({ queryKey: AI_CONVERSATION_QUERY_KEYS.all });
      queryClient.setQueryData(AI_CONVERSATION_QUERY_KEYS.detail(conversation.id), {
        ...conversation,
        messages: [],
      } satisfies AiConversationDetail);
    },
    onError: (err) => useUIStore.getState().showToast(presentAiError(err).message, "error"),
  });
}

/**
 * Posts one turn. The response is only the assistant's message — the
 * conversation query is the source of truth for the full (user + assistant)
 * history, so a successful post invalidates it rather than hand-assembling
 * the turn from a partial response. While the mutation is in flight, render
 * the optimistic user bubble from `mutation.variables` (React Query already
 * tracks this) instead of writing a synthetic message into the cache.
 */
export function usePostAiMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      mode,
      question,
    }: {
      conversationId: string;
      mode: AiMessageMode;
      question: string;
    }): Promise<AiMessage> => api.postAiMessage(conversationId, { mode, question }),
    onSuccess: (_assistantMessage, variables) => {
      queryClient.invalidateQueries({
        queryKey: AI_CONVERSATION_QUERY_KEYS.detail(variables.conversationId),
      });
      queryClient.invalidateQueries({ queryKey: AI_CONVERSATION_QUERY_KEYS.all });
    },
    // No toast here — the composer/message list renders a typed inline error
    // (rate-limited, unavailable, etc. via `presentAiError`) next to the
    // failed question so the user can retry in place.
  });
}
