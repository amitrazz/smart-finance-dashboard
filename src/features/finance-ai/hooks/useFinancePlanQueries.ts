import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../services/api/endpoints";
import { useAuthStore } from "../../../store/useAuthStore";
import { useUIStore } from "../../../store/useUIStore";
import { GOAL_QUERY_KEYS } from "../../goals/hooks/useGoalQueries";
import { BUDGET_QUERY_KEYS } from "../../budgets/hooks/useBudgetQueries";
import type { FinancePlan, FinancePlanStatus, GenerateFinancePlanInput } from "../../../types";
import { presentAiError } from "../utils/aiErrorMessages";

const isAuth = () => useAuthStore.getState().isAuthenticated;

export const FINANCE_PLAN_QUERY_KEYS = {
  all: ["financePlans"] as const,
  list: (params?: Record<string, unknown>) => ["financePlans", "list", params] as const,
  detail: (id: string) => ["financePlans", "detail", id] as const,
  actions: (id: string) => ["financePlans", "actions", id] as const,
  progress: (id: string) => ["financePlans", "progress", id] as const,
};

/**
 * A plan's action types (`CREATE_GOAL`/`UPDATE_GOAL`/`CREATE_BUDGET`/
 * `UPDATE_BUDGET`/`CATEGORIZE_TRANSACTION` — docs/20-finance-plans.md
 * "Confirmed v1 scope") only ever touch Goals, Budgets, and Transactions.
 * Invalidating exactly these query-key prefixes (plus the cross-cutting
 * dashboard/net-worth/calendar keys every other Goal/Budget mutation in this
 * app already invalidates — see `useGoalQueries.ts`) keeps every screen that
 * could show a plan's effect in sync without guessing at every possible
 * downstream view.
 */
function invalidateExecutionEffects(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.all });
  queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.all });
  queryClient.invalidateQueries({ queryKey: ["transactions"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["netWorth"] });
  queryClient.invalidateQueries({ queryKey: ["calendar"] });
}

export function useFinancePlans(params?: {
  cursor?: string;
  limit?: number;
  status?: FinancePlanStatus;
}) {
  return useQuery({
    queryKey: FINANCE_PLAN_QUERY_KEYS.list(params),
    queryFn: async () => api.getFinancePlans(params),
    enabled: isAuth(),
  });
}

export function useFinancePlan(id: string | null) {
  return useQuery({
    queryKey: FINANCE_PLAN_QUERY_KEYS.detail(id ?? ""),
    queryFn: async (): Promise<FinancePlan> => api.getFinancePlan(id as string),
    enabled: isAuth() && Boolean(id),
  });
}

export function useFinancePlanProgress(id: string | null, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: FINANCE_PLAN_QUERY_KEYS.progress(id ?? ""),
    queryFn: async () => api.getFinancePlanProgress(id as string),
    enabled: isAuth() && Boolean(id) && (opts?.enabled ?? true),
  });
}

/** Generation only ever produces a proposal — no domain data changes yet. 5/min on the backend. */
export function useGenerateFinancePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateFinancePlanInput) => api.generateFinancePlan(data),
    onSuccess: (plan: FinancePlan) => {
      queryClient.invalidateQueries({ queryKey: FINANCE_PLAN_QUERY_KEYS.all });
      queryClient.setQueryData(FINANCE_PLAN_QUERY_KEYS.detail(plan.id), plan);
    },
    onError: (err) => useUIStore.getState().showToast(presentAiError(err).message, "error"),
  });
}

/**
 * The only call in this feature that can touch real Goal/Budget data.
 * The response is authoritative final state (synchronous execution, not an
 * ack) — callers must branch UI on the returned `status`
 * (`ACTIVE`/`EXECUTION_PARTIAL`/`FAILED`/`STALE`), never assume acceptance
 * implies success. A lost race (two accepts in flight) surfaces as a real
 * `409 CONCURRENCY_CONFLICT` — `presentAiError` maps it to "already handled"
 * copy rather than a generic failure, and the caller should re-fetch rather
 * than retry (this hook does not auto-retry on any outcome).
 */
