import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../services/api/endpoints";
import { useAuthStore } from "../../../store/useAuthStore";
import { useUIStore } from "../../../store/useUIStore";
import {
  Goal,
  GoalDashboardData,
  GoalContribution,
  GoalMilestone,
  GoalForecast,
  GoalForecastSummary,
  GoalAnalytics,
  GoalProjection,
  GoalDocument,
  GoalBeneficiary,
  GoalTemplate,
  CreateGoalInput,
  UpdateGoalInput,
  CreateContributionInput,
  CreateMilestoneInput,
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

// --- Response mapping ---
// The goals API returns DTOs shaped differently than this feature's frontend
// types (e.g. milestone `title` vs `name`, contribution
// `contributedAt`/`note`/`source` vs `date`/`notes`/`type`, forecast/analytics
// amounts as plain decimal strings, and both `expectedReturnRate` and
// `inflationRate` stored as 0-1 decimals instead of whole percents). These
// mappers translate the wire shape once, here, so every component can keep
// using the app-facing field names.
const toMoney = (amount: string | number | null | undefined, currency = "INR"): { amount: string; currency: string } => ({
  amount: amount != null ? String(amount) : "0",
  currency,
});

const toPercent = (ratio: string | number | null | undefined): number => {
  const n = typeof ratio === "number" ? ratio : parseFloat(String(ratio ?? ""));
  return !isNaN(n) ? n * 100 : 0;
};

interface RawGoal extends Omit<Goal, "expectedReturnRate" | "inflationRate" | "currentAmount" | "targetAmount"> {
  expectedReturnRate: string | number | null;
  inflationRate: string | number | null;
  currentAmount?: { amount: string; currency: string };
  targetAmount: { amount: string; currency: string };
}

function mapGoal(raw: RawGoal): Goal {
  return {
    ...raw,
    expectedReturnRate: toPercent(raw.expectedReturnRate),
    inflationRate: toPercent(raw.inflationRate),
  } as Goal;
}

interface RawGoalMilestone {
  id: string;
  goalId: string;
  title: string;
  thresholdPercent?: string | null;
  targetAmount?: string | null;
  targetDate?: string | null;
  achievedDate?: string | null;
  status: string;
  isStandard?: boolean;
  version: number;
  createdAt?: string;
}

function mapGoalMilestone(raw: RawGoalMilestone): GoalMilestone {
  return {
    id: raw.id,
    goalId: raw.goalId,
    name: raw.title,
    thresholdPercent: raw.thresholdPercent ?? null,
    targetAmount: raw.targetAmount ? toMoney(raw.targetAmount) : null,
    targetDate: raw.targetDate ?? null,
    status: raw.status === "ACHIEVED" ? "ACHIEVED" : "PENDING",
    isStandard: raw.isStandard,
    achievedDate: raw.achievedDate ?? null,
    version: raw.version,
    createdAt: raw.createdAt,
  };
}

interface RawGoalContribution {
  id: string;
  goalId: string;
  amount: string;
  contributedAt: string;
  note?: string | null;
  source: string;
  transactionId?: string | null;
  version: number;
  createdAt?: string;
}

function mapGoalContribution(raw: RawGoalContribution): GoalContribution {
  return {
    id: raw.id,
    goalId: raw.goalId,
    date: raw.contributedAt,
    amount: toMoney(raw.amount),
    type: raw.source,
    notes: raw.note ?? undefined,
    reference: raw.transactionId ?? undefined,
    version: raw.version,
    createdAt: raw.createdAt,
  };
}

interface RawGoalForecast {
  goalId: string;
  name: string;
  monthlyContributionRate: string;
  remainingAmount: string;
  projectedCompletionDate: string | null;
  monthsRemaining: number | null;
  targetDate: string | null;
  isBehindSchedule: boolean;
  projectedFutureValue: string;
  requiredMonthlyContribution: string | null;
  inflationAdjustedTarget: string | null;
}

function mapGoalForecast(raw: RawGoalForecast): GoalForecast {
  return {
    goalId: raw.goalId,
    goalName: raw.name,
    expectedCompletionDate: raw.projectedCompletionDate,
    monthlyRequiredContribution: raw.requiredMonthlyContribution ? toMoney(raw.requiredMonthlyContribution) : null,
    fundingGap: toMoney(raw.remainingAmount),
    monthlyContributionRate: toMoney(raw.monthlyContributionRate),
    monthsRemaining: raw.monthsRemaining,
    targetDate: raw.targetDate,
    isBehindSchedule: raw.isBehindSchedule,
    projectedFutureValue: toMoney(raw.projectedFutureValue),
    inflationAdjustedTarget: raw.inflationAdjustedTarget ? toMoney(raw.inflationAdjustedTarget) : null,
  };
}

interface RawGoalForecastSummary {
  monthlyContributionRate: string;
  remainingAmount: string;
  projectedCompletionDate: string | null;
  monthsRemaining: number | null;
  isBehindSchedule: boolean;
}

function mapGoalForecastSummary(raw: RawGoalForecastSummary): GoalForecastSummary {
  return {
    monthlyContributionRate: toMoney(raw.monthlyContributionRate),
    fundingGap: toMoney(raw.remainingAmount),
    expectedCompletionDate: raw.projectedCompletionDate,
    monthsRemaining: raw.monthsRemaining,
    isBehindSchedule: raw.isBehindSchedule,
  };
}

interface RawGoalProjection {
  goalId?: string;
  expectedProgressRatio: string | number;
  actualProgressRatio: string | number;
  delayMonths: number | null;
  contributionTrend: "INCREASING" | "STABLE" | "DECREASING";
  riskLevel: GoalProjection["riskLevel"];
}

function mapGoalProjection(raw: RawGoalProjection): GoalProjection {
  return {
    goalId: raw.goalId,
    expectedProgressPercent: toPercent(raw.expectedProgressRatio),
    actualProgressPercent: toPercent(raw.actualProgressRatio),
    delayMonths: raw.delayMonths,
    contributionTrend: raw.contributionTrend,
    riskLevel: raw.riskLevel,
  };
}

interface RawGoalAnalytics {
  goalId: string;
  corpus: { corpusValue: string; contributionValue: string; investmentValue: string };
  forecast: RawGoalForecastSummary;
  projection: RawGoalProjection;
  health: { score: number; band: GoalAnalytics["health"]["band"]; components: { contributionConsistency: number; progressAlignment: number; fundingGap: number } };
  contributionTrend: Array<{ month: string; total: string }>;
  corpusGrowth: Array<{ date: string; corpusValue: string }>;
  milestoneProgress: { achieved: number; total: number };
  investmentAllocation: { linkedHoldingCount: number; investmentValue: string };
}

function mapGoalAnalytics(raw: RawGoalAnalytics): GoalAnalytics {
  return {
    goalId: raw.goalId,
    corpus: {
      corpusValue: toMoney(raw.corpus.corpusValue),
      contributionValue: toMoney(raw.corpus.contributionValue),
      investmentValue: toMoney(raw.corpus.investmentValue),
    },
    forecast: mapGoalForecastSummary(raw.forecast),
    projection: mapGoalProjection(raw.projection),
    health: {
      score: raw.health.score,
      band: raw.health.band,
      contributionConsistency: raw.health.components.contributionConsistency,
      progressAlignment: raw.health.components.progressAlignment,
      fundingGap: raw.health.components.fundingGap,
    },
    contributionTrend: raw.contributionTrend.map((p) => ({ month: p.month, amount: toMoney(p.total) })),
    corpusGrowth: raw.corpusGrowth.map((p) => ({ date: p.date, corpusValue: toMoney(p.corpusValue) })),
    milestoneProgress: raw.milestoneProgress,
    investmentAllocation: {
      linkedHoldingCount: raw.investmentAllocation.linkedHoldingCount,
      investmentValue: toMoney(raw.investmentAllocation.investmentValue),
    },
  };
}

interface RawGoalTemplate {
  id: string;
  name: string;
  goalType: string;
  description: string | null;
  suggestedTargetAmount: string | null;
  suggestedDurationMonths: number | null;
  suggestedMonthlyContribution: string | null;
  icon: string | null;
  color: string | null;
  isPlatformCurated: boolean;
}

function mapGoalTemplate(raw: RawGoalTemplate): GoalTemplate {
  return {
    id: raw.id,
    name: raw.name,
    goalType: raw.goalType as GoalTemplate["goalType"],
    description: raw.description ?? undefined,
    suggestedTargetAmount: raw.suggestedTargetAmount ? toMoney(raw.suggestedTargetAmount) : undefined,
    suggestedDurationMonths: raw.suggestedDurationMonths ?? undefined,
    suggestedMonthlyContribution: raw.suggestedMonthlyContribution ? toMoney(raw.suggestedMonthlyContribution) : undefined,
    icon: raw.icon ?? undefined,
    color: raw.color ?? undefined,
    isPlatformCurated: raw.isPlatformCurated,
  };
}

interface RawGoalBeneficiary {
  id: string;
  goalId: string;
  name: string;
  relationship: string;
  allocationPercentage: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  version: number;
}

function mapGoalBeneficiary(raw: RawGoalBeneficiary): GoalBeneficiary {
  return {
    id: raw.id,
    goalId: raw.goalId,
    name: raw.name,
    relationship: raw.relationship as GoalBeneficiary["relationship"],
    allocationPercentage: parseFloat(raw.allocationPercentage) || 0,
    email: raw.email ?? undefined,
    phone: raw.phone ?? undefined,
    notes: raw.notes ?? undefined,
    version: raw.version,
  };
}

// Request-side counterparts: the API only accepts `contributedAt`/`note` and
// `title` — translate the app-facing field names back before sending.
function toContributionPayload(data: { amount?: string | { amount: string }; date?: string; notes?: string }): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (data.amount !== undefined) {
    payload.amount = typeof data.amount === "object" ? data.amount.amount : data.amount;
  }
  if (data.date) payload.contributedAt = data.date;
  if (data.notes) payload.note = data.notes;
  return payload;
}

