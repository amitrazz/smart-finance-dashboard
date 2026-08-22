import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../services/api/endpoints";
import { useAuthStore } from "../../../store/useAuthStore";
import { useUIStore } from "../../../store/useUIStore";
import { BUDGET_QUERY_KEYS } from "../../budgets/hooks/useBudgetQueries";
import {
  CurrencyCode,
  Money,
  MonthlyBudgetIntegration,
  MonthlyCashFlowProjection,
  MonthlyCloseResult,
  MonthlyDebtCommitments,
  MonthlyFinancialPlan,
  MonthlyFixedCommitments,
  MonthlyIncomeProjection,
  MonthlyInvestments,
  MonthlyPlanningWarning,
  MonthlySafeToSpend,
  MonthlySavings,
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

const toMoney = (amount: string | undefined | null, currency: CurrencyCode): Money | undefined =>
  amount === undefined || amount === null ? undefined : { amount, currency };

const toMoneyRequired = (amount: string, currency: CurrencyCode): Money => ({ amount, currency });

// --- Raw wire shapes (MonthlyFinancialPlanResponseDto) — every money field
// is a bare decimal string on the wire; mapMonthlyPlan() below wraps each
// into a `Money` the same way useBudgetQueries.ts's toMoney() does for Budget.
interface RawVarianceLine {
  planned: string;
  actual?: string;
  variance?: string;
  remaining?: string;
  utilizationPercent?: string;
}

interface RawMonthlyPlan {
  period: { year: number; month: number; startDate: string; endDate: string; timing: string };
  baseCurrency: string;
  sourceCurrency: string;
  conversionApplied: boolean;
  income: RawVarianceLine & {
    sources: Array<{ incomeSourceId: string; name: string; expectedAmount: string }>;
  };
  fixedCommitments: RawVarianceLine & {
    items: Array<{
      id: string;
      type: string;
      description: string;
      expectedAmount: string;
      dueDate: string | null;
      source: string;
      categoryId: string | null;
      status: string;
    }>;
  };
  debtCommitments: {
    principal: string;
    interest: string;
    fees: string;
    minimumPayments: string;
    total: string;
    loanItems: Array<{
      loanId: string;
      loanName: string;
      dueDate: string;
      principal: string;
      interest: string;
      total: string;
    }>;
    cardItems: Array<{
      creditCardId: string;
      cardNickname: string;
      dueDate: string;
      minimumDue: string;
      interestCharged: string;
      fees: string;
    }>;
  };
  budget: {
    allocated: string;
    actual?: string;
    remaining?: string;
    utilizationPercent?: string;
    budgets: Array<{
      budgetId: string;
      name: string;
      allocated: string;
      actual?: string;
      remaining?: string;
      utilizationPercent?: string;
      periodStatus: string;
      projectedOverspend?: string;
    }>;
  };
  savings: RawVarianceLine & {
    byGoal?: Array<{ goalId: string; name: string; planned: string; actual: string }>;
  };
  investments: RawVarianceLine & {
    bySipPlan?: Array<{ sipPlanId: string; assetId: string; planned: string }>;
  };
  cashFlow?: {
    openingCash: string;
    openingCashBasis: string;
    expectedIncome: string;
    expectedOutflow: string;
    expectedClosingCash: string;
  };
  safeToSpend?: {
    expectedIncome: string;
    mandatoryCommitments: string;
    debtPayments: string;
    plannedSavings: string;
    plannedInvestments: string;
    minimumCashBuffer: string;
    safeToSpend: string;
  };
  savingsRatePercent: string;
  warnings?: Array<{
    code: string;
    severity: string;
    title: string;
    message: string;
    amount?: string;
    relatedEntityId?: string;
  }>;
  health: { status: string; scoreDate: string | null };
}

function mapVarianceLine(raw: RawVarianceLine, currency: CurrencyCode) {
  return {
    planned: toMoneyRequired(raw.planned, currency),
    actual: toMoney(raw.actual, currency),
    variance: toMoney(raw.variance, currency),
    remaining: toMoney(raw.remaining, currency),
    utilizationPercent:
      raw.utilizationPercent !== undefined ? parseFloat(raw.utilizationPercent) : undefined,
  };
}

export function mapMonthlyPlan(raw: RawMonthlyPlan): MonthlyFinancialPlan {
  const currency = raw.baseCurrency as CurrencyCode;

  const income: MonthlyIncomeProjection = {
    ...mapVarianceLine(raw.income, currency),
    sources: raw.income.sources.map((s) => ({
      incomeSourceId: s.incomeSourceId,
      name: s.name,
      expectedAmount: toMoneyRequired(s.expectedAmount, currency),
    })),
  };

  const fixedCommitments: MonthlyFixedCommitments = {
    ...mapVarianceLine(raw.fixedCommitments, currency),
    items: raw.fixedCommitments.items.map((item) => ({
      id: item.id,
      type: "FIXED_COMMITMENT",
      description: item.description,
      expectedAmount: toMoneyRequired(item.expectedAmount, currency),
      dueDate: item.dueDate,
      source: item.source as MonthlyFixedCommitments["items"][number]["source"],
      categoryId: item.categoryId,
      status: item.status as MonthlyFixedCommitments["items"][number]["status"],
    })),
  };

  const debtCommitments: MonthlyDebtCommitments = {
    principal: toMoneyRequired(raw.debtCommitments.principal, currency),
    interest: toMoneyRequired(raw.debtCommitments.interest, currency),
    fees: toMoneyRequired(raw.debtCommitments.fees, currency),
    minimumPayments: toMoneyRequired(raw.debtCommitments.minimumPayments, currency),
    total: toMoneyRequired(raw.debtCommitments.total, currency),
    loanItems: raw.debtCommitments.loanItems.map((l) => ({
      loanId: l.loanId,
      loanName: l.loanName,
      dueDate: l.dueDate,
      principal: toMoneyRequired(l.principal, currency),
      interest: toMoneyRequired(l.interest, currency),
      total: toMoneyRequired(l.total, currency),
    })),
    cardItems: raw.debtCommitments.cardItems.map((c) => ({
      creditCardId: c.creditCardId,
      cardNickname: c.cardNickname,
      dueDate: c.dueDate,
      minimumDue: toMoneyRequired(c.minimumDue, currency),
      interestCharged: toMoneyRequired(c.interestCharged, currency),
      fees: toMoneyRequired(c.fees, currency),
    })),
  };

  const budget: MonthlyBudgetIntegration = {
    allocated: toMoneyRequired(raw.budget.allocated, currency),
    actual: toMoney(raw.budget.actual, currency),
    remaining: toMoney(raw.budget.remaining, currency),
    utilizationPercent:
      raw.budget.utilizationPercent !== undefined
        ? parseFloat(raw.budget.utilizationPercent)
        : undefined,
    budgets: raw.budget.budgets.map((b) => ({
      budgetId: b.budgetId,
      name: b.name,
      allocated: toMoneyRequired(b.allocated, currency),
      actual: toMoney(b.actual, currency),
      remaining: toMoney(b.remaining, currency),
      utilizationPercent: b.utilizationPercent !== undefined ? parseFloat(b.utilizationPercent) : undefined,
      periodStatus: b.periodStatus as MonthlyBudgetIntegration["budgets"][number]["periodStatus"],
      projectedOverspend: toMoney(b.projectedOverspend, currency),
    })),
  };

  const savings: MonthlySavings = {
    ...mapVarianceLine(raw.savings, currency),
    byGoal: (raw.savings.byGoal ?? []).map((g) => ({
      goalId: g.goalId,
      name: g.name,
      planned: toMoneyRequired(g.planned, currency),
      actual: toMoneyRequired(g.actual, currency),
    })),
  };

  const investments: MonthlyInvestments = {
    ...mapVarianceLine(raw.investments, currency),
    bySipPlan: (raw.investments.bySipPlan ?? []).map((p) => ({
      sipPlanId: p.sipPlanId,
      assetId: p.assetId,
      planned: toMoneyRequired(p.planned, currency),
    })),
  };

  const cashFlow: MonthlyCashFlowProjection | undefined = raw.cashFlow
    ? {
        openingCash: toMoneyRequired(raw.cashFlow.openingCash, currency),
        openingCashBasis: raw.cashFlow.openingCashBasis as MonthlyCashFlowProjection["openingCashBasis"],
        expectedIncome: toMoneyRequired(raw.cashFlow.expectedIncome, currency),
        expectedOutflow: toMoneyRequired(raw.cashFlow.expectedOutflow, currency),
        expectedClosingCash: toMoneyRequired(raw.cashFlow.expectedClosingCash, currency),
      }
    : undefined;

  const safeToSpend: MonthlySafeToSpend | undefined = raw.safeToSpend
    ? {
        expectedIncome: toMoneyRequired(raw.safeToSpend.expectedIncome, currency),
        mandatoryCommitments: toMoneyRequired(raw.safeToSpend.mandatoryCommitments, currency),
        debtPayments: toMoneyRequired(raw.safeToSpend.debtPayments, currency),
        plannedSavings: toMoneyRequired(raw.safeToSpend.plannedSavings, currency),
        plannedInvestments: toMoneyRequired(raw.safeToSpend.plannedInvestments, currency),
        minimumCashBuffer: toMoneyRequired(raw.safeToSpend.minimumCashBuffer, currency),
        safeToSpend: toMoneyRequired(raw.safeToSpend.safeToSpend, currency),
      }
    : undefined;

  const warnings: MonthlyPlanningWarning[] | undefined = raw.warnings?.map((w) => ({
    code: w.code as MonthlyPlanningWarning["code"],
    severity: w.severity as MonthlyPlanningWarning["severity"],
    title: w.title,
    message: w.message,
    amount: toMoney(w.amount, currency),
    relatedEntityId: w.relatedEntityId,
  }));

  return {
    period: {
      year: raw.period.year,
      month: raw.period.month,
      startDate: raw.period.startDate,
      endDate: raw.period.endDate,
      timing: raw.period.timing as MonthlyFinancialPlan["period"]["timing"],
    },
    baseCurrency: raw.baseCurrency,
    sourceCurrency: raw.sourceCurrency,
    conversionApplied: raw.conversionApplied,
    income,
    fixedCommitments,
    debtCommitments,
    budget,
    savings,
    investments,
    cashFlow,
    safeToSpend,
    savingsRatePercent: parseFloat(raw.savingsRatePercent) || 0,
    warnings,
    health: raw.health,
  };
}

export const MONTHLY_PLANNER_QUERY_KEYS = {
  all: ["monthly-planner"] as const,
  plan: (year: number, month: number, minimumCashBuffer: string) =>
    ["monthly-planner", "plan", year, month, minimumCashBuffer] as const,
};

export function useMonthlyPlan(year: number, month: number, minimumCashBuffer: string = "0") {
  return useQuery({
    queryKey: MONTHLY_PLANNER_QUERY_KEYS.plan(year, month, minimumCashBuffer),
    queryFn: async (): Promise<MonthlyFinancialPlan> => {
      const raw = (await api.getMonthlyPlan({
        year,
        month,
        includeActuals: true,
        includeWarnings: true,
        includeBreakdown: true,
        minimumCashBuffer,
      })) as RawMonthlyPlan;
      return mapMonthlyPlan(raw);
    },
    enabled: isAuth() && Number.isInteger(year) && month >= 1 && month <= 12,
    staleTime: 60_000,
  });
}

export function useCloseMonth() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { year: number; month: number }): Promise<MonthlyCloseResult> => {
      const raw = (await api.closeMonth(data)) as {
        plan: RawMonthlyPlan;
        carryForwardResults: MonthlyCloseResult["carryForwardResults"];
      };
      return { plan: mapMonthlyPlan(raw.plan), carryForwardResults: raw.carryForwardResults };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MONTHLY_PLANNER_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      useUIStore.getState().showToast("Month closed", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useRolloverMonth() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      year: number;
      month: number;
      minimumCashBuffer?: string;
    }): Promise<MonthlyFinancialPlan> => {
      const raw = (await api.rolloverMonth(data)) as RawMonthlyPlan;
      return mapMonthlyPlan(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MONTHLY_PLANNER_QUERY_KEYS.all });
      useUIStore.getState().showToast("Next month's plan generated", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}