export function useAcceptFinancePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.acceptFinancePlan(id),
    // Losing a concurrency race is not the same failure as the request never
    // reaching the server — the other request already executed (or is
    // executing) the real mutation, so this re-fetches the plan rather than
    // leaving the UI showing the pre-accept state.
    onSettled: (_data, error, id) => {
      if (error) queryClient.invalidateQueries({ queryKey: FINANCE_PLAN_QUERY_KEYS.detail(id) });
    },
    onSuccess: (plan: FinancePlan) => {
      queryClient.setQueryData(FINANCE_PLAN_QUERY_KEYS.detail(plan.id), plan);
      queryClient.invalidateQueries({ queryKey: FINANCE_PLAN_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: FINANCE_PLAN_QUERY_KEYS.progress(plan.id) });
      if (plan.status === "ACTIVE" || plan.status === "EXECUTION_PARTIAL") {
        invalidateExecutionEffects(queryClient);
      }
      const toneByStatus: Partial<Record<FinancePlan["status"], "success" | "error" | "info">> = {
        ACTIVE: "success",
        EXECUTION_PARTIAL: "error",
        FAILED: "error",
        STALE: "info",
      };
      const messageByStatus: Partial<Record<FinancePlan["status"], string>> = {
        ACTIVE: "Plan accepted — every action completed successfully.",
        EXECUTION_PARTIAL: "Plan partially completed — some actions failed. See the action list for details.",
        FAILED: "None of this plan's actions completed. Nothing further changed.",
        STALE: "Your data changed since this plan was generated, so nothing executed. Generate a new plan to try again.",
      };
      useUIStore
        .getState()
        .showToast(messageByStatus[plan.status] ?? "Plan updated.", toneByStatus[plan.status] ?? "info");
    },
    onError: (err) => {
      const presented = presentAiError(err);
      useUIStore.getState().showToast(presented.message, presented.kind === "concurrency-conflict" ? "info" : "error");
    },
  });
}

export function useDeclineFinancePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => api.declineFinancePlan(id, reason),
    onSuccess: (plan: FinancePlan) => {
      queryClient.setQueryData(FINANCE_PLAN_QUERY_KEYS.detail(plan.id), plan);
      queryClient.invalidateQueries({ queryKey: FINANCE_PLAN_QUERY_KEYS.all });
      useUIStore.getState().showToast("Plan declined — no changes were made.", "info");
    },
    onError: (err) => useUIStore.getState().showToast(presentAiError(err).message, "error"),
  });
}

export function useCancelFinancePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.cancelFinancePlan(id),
    onSuccess: (plan: FinancePlan) => {
      queryClient.setQueryData(FINANCE_PLAN_QUERY_KEYS.detail(plan.id), plan);
      queryClient.invalidateQueries({ queryKey: FINANCE_PLAN_QUERY_KEYS.all });
      useUIStore.getState().showToast("Plan cancelled.", "info");
    },
    onError: (err) => useUIStore.getState().showToast(presentAiError(err).message, "error"),
  });
}

/** Only legal from READY_FOR_REVIEW. Produces a new plan row (parentPlanId set); never mutates the one revised. 5/min on the backend. */
export function useReviseFinancePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: Partial<GenerateFinancePlanInput> }) =>
      api.reviseFinancePlan(id, data),
    onSuccess: (newPlan: FinancePlan, variables) => {
      queryClient.invalidateQueries({ queryKey: FINANCE_PLAN_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: FINANCE_PLAN_QUERY_KEYS.detail(variables.id) });
      queryClient.setQueryData(FINANCE_PLAN_QUERY_KEYS.detail(newPlan.id), newPlan);
      useUIStore.getState().showToast("New plan version generated.", "success");
    },
    onError: (err) => useUIStore.getState().showToast(presentAiError(err).message, "error"),
  });
}