function toMilestonePayload(data: { name?: string; targetAmount?: string | { amount: string }; targetDate?: string; thresholdPercent?: string | null }): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.title = data.name;
  if (data.targetAmount !== undefined) {
    payload.targetAmount = typeof data.targetAmount === "object" ? data.targetAmount.amount : data.targetAmount;
  }
  if (data.targetDate !== undefined) payload.targetDate = data.targetDate;
  if (data.thresholdPercent !== undefined) payload.thresholdPercent = data.thresholdPercent;
  return payload;
}

export const GOAL_QUERY_KEYS = {
  all: ["goals"] as const,
  list: (params?: Record<string, unknown>) => ["goals", "list", params] as const,
  dashboard: ["goals", "dashboard"] as const,
  detail: (id: string) => ["goals", "detail", id] as const,
  projection: (goalId: string) => ["goals", "projection", goalId] as const,
  contributions: (goalId: string, params?: Record<string, unknown>) => ["goals", "contributions", goalId, params] as const,
  milestones: (goalId: string) => ["goals", "milestones", goalId] as const,
  forecast: (goalId: string) => ["goals", "forecast", goalId] as const,
  analytics: (goalId: string) => ["goals", "analytics", goalId] as const,
  documents: (goalId: string) => ["goals", "documents", goalId] as const,
  beneficiaries: (goalId: string) => ["goals", "beneficiaries", goalId] as const,
  templates: ["goals", "templates"] as const,
};

