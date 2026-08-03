import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../services/api/endpoints";
import { useAuthStore } from "../../../store/useAuthStore";
import { useUIStore } from "../../../store/useUIStore";
import {
  Budget,
  BudgetDashboardData,
  BudgetCategoryLine,
  BudgetAnalytics,
  BudgetAlert,
  BudgetTemplate,
  BudgetPeriod,
  BudgetStatus,
  BudgetHealthGrade,
} from "../../../types";

const isAuth = () => useAuthStore.getState().isAuthenticated;

const getErrorMessage = (err: unknown): string => {
  if (err !== null && typeof err === "object") {
    if ("userMessage" in err) return String((err as { userMessage: unknown }).userMessage);
    if ("message" in err) return String((err as { message: unknown }).message);
    if ("error" in err) return String((err as { error: unknown }).error);
  }
  return "An unexpected error occurred. Please try again.";
};

const unwrapList = <T>(res: unknown): T[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res as T[];
  if (typeof res === "object" && res !== null && "data" in res && Array.isArray((res as { data: unknown }).data)) {
    return (res as { data: T[] }).data;
  }
  return [];
};

// The create/update budget endpoint expects `totalBudget` as a plain decimal
// string (not `totalLimit: Money`) and `periodType` (not `period`) —
// translate at the API boundary the same way useGoalQueries.ts adapts goal DTOs.
function toBudgetPayload(data: Partial<Budget>): Record<string, unknown> {
  const { totalLimit, period, ...rest } = data;
  const payload: Record<string, unknown> = { ...rest };
  if (totalLimit) {
    payload.totalBudget = totalLimit.amount;
  }
  if (period) {
    payload.periodType = period;
  }
  return payload;
}

