import { useQuery, useMutation, useQueryClient, QueryClient } from "@tanstack/react-query";
import { api } from "../../../services/api/endpoints";
import { useAuthStore } from "../../../store/useAuthStore";
import { useUIStore } from "../../../store/useUIStore";
import { SmartActionItem, ActionCategoryCount, ActionPreferences } from "../../../types";

export function useSmartActions(params?: {
  category?: string;
  priority?: string;
  status?: string;
  search?: string;
}) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ["smartActions", params],
    queryFn: async (): Promise<SmartActionItem[]> => {
      try {
        if (params?.category === "TODAY") {
          const todayActions = await api.getTodayActions();
          if (Array.isArray(todayActions)) return todayActions;
        }

        const res = await api.getSmartActions({
          category: params?.category !== "ALL" && params?.category !== "TODAY" ? params?.category : undefined,
          priority: params?.priority !== "ALL" ? params?.priority : undefined,
          status: params?.status || "ACTIVE",
          search: params?.search,
        });

        if (res && Array.isArray(res.data)) {
          let list = res.data;

          if (params?.search) {
            const q = params.search.toLowerCase();
            list = list.filter(
              (a) =>
                a.title.toLowerCase().includes(q) ||
                a.description.toLowerCase().includes(q) ||
                a.explanation.toLowerCase().includes(q)
            );
          }

          return list;
        }
        return [];
      } catch {
        return [];
      }
    },
    enabled: isAuthenticated,
  });
}

export function useActionCategories() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ["actionCategories"],
    queryFn: async (): Promise<ActionCategoryCount[]> => {
      try {
        const res = await api.getActionCategories();
        if (Array.isArray(res)) {
          return res;
        }
        if (res && "data" in res && Array.isArray(res.data)) {
          return res.data;
        }
        return [];
      } catch {
        return [];
      }
    },
    enabled: isAuthenticated,
  });
}

export function useActionPreferences() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ["actionPreferences"],
    queryFn: () => api.getActionPreferences(),
    enabled: isAuthenticated,
  });
}

export function useUpdateActionPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ActionPreferences>) => api.updateActionPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actionPreferences"] });
      queryClient.invalidateQueries({ queryKey: ["smartActions"] });
      useUIStore.getState().showToast("Action preferences saved successfully", "success");
    },
    onError: (err: MutationError) => {
      useUIStore.getState().showToast(err?.message || "Failed to update action preferences", "error");
    },
  });
}

interface MutationError {
  message?: string;
  statusCode?: number;
  code?: string;
}

const handleMutationError = (err: MutationError, queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ["smartActions"] });
  const isConflict =
    err?.statusCode === 409 ||
    err?.code === "CONCURRENCY_CONFLICT" ||
    (typeof err?.message === "string" && err.message.toLowerCase().includes("conflict"));

  if (isConflict) {
    useUIStore
      .getState()
      .showToast("Concurrency Conflict: Action was modified elsewhere. Data refreshed.", "info");
  } else {
    useUIStore.getState().showToast(err?.message || "Action failed. Please try again.", "error");
  }
};

export function useDismissAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version = 1 }: { id: string; version?: number }) => api.dismissSmartAction(id, version),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ["smartActions"] });
      const previous = queryClient.getQueryData<SmartActionItem[]>(["smartActions"]);
      queryClient.setQueriesData<SmartActionItem[]>({ queryKey: ["smartActions"] }, (old) =>
        old ? old.filter((item) => item.id !== id) : []
      );
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smartActions"] });
      useUIStore.getState().showToast("Action dismissed", "info");
    },
    onError: (err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["smartActions"], context.previous);
      }
      handleMutationError(err, queryClient);
    },
  });
}

export function useCompleteAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version = 1 }: { id: string; version?: number }) => api.completeSmartAction(id, version),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ["smartActions"] });
      const previous = queryClient.getQueryData<SmartActionItem[]>(["smartActions"]);
      queryClient.setQueriesData<SmartActionItem[]>({ queryKey: ["smartActions"] }, (old) =>
        old ? old.filter((item) => item.id !== id) : []
      );
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smartActions"] });
      queryClient.invalidateQueries({ queryKey: ["financialHealth"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      useUIStore.getState().showToast("Action completed! Financial health updated.", "success");
    },
    onError: (err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["smartActions"], context.previous);
      }
      handleMutationError(err, queryClient);
    },
  });
}

export function useSnoozeAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      version = 1,
      snoozedUntil,
    }: {
      id: string;
      version?: number;
      snoozedUntil: string;
    }) => api.snoozeSmartAction(id, snoozedUntil, version),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ["smartActions"] });
      const previous = queryClient.getQueryData<SmartActionItem[]>(["smartActions"]);
      queryClient.setQueriesData<SmartActionItem[]>({ queryKey: ["smartActions"] }, (old) =>
        old ? old.filter((item) => item.id !== id) : []
      );
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smartActions"] });
      useUIStore.getState().showToast("Action snoozed", "info");
    },
    onError: (err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["smartActions"], context.previous);
      }
      handleMutationError(err, queryClient);
    },
  });
}

export function useRefreshActions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.refreshSmartActions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smartActions"] });
      queryClient.invalidateQueries({ queryKey: ["financialHealth"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      useUIStore.getState().showToast("Smart Action Center refreshed", "success");
    },
    onError: (err: MutationError) => {
      queryClient.invalidateQueries({ queryKey: ["smartActions"] });
      useUIStore.getState().showToast(err?.message || "Actions refreshed", "info");
    },
  });
}