// Goals Queries
export function useGoals(params?: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: GOAL_QUERY_KEYS.list(params),
    queryFn: async (): Promise<Goal[]> => {
      const res = await api.getGoals(params);
      return unwrapList<RawGoal>(res).map(mapGoal);
    },
    enabled: isAuth(),
  });
}

export function useGoalDashboard() {
  return useQuery({
    queryKey: GOAL_QUERY_KEYS.dashboard,
    queryFn: async (): Promise<GoalDashboardData> => api.getGoalDashboard(),
    enabled: isAuth(),
  });
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: GOAL_QUERY_KEYS.detail(id),
    queryFn: async (): Promise<Goal> => mapGoal((await api.getGoal(id)) as unknown as RawGoal),
    enabled: isAuth() && Boolean(id),
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGoalInput | Partial<Goal>) => api.createGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["netWorth"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      useUIStore.getState().showToast("Goal created successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, version = 1 }: { id: string; data: UpdateGoalInput | Partial<Goal>; version?: number }) =>
      api.updateGoal(id, data, version),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      useUIStore.getState().showToast("Goal updated successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version = 1 }: { id: string; version?: number }) => api.deleteGoal(id, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      useUIStore.getState().showToast("Goal deleted successfully", "info");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Status transitions
function useGoalStatusTransition(
  apiFn: (id: string, version: number) => Promise<Goal>,
  successMessage: string
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) => apiFn(id, version),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      useUIStore.getState().showToast(successMessage, "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useActivateGoal() {
  return useGoalStatusTransition(api.activateGoal, "Goal activated");
}
export function usePauseGoal() {
  return useGoalStatusTransition(api.pauseGoal, "Goal paused");
}
export function useResumeGoal() {
  return useGoalStatusTransition(api.resumeGoal, "Goal resumed");
}
export function useCancelGoal() {
  return useGoalStatusTransition(api.cancelGoal, "Goal cancelled");
}
export function useArchiveGoal() {
  return useGoalStatusTransition(api.archiveGoal, "Goal archived");
}

// Contributions Queries & Mutations — per-goal only, no cross-goal aggregate.
export function useGoalContributions(goalId: string, params?: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: GOAL_QUERY_KEYS.contributions(goalId, params),
    queryFn: async (): Promise<GoalContribution[]> => {
      const res = await api.getGoalContributions(goalId, params);
      return unwrapList<RawGoalContribution>(res).map(mapGoalContribution);
    },
    enabled: isAuth() && Boolean(goalId),
  });
}

export function useRecordGoalContribution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: CreateContributionInput | { amount: string; date?: string; notes?: string } }) =>
      api.recordGoalContribution(goalId, toContributionPayload(data)),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.detail(variables.goalId) });
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.contributions(variables.goalId) });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      useUIStore.getState().showToast("Contribution recorded successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export const useAddGoalContribution = useRecordGoalContribution;

export function useUpdateGoalContribution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, contributionId, data, expectedVersion }: { goalId: string; contributionId: string; data: Partial<GoalContribution>; expectedVersion: number }) =>
      api.updateGoalContribution(goalId, contributionId, toContributionPayload(data as unknown as { amount?: string; date?: string; notes?: string }), expectedVersion),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.detail(variables.goalId) });
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.contributions(variables.goalId) });
      useUIStore.getState().showToast("Contribution updated", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useDeleteGoalContribution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, contributionId, version }: { goalId: string; contributionId: string; version: number }) =>
      api.deleteGoalContribution(goalId, contributionId, version),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.detail(variables.goalId) });
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.contributions(variables.goalId) });
      useUIStore.getState().showToast("Contribution deleted", "info");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Milestones Queries & Mutations — per-goal only, no cross-goal aggregate.