// --- Response mapping ---
// The real backend budget resource is much flatter than this feature's
// frontend `Budget` type (e.g. `periodType` vs `period`, `totalBudget` as a
// plain decimal string vs `totalLimit: Money`), and carries none of the
// computed spend/health/forecast figures at all — those only exist on the
// separate GET /finance/budgets/:id/summary endpoint. These mappers translate
// the wire shape once, here, the same way useGoalQueries.ts adapts goal DTOs.
interface RawBudget {
  id: string;
  name: string;
  description?: string | null;
  budgetType?: string;
  currency: string;
  status?: string;
  periodType?: string;
  startDate: string;
  endDate?: string | null;
  totalBudget: string | number;
  carryForwardEnabled?: boolean;
  autoAdjustEnabled?: boolean;
  rolloverPolicy?: string;
  notificationEnabled?: boolean;
  notes?: string | null;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface RawBudgetSummary {
  budgetId?: string;
  allocated?: string | number;
  spent?: string | number;
  remaining?: string | number;
  available?: string | number;
  dailyBudget?: string | number;
  forecastExpectedMonthEndSpend?: string | number;
  utilization?: string | number;
  daysRemaining?: number;
  healthScore?: number;
  riskLevel?: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | string;
}

const RISK_TO_GRADE: Record<string, BudgetHealthGrade> = {
  LOW: "EXCELLENT",
  MODERATE: "GOOD",
  HIGH: "WARNING",
  CRITICAL: "CRITICAL",
};

const toMoney = (amount: string | number | null | undefined, currency = "INR"): { amount: string; currency: string } => ({
  amount: amount != null ? String(amount) : "0",
  currency,
});

function mapBudget(raw: RawBudget, summary?: RawBudgetSummary): Budget {
  const currency = raw.currency || "INR";
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? undefined,
    budgetType: raw.budgetType ?? "CATEGORY_BASED",
    status: (raw.status as BudgetStatus) || "ACTIVE",
    period: (raw.periodType as BudgetPeriod) || "MONTHLY",
    currency,
    startDate: raw.startDate,
    endDate: raw.endDate ?? undefined,
    totalLimit: toMoney(raw.totalBudget, currency),
    totalSpent: summary ? toMoney(summary.spent, currency) : undefined,
    remainingAmount: summary ? toMoney(summary.remaining, currency) : undefined,
    availableAmount: summary ? toMoney(summary.available, currency) : undefined,
    utilizationPercent: summary?.utilization !== undefined ? parseFloat(String(summary.utilization)) || 0 : undefined,
    safeDailySpend: summary ? toMoney(summary.dailyBudget, currency) : undefined,
    forecastMonthEndSpend: summary ? toMoney(summary.forecastExpectedMonthEndSpend, currency) : undefined,
    budgetHealthScore: summary?.healthScore,
    budgetHealthGrade: summary?.riskLevel ? RISK_TO_GRADE[summary.riskLevel] : undefined,
    daysRemaining: summary?.daysRemaining,
    carryForwardEnabled: raw.carryForwardEnabled ?? false,
    autoAdjustEnabled: raw.autoAdjustEnabled ?? false,
    rolloverPolicy: raw.rolloverPolicy ?? "NONE",
    notificationEnabled: raw.notificationEnabled ?? true,
    notes: raw.notes ?? undefined,
    version: raw.version ?? 1,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export const BUDGET_QUERY_KEYS = {
  all: ["budgets"] as const,
  list: (params?: Record<string, unknown>) => ["budgets", "list", params] as const,
  dashboard: ["budgets", "dashboard"] as const,
  detail: (id: string) => ["budgets", "detail", id] as const,
  categories: (budgetId: string) => ["budgets", "categories", budgetId] as const,
  analytics: (budgetId: string) => ["budgets", "analytics", budgetId] as const,
  history: (budgetId: string) => ["budgets", "history", budgetId] as const,
  templates: ["budgets", "templates"] as const,
  alerts: ["budgets", "alerts"] as const,
};

// Dashboard Query — the real endpoint returns a flat aggregate across all of
// the caller's budgets, each embedded budget in its raw wire shape.
interface RawBudgetDashboard {
  totalBudget: string;
  totalSpent: string;
  remainingBudget: string;
  availableBudget: string;
  overallUtilization: string;
  activeBudgets: RawBudget[];
  exceededBudgets: RawBudget[];
  nearLimitBudgets: RawBudget[];
  topSpendingCategories: Array<{ categoryId: string; spentAmount: string }>;
  budgetHealthScore: number;
}

export function useBudgetDashboard() {
  return useQuery({
    queryKey: BUDGET_QUERY_KEYS.dashboard,
    queryFn: async (): Promise<BudgetDashboardData> => {
      const raw = (await api.getBudgetDashboard()) as unknown as RawBudgetDashboard;
      // The embedded budgets carry no spend/utilization/health figures either
      // — fetch each one's summary and merge it in, same as useBudgets().
      const byId = new Map<string, RawBudget>();
      for (const b of [...raw.activeBudgets, ...raw.exceededBudgets, ...raw.nearLimitBudgets]) {
        byId.set(b.id, b);
      }
      const ids = [...byId.keys()];
      const summaries = await Promise.all(
        ids.map((id) =>
          api
            .getBudgetSummary(id)
            .then((s) => s as unknown as RawBudgetSummary)
            .catch(() => undefined)
        )
      );
      const summaryById = new Map(ids.map((id, i) => [id, summaries[i]]));
      const mapWithSummary = (b: RawBudget) => mapBudget(b, summaryById.get(b.id));
      return {
        ...raw,
        activeBudgets: raw.activeBudgets.map(mapWithSummary),
        exceededBudgets: raw.exceededBudgets.map(mapWithSummary),
        nearLimitBudgets: raw.nearLimitBudgets.map(mapWithSummary),
      };
    },
    enabled: isAuth(),
  });
}

// Budgets List & Detail
// The list endpoint returns bare budgets with no spend/utilization/health
// figures — those only exist per-budget via GET /:id/summary, so each
// budget's summary is fetched alongside the list and merged in, the same
// way useBudget(id) does for a single budget.
export function useBudgets(params?: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: BUDGET_QUERY_KEYS.list(params),
    queryFn: async (): Promise<Budget[]> => {
      const res = await api.getBudgets(params);
      const rawBudgets = unwrapList<RawBudget>(res);
      const summaries = await Promise.all(
        rawBudgets.map((raw) =>
          api
            .getBudgetSummary(raw.id)
            .then((s) => s as unknown as RawBudgetSummary)
            .catch(() => undefined)
        )
      );
      return rawBudgets.map((raw, i) => mapBudget(raw, summaries[i]));
    },
    enabled: isAuth(),
  });
}

export function useBudget(id: string) {
  return useQuery({
    queryKey: BUDGET_QUERY_KEYS.detail(id),
    queryFn: async (): Promise<Budget> => {
      const [raw, summary] = await Promise.all([
        api.getBudget(id) as unknown as Promise<RawBudget>,
        api
          .getBudgetSummary(id)
          .then((s) => s as unknown as RawBudgetSummary)
          .catch(() => undefined),
      ]);
      return mapBudget(raw, summary);
    },
    enabled: isAuth() && Boolean(id),
  });
}

