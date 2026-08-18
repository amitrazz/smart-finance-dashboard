import React from "react";
import type { FinancePlanStatus } from "../../../../types";
import { presentPlanStatus, type PlanStatusTone } from "../../utils/planStatus";

const TONE_CLASSES: Record<PlanStatusTone, string> = {
  neutral: "border-slate-700 bg-slate-800/60 text-slate-300",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  danger: "border-rose-500/30 bg-rose-500/10 text-rose-300",
};

export const PlanStatusBadge: React.FC<{ status: FinancePlanStatus; className?: string }> = ({
  status,
  className = "",
}) => {
  const presented = presentPlanStatus(status);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TONE_CLASSES[presented.tone]} ${className}`}
    >
      {presented.label}
    </span>
  );
};

export default PlanStatusBadge;
