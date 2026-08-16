import React from "react";
import { AlertOctagon, CheckCircle2, MinusCircle } from "lucide-react";
import { RecurringContributionExecutionStatus } from "../../../types";
import { EXECUTION_STATUS_LABELS } from "../constants/productTypes";

// Never color-only: every status also gets a distinct icon.
const STATUS_STYLES: Record<RecurringContributionExecutionStatus, { chip: string; icon: React.ReactNode }> = {
  SUCCEEDED: {
    chip: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />,
  },
  SKIPPED: {
    chip: "bg-slate-800 text-slate-300 border-slate-700",
    icon: <MinusCircle className="w-3.5 h-3.5" aria-hidden="true" />,
  },
  FAILED: {
    chip: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    icon: <AlertOctagon className="w-3.5 h-3.5" aria-hidden="true" />,
  },
};

interface ExecutionStatusBadgeProps {
  status: RecurringContributionExecutionStatus;
  className?: string;
}

export const ExecutionStatusBadge: React.FC<ExecutionStatusBadgeProps> = ({ status, className = "" }) => {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${style.chip} ${className}`}
    >
      {style.icon}
      {EXECUTION_STATUS_LABELS[status]}
    </span>
  );
};