// Mutations
export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Budget>) => api.createBudget(toBudgetPayload(data) as Partial<Budget>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      useUIStore.getState().showToast("Budget plan created successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, version = 1 }: { id: string; data: Partial<Budget>; version?: number }) =>
      api.updateBudget(id, toBudgetPayload(data) as Partial<Budget>, version),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      useUIStore.getState().showToast("Budget updated successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version = 1 }: { id: string; version?: number }) => api.deleteBudget(id, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      useUIStore.getState().showToast("Budget deleted", "info");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Category Lines & Allocation
interface RawBudgetCategoryLine {
  id?: string;
  categoryId: string;
  allocatedAmount: string | number;
  spentAmount?: string | number;
  remainingAmount?: string | number;
  utilizationPercentage?: string | number;
  warningThreshold?: string | number;
  criticalThreshold?: string | number;
  isNearLimit?: boolean;
  isOverLimit?: boolean;
}

function mapBudgetCategoryLine(
  raw: RawBudgetCategoryLine,
  currency: string,
  categoryLookup: Map<string, { name: string; icon?: string }>
): BudgetCategoryLine {
  const utilizationPercent = raw.utilizationPercentage !== undefined ? parseFloat(String(raw.utilizationPercentage)) || 0 : 0;
  const healthStatus: BudgetCategoryLine["healthStatus"] = raw.isOverLimit ? "EXCEEDED" : raw.isNearLimit ? "NEAR_LIMIT" : "HEALTHY";
  const category = categoryLookup.get(raw.categoryId);

  return {
    id: raw.id,
    categoryId: raw.categoryId,
    categoryName: category?.name ?? "Category",
    categoryIcon: category?.icon,
    allocatedAmount: toMoney(raw.allocatedAmount, currency),
    spentAmount: toMoney(raw.spentAmount, currency),
    remainingAmount: toMoney(raw.remainingAmount, currency),
    utilizationPercent,
    warningThreshold: raw.warningThreshold !== undefined ? parseFloat(String(raw.warningThreshold)) : undefined,
    criticalThreshold: raw.criticalThreshold !== undefined ? parseFloat(String(raw.criticalThreshold)) : undefined,
    healthStatus,
    healthGrade: healthStatus === "EXCEEDED" ? "CRITICAL" : healthStatus === "NEAR_LIMIT" ? "WARNING" : "EXCELLENT",
  };
}

// The categories endpoint doesn't return category name/icon — join against
// the master category list (id, name, icon) to enrich the display fields.
export function useBudgetCategories(budgetId: string) {
  return useQuery({
    queryKey: BUDGET_QUERY_KEYS.categories(budgetId),
    queryFn: async (): Promise<BudgetCategoryLine[]> => {
      const [res, categoriesRes, budget] = await Promise.all([
        api.getBudgetCategories(budgetId),
        api.getCategories(),
        api.getBudget(budgetId) as unknown as Promise<RawBudget>,
      ]);
      const rawLines = unwrapList<RawBudgetCategoryLine>(res);
      const categoryList = unwrapList<{ id: string; name: string; icon?: string }>(categoriesRes);
      const categoryLookup = new Map(categoryList.map((c) => [c.id, { name: c.name, icon: c.icon }]));
      const currency = budget?.currency || "INR";
      return rawLines.map((raw) => mapBudgetCategoryLine(raw, currency, categoryLookup));
    },
    enabled: isAuth() && Boolean(budgetId),
  });
}

export function useUpdateCategoryAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ budgetId, categoryId, limitAmount }: { budgetId: string; categoryId: string; limitAmount: string }) =>
      api.updateCategoryAllocation(budgetId, categoryId, { limitAmount }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.detail(variables.budgetId) });
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.categories(variables.budgetId) });
      useUIStore.getState().showToast("Category allocation updated", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Analytics & History — per-budget only, no cross-budget aggregate exists.
interface RawBudgetAnalytics {
  budgetId: string;
  dailySpend: string;
  weeklySpend: string;
  monthlySpend: string;
  rollingAverageDailySpend: string;
  categoryBreakdown: Array<{ categoryId: string; allocatedAmount: string; spentAmount: string; utilizationPercentage: string }>;
  largestExpenses: Array<{ transactionId: string; categoryId: string | null; amount: string; description: string; transactionDate: string }>;
  trend: BudgetAnalytics["trend"];
  variance: string;
  forecastExpectedMonthEndSpend: string;
  forecastProjectedOverspend: string;
  forecastConfidence: string;
}

function mapBudgetAnalytics(raw: RawBudgetAnalytics, currency: string, categoryLookup: Map<string, string>): BudgetAnalytics {
  return {
    budgetId: raw.budgetId,
    dailySpend: toMoney(raw.dailySpend, currency),
    weeklySpend: toMoney(raw.weeklySpend, currency),
    monthlySpend: toMoney(raw.monthlySpend, currency),
    rollingAverageDailySpend: toMoney(raw.rollingAverageDailySpend, currency),
    categoryBreakdown: raw.categoryBreakdown.map((c) => ({
      categoryId: c.categoryId,
      categoryName: categoryLookup.get(c.categoryId),
      allocatedAmount: toMoney(c.allocatedAmount, currency),
      spentAmount: toMoney(c.spentAmount, currency),
      utilizationPercent: parseFloat(c.utilizationPercentage) || 0,
    })),
    largestExpenses: raw.largestExpenses.map((e) => ({
      transactionId: e.transactionId,
      categoryId: e.categoryId,
      categoryName: e.categoryId ? categoryLookup.get(e.categoryId) : undefined,
      amount: toMoney(e.amount, currency),
      description: e.description,
      date: e.transactionDate,
    })),
    trend: raw.trend,
    variance: toMoney(raw.variance, currency),
    forecastExpectedMonthEndSpend: toMoney(raw.forecastExpectedMonthEndSpend, currency),
    forecastProjectedOverspend: toMoney(raw.forecastProjectedOverspend, currency),
    forecastConfidence: parseFloat(raw.forecastConfidence) || 0,
  };
}

export function useBudgetAnalytics(budgetId: string, currency: string = "INR") {
  return useQuery({
    queryKey: BUDGET_QUERY_KEYS.analytics(budgetId),
    queryFn: async (): Promise<BudgetAnalytics> => {
      const [res, categoriesRes] = await Promise.all([api.getBudgetAnalytics(budgetId), api.getCategories()]);
      const categoryList = unwrapList<{ id: string; name: string }>(categoriesRes);
      const categoryLookup = new Map(categoryList.map((c) => [c.id, c.name]));
      return mapBudgetAnalytics(res as unknown as RawBudgetAnalytics, currency, categoryLookup);
    },
    enabled: isAuth() && Boolean(budgetId),
  });
}

export function useBudgetHistory(budgetId: string, params?: { cursor?: string; limit?: number }) {
  return useQuery({
    queryKey: BUDGET_QUERY_KEYS.history(budgetId),
    queryFn: async () => unwrapList<unknown>(await api.getBudgetHistory(budgetId, params)),
    enabled: isAuth() && Boolean(budgetId),
  });
}

export function useUpdateBudgetAlertSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notificationEnabled, version }: { id: string; notificationEnabled: boolean; version: number }) =>
      api.updateBudgetAlertSettings(id, notificationEnabled, version),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.detail(variables.id) });
      useUIStore.getState().showToast("Alert settings updated", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useCarryForwardBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.carryForwardBudget(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.detail(id) });
      useUIStore.getState().showToast("Balance carried forward", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useDuplicateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { source: "PREVIOUS_MONTH" | "PREVIOUS_YEAR" | "TEMPLATE"; name: string; startDate: string; templateId?: string } }) =>
      api.duplicateBudget(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.all });
      useUIStore.getState().showToast("Budget duplicated", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useResetBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.resetBudget(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.detail(id) });
      useUIStore.getState().showToast("Budget period reset", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useReplaceBudgetCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ budgetId, allocations }: { budgetId: string; allocations: Array<{ categoryId: string; allocatedAmount: string; warningThreshold?: string; criticalThreshold?: string }> }) =>
      api.replaceBudgetCategories(budgetId, allocations),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.detail(variables.budgetId) });
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.categories(variables.budgetId) });
      useUIStore.getState().showToast("Category allocations updated", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Templates
interface RawBudgetTemplateAllocation {
  categoryId: string;
  percentage: string | null;
  fixedAmount: string | null;
}

interface RawBudgetTemplate {
  id: string;
  name: string;
  description: string | null;
  templateType: string;
  isSystem: boolean;
  allocations: RawBudgetTemplateAllocation[];
  version: number;
}

function mapBudgetTemplate(raw: RawBudgetTemplate, categoryLookup: Map<string, string>): BudgetTemplate {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? undefined,
    templateType: raw.templateType,
    isSystem: raw.isSystem,
    allocations: raw.allocations.map((a) => ({
      categoryId: a.categoryId,
      categoryName: categoryLookup.get(a.categoryId),
      percentage: a.percentage != null ? parseFloat(a.percentage) : undefined,
      fixedAmount: a.fixedAmount != null ? toMoney(a.fixedAmount) : undefined,
    })),
    version: raw.version,
  };
}

