import React from "react";
import { CheckCircle2, CircleDashed, Loader2, XCircle } from "lucide-react";
import type { FinancePlanAction } from "../../../../types";
import { Money } from "../../../../components/common/Money";
import { useCategories } from "../../../../hooks/useFinanceQueries";

interface InitialAllocation {
  categoryId: string;
  allocatedAmount: string;
}

function isInitialAllocationArray(value: unknown): value is InitialAllocation[] {
  return (
    Array.isArray(value) &&
    value.every(
      (v) =>
        typeof v === "object" &&
        v !== null &&
        typeof (v as Record<string, unknown>).categoryId === "string" &&
        typeof (v as Record<string, unknown>).allocatedAmount === "string",
    )
  );
}

const ACTION_LABELS: Record<FinancePlanAction["type"], string> = {
  CREATE_GOAL: "Create goal",
  UPDATE_GOAL: "Update goal",
  CREATE_BUDGET: "Create budget",
  UPDATE_BUDGET: "Update budget",
  CATEGORIZE_TRANSACTION: "Categorize transaction",
};

const STATUS_PRESENTATION: Record<
  FinancePlanAction["status"],
  { icon: React.ComponentType<{ className?: string }>; tone: string; label: string }
> = {
  PROPOSED: { icon: CircleDashed, tone: "text-slate-400", label: "Proposed — not yet approved" },
  APPROVED: { icon: CircleDashed, tone: "text-sky-400", label: "Approved — awaiting execution" },
  EXECUTING: { icon: Loader2, tone: "text-sky-400", label: "Executing…" },
  VERIFIED: { icon: CheckCircle2, tone: "text-emerald-400", label: "Completed" },
  FAILED: { icon: XCircle, tone: "text-rose-400", label: "Failed" },
  REJECTED: { icon: XCircle, tone: "text-slate-400", label: "Rejected" },
  CANCELLED: { icon: XCircle, tone: "text-slate-400", label: "Cancelled" },
  EXPIRED: { icon: XCircle, tone: "text-slate-400", label: "Expired" },
};

/** `amountKey`/`currency` pairs render as `<Money>`; every other field prints as label:value, verbatim — nothing is hidden behind a tooltip. */
function formatParamKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

function renderParamValue(key: string, value: unknown, currency: string | undefined): React.ReactNode {
  if (value === null || value === undefined) return "—";
  if (/amount$/i.test(key) && (typeof value === "string" || typeof value === "number")) {
    return <Money value={{ amount: String(value), currency: currency ?? "INR" }} className="text-slate-200" />;
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Shows exactly what a plan action will do (or did) — every parameter the
 * backend sent, never summarized away. This is the material used both for
 * the pre-accept review and the post-execution result, so it must render
 * sensibly in every `FinancePlanActionStatus`.
 */
export const PlanActionPreview: React.FC<{ action: FinancePlanAction }> = ({ action }) => {
  const { data: categories = [] } = useCategories();
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  const status = STATUS_PRESENTATION[action.status];
  const StatusIcon = status.icon;
  const currency = typeof action.parameters.currency === "string" ? action.parameters.currency : undefined;
  const initialAllocations = action.parameters.initialAllocations;
  const paramEntries = Object.entries(action.parameters).filter(
    ([key]) => key !== "currency" && key !== "initialAllocations",
  );

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-100">{ACTION_LABELS[action.type] ?? action.type}</span>
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${status.tone}`}>
          <StatusIcon className={`h-3.5 w-3.5 ${action.status === "EXECUTING" ? "animate-spin" : ""}`} aria-hidden="true" />
          {status.label}
        </span>
      </div>

      {paramEntries.length > 0 && (
        <dl className="mt-2.5 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
          {paramEntries.map(([key, value]) => (
            <div key={key} className="flex items-baseline justify-between gap-2 text-xs">
              <dt className="text-slate-500">{formatParamKey(key)}</dt>
              <dd className="font-medium text-slate-200">{renderParamValue(key, value, currency)}</dd>
            </div>
          ))}
        </dl>
      )}

      {isInitialAllocationArray(initialAllocations) && (
        <dl className="mt-2.5 space-y-1 border-t border-slate-800/60 pt-2.5">
          {initialAllocations.map((allocation) => (
            <div key={allocation.categoryId} className="flex items-baseline justify-between gap-2 text-xs">
              <dt className="text-slate-500">{categoryNameById.get(allocation.categoryId) ?? allocation.categoryId}</dt>
              <dd className="font-medium text-slate-200">
                <Money value={{ amount: allocation.allocatedAmount, currency: currency ?? "INR" }} />
              </dd>
            </div>
          ))}
        </dl>
      )}

      {action.status === "FAILED" && action.errorMessage && (
        <p className="mt-2.5 rounded-lg border border-rose-500/20 bg-rose-500/5 px-2.5 py-1.5 text-[11px] text-rose-300">
          {action.errorMessage}
        </p>
      )}

      {action.status === "VERIFIED" && action.executedEntityType && (
        <p className="mt-2.5 text-[11px] text-emerald-400/90">
          Applied to your {action.executedEntityType.toLowerCase()}
          {action.executedAt ? ` · ${new Date(action.executedAt).toLocaleString("en-IN")}` : ""}
        </p>
      )}
    </div>
  );
};

export default PlanActionPreview;
