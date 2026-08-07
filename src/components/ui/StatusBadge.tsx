import React from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  FileEdit,
  XCircle,
  PieChart,
  Loader2,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type StatusType =
  | "draft"
  | "processing"
  | "pending"
  | "completed"
  | "failed"
  | "partially_complete"
  | "cancelled"
  | "syncing";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType | string;
  label?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

const statusConfig: Record<
  StatusType,
  { label: string; bg: string; text: string; border: string; icon: React.FC<{ className?: string }> }
> = {
  draft: {
    label: "Draft",
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/20",
    icon: FileEdit,
  },
  processing: {
    label: "Processing",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
    icon: Loader2,
  },
  pending: {
    label: "Pending",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
    icon: Clock,
  },
  completed: {
    label: "Completed",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/20",
    icon: AlertCircle,
  },
  partially_complete: {
    label: "Partially Complete",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/20",
    icon: PieChart,
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/20",
    icon: XCircle,
  },
  syncing: {
    label: "Syncing",
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    border: "border-cyan-500/20",
    icon: RefreshCw,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = "md",
  showIcon = true,
  className,
  ...props
}) => {
  const normalizedKey = (status.toString().toLowerCase().replace(/[\s-]/g, "_")) as StatusType;
  const config = statusConfig[normalizedKey] || {
    label: label || status,
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/20",
    icon: Clock,
  };

  const displayLabel = label || config.label;
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1 rounded-md",
    md: "px-2.5 py-1 text-xs gap-1.5 rounded-lg",
    lg: "px-3 py-1.5 text-xs font-semibold gap-2 rounded-xl",
  };

  const isSpinning = normalizedKey === "syncing" || normalizedKey === "processing";

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center font-medium border uppercase tracking-wider shrink-0 transition-colors",
          config.bg,
          config.text,
          config.border,
          sizeClasses[size],
          className
        )
      )}
      {...props}
    >
      {showIcon && (
        <IconComponent
          className={clsx(
            size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5",
            isSpinning && "animate-spin"
          )}
        />
      )}
      <span>{displayLabel}</span>
    </span>
  );
};

export default StatusBadge;