export function useBudgetTemplates() {
  return useQuery({
    queryKey: BUDGET_QUERY_KEYS.templates,
    queryFn: async (): Promise<BudgetTemplate[]> => {
      const [res, categoriesRes] = await Promise.all([api.getBudgetTemplates(), api.getCategories()]);
      const categoryList = unwrapList<{ id: string; name: string }>(categoriesRes);
      const categoryLookup = new Map(categoryList.map((c) => [c.id, c.name]));
      return unwrapList<RawBudgetTemplate>(res).map((raw) => mapBudgetTemplate(raw, categoryLookup));
    },
    enabled: isAuth(),
  });
}

export function useCreateBudgetTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; templateType: string; allocations: Array<{ categoryId: string; percentage?: string; fixedAmount?: string }> }) =>
      api.createBudgetTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.templates });
      useUIStore.getState().showToast("Budget template created", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useUpdateBudgetTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, version }: { id: string; data: Partial<{ name: string; description: string; templateType: string; allocations: Array<{ categoryId: string; percentage?: string; fixedAmount?: string }> }>; version: number }) =>
      api.updateBudgetTemplate(id, data, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.templates });
      useUIStore.getState().showToast("Budget template updated", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useDeleteBudgetTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) => api.deleteBudgetTemplate(id, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.templates });
      useUIStore.getState().showToast("Template deleted", "info");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Applies a template's allocations onto an existing budget's current period
