import React from "react";
import { AlertTriangle, CheckCircle2, PauseCircle, XCircle } from "lucide-react";
import { RecurringContributionRuleStatus } from "../../../types";
import { RECURRING_RULE_STATUS_LABELS } from "../constants/productTypes";

// Never color-only: every status also gets a distinct icon.
const STATUS_STYLES: Record<RecurringContributionRuleStatus, { chip: string; icon: React.ReactNode }> = {
  ACTIVE: {
    chip: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />,
  },
  PAUSED: {
    chip: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: <PauseCircle className="w-3.5 h-3.5" aria-hidden="true" />,
  },
  CANCELLED: {
    chip: "bg-slate-800 text-slate-400 border-slate-700",
    icon: <XCircle className="w-3.5 h-3.5" aria-hidden="true" />,
  },
  COMPLETED: {
    chip: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    icon: <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />,
  },
};

interface RecurringRuleStatusBadgeProps {
  status: RecurringContributionRuleStatus;
  autoPaused?: boolean;
  className?: string;
}

export const RecurringRuleStatusBadge: React.FC<RecurringRuleStatusBadgeProps> = ({
  status,
  autoPaused = false,
  className = "",
}) => {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${style.chip} ${className}`}
    >
      {autoPaused && status === "PAUSED" ? <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" /> : style.icon}
      {RECURRING_RULE_STATUS_LABELS[status]}
    </span>
  );
};