export function useGoalMilestones(goalId: string) {
  return useQuery({
    queryKey: GOAL_QUERY_KEYS.milestones(goalId),
    queryFn: async (): Promise<GoalMilestone[]> => {
      const res = await api.getGoalMilestones(goalId);
      return unwrapList<RawGoalMilestone>(res).map(mapGoalMilestone);
    },
    enabled: isAuth() && Boolean(goalId),
  });
}

export function useAddGoalMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: CreateMilestoneInput | Partial<GoalMilestone> }) =>
      api.addGoalMilestone(goalId, toMilestonePayload(data as { name?: string; targetAmount?: string; targetDate?: string })),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.detail(variables.goalId) });
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.milestones(variables.goalId) });
      useUIStore.getState().showToast("Milestone added successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useUpdateGoalMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, milestoneId, data, expectedVersion }: { goalId: string; milestoneId: string; data: Partial<GoalMilestone>; expectedVersion: number }) =>
      api.updateGoalMilestone(goalId, milestoneId, toMilestonePayload(data as { name?: string; targetAmount?: string; targetDate?: string }), expectedVersion),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.detail(variables.goalId) });
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.milestones(variables.goalId) });
      useUIStore.getState().showToast("Milestone updated", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useDeleteGoalMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, milestoneId, version }: { goalId: string; milestoneId: string; version: number }) =>
      api.deleteGoalMilestone(goalId, milestoneId, version),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.detail(variables.goalId) });
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.milestones(variables.goalId) });
      useUIStore.getState().showToast("Milestone deleted", "info");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Forecast, Projection & Analytics — per-goal only, no cross-goal aggregate