// — it does not create a new budget, and returns allocation lines, not a Budget.
export function useApplyBudgetTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, budgetId }: { templateId: string; budgetId: string }) =>
      api.applyBudgetTemplate(templateId, budgetId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.detail(variables.budgetId) });
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.categories(variables.budgetId) });
      useUIStore.getState().showToast("Budget template applied", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Alerts
interface RawBudgetAlert {
  id: string;
  budgetId: string;
  budgetPeriodId: string;
  categoryId: string | null;
  type: string;
  severity: string;
  message: string;
  isRead: boolean;
  isDismissed: boolean;
  triggeredAt: string;
  version: number;
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  NEAR_LIMIT: "Near Limit",
  EXCEEDED: "Budget Exceeded",
  NO_SPENDING: "No Spending Detected",
  DAILY_SPENDING_SPIKE: "Daily Spending Spike",
  WEEKLY_OVERSPEND: "Weekly Overspend",
  CATEGORY_OVERSPEND: "Category Overspend",
  BUDGET_ENDING_SOON: "Budget Ending Soon",
};

function mapBudgetAlert(raw: RawBudgetAlert, categoryLookup: Map<string, string>): BudgetAlert {
  return {
    id: raw.id,
    budgetId: raw.budgetId,
    budgetPeriodId: raw.budgetPeriodId,
    categoryId: raw.categoryId ?? undefined,
    categoryName: raw.categoryId ? categoryLookup.get(raw.categoryId) : undefined,
    type: raw.type,
    title: ALERT_TYPE_LABELS[raw.type] ?? raw.type,
    severity: (raw.severity as BudgetAlert["severity"]) ?? "INFO",
    message: raw.message,
    isRead: raw.isRead,
    isDismissed: raw.isDismissed,
    triggeredAt: raw.triggeredAt,
    version: raw.version,
  };
}

export function useBudgetAlerts(params?: { budgetId?: string; isRead?: boolean; isDismissed?: boolean; type?: string; cursor?: string; limit?: number }) {
  return useQuery({
    queryKey: [...BUDGET_QUERY_KEYS.alerts, params],
    queryFn: async (): Promise<BudgetAlert[]> => {
      const [res, categoriesRes] = await Promise.all([api.getBudgetAlerts(params), api.getCategories()]);
      const categoryList = unwrapList<{ id: string; name: string }>(categoriesRes);
      const categoryLookup = new Map(categoryList.map((c) => [c.id, c.name]));
      return unwrapList<RawBudgetAlert>(res).map((raw) => mapBudgetAlert(raw, categoryLookup));
    },
    enabled: isAuth(),
  });
}

export function useDismissBudgetAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ alertId, version }: { alertId: string; version: number }) => api.dismissBudgetAlert(alertId, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.alerts });
      useUIStore.getState().showToast("Alert dismissed", "info");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useMarkBudgetAlertRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ alertId, version }: { alertId: string; version: number }) => api.markBudgetAlertRead(alertId, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.alerts });
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}