// exists on the backend.
export function useGoalForecast(goalId: string) {
  return useQuery({
    queryKey: GOAL_QUERY_KEYS.forecast(goalId),
    queryFn: async (): Promise<GoalForecast> => mapGoalForecast((await api.getGoalForecast(goalId)) as unknown as RawGoalForecast),
    enabled: isAuth() && Boolean(goalId),
  });
}

export function useGoalAnalytics(goalId: string) {
  return useQuery({
    queryKey: GOAL_QUERY_KEYS.analytics(goalId),
    queryFn: async (): Promise<GoalAnalytics> => mapGoalAnalytics((await api.getGoalAnalytics(goalId)) as unknown as RawGoalAnalytics),
    enabled: isAuth() && Boolean(goalId),
  });
}

export function useGoalProjection(goalId: string) {
  return useQuery({
    queryKey: GOAL_QUERY_KEYS.projection(goalId),
    queryFn: async (): Promise<GoalProjection> => mapGoalProjection((await api.getGoalProjection(goalId)) as unknown as RawGoalProjection),
    enabled: isAuth() && Boolean(goalId),
  });
}

// Templates Queries & Mutations
export function useGoalTemplates() {
  return useQuery({
    queryKey: GOAL_QUERY_KEYS.templates,
    queryFn: async (): Promise<GoalTemplate[]> => {
      const res = await api.getGoalTemplates();
      return unwrapList<RawGoalTemplate>(res).map(mapGoalTemplate);
    },
    enabled: isAuth(),
  });
}

export function useCreateGoalTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<GoalTemplate>) => api.createGoalTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.templates });
      useUIStore.getState().showToast("Goal template created", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useDeleteGoalTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => api.deleteGoalTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.templates });
      useUIStore.getState().showToast("Template deleted", "info");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useApplyGoalTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data?: Partial<CreateGoalInput> }) =>
      api.applyGoalTemplate(templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.all });
      useUIStore.getState().showToast("Template applied to create goal", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Documents Hooks — per-goal only. Registers metadata for an
// already-uploaded file; does not accept raw file bytes.
export function useGoalDocuments(goalId: string) {
  return useQuery({
    queryKey: GOAL_QUERY_KEYS.documents(goalId),
    queryFn: async (): Promise<GoalDocument[]> => {
      const res = await api.getGoalDocuments(goalId);
      return unwrapList<GoalDocument>(res);
    },
    enabled: isAuth() && Boolean(goalId),
  });
}

export function useRegisterGoalDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: { category: string; fileName: string; storageKey: string; mimeType: string; sizeBytes: number; notes?: string } }) =>
      api.registerGoalDocument(goalId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.documents(variables.goalId) });
      useUIStore.getState().showToast("Document added successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useDeleteGoalDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, documentId }: { goalId: string; documentId: string }) =>
      api.deleteGoalDocument(goalId, documentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.documents(variables.goalId) });
      useUIStore.getState().showToast("Document deleted", "info");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Beneficiaries Hooks
export function useGoalBeneficiaries(goalId: string) {
  return useQuery({
    queryKey: GOAL_QUERY_KEYS.beneficiaries(goalId),
    queryFn: async (): Promise<GoalBeneficiary[]> => {
      const res = await api.getGoalBeneficiaries(goalId);
      return unwrapList<RawGoalBeneficiary>(res).map(mapGoalBeneficiary);
    },
    enabled: isAuth() && Boolean(goalId),
  });
}

export function useAddGoalBeneficiary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: Partial<GoalBeneficiary> }) =>
      api.addGoalBeneficiary(goalId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.beneficiaries(variables.goalId) });
      useUIStore.getState().showToast("Beneficiary added", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useUpdateGoalBeneficiary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, beneficiaryId, data, expectedVersion }: { goalId: string; beneficiaryId: string; data: Partial<GoalBeneficiary>; expectedVersion: number }) =>
      api.updateGoalBeneficiary(goalId, beneficiaryId, data, expectedVersion),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.beneficiaries(variables.goalId) });
      useUIStore.getState().showToast("Beneficiary updated", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useDeleteGoalBeneficiary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, beneficiaryId, version }: { goalId: string; beneficiaryId: string; version: number }) =>
      api.deleteGoalBeneficiary(goalId, beneficiaryId, version),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: GOAL_QUERY_KEYS.beneficiaries(variables.goalId) });
      useUIStore.getState().showToast("Beneficiary removed", "info");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}
