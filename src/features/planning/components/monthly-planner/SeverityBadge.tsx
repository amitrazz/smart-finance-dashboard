import React from "react";
import { AlertOctagon, AlertTriangle, Info } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { PlanningWarningSeverity } from "../../../../types";

export interface SeverityBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  severity: PlanningWarningSeverity;
  size?: "sm" | "md";
}

const CONFIG: Record<
  PlanningWarningSeverity,
  { label: string; bg: string; text: string; border: string; icon: React.FC<{ className?: string }> }
> = {
  CRITICAL: {
    label: "Critical",
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/20",
    icon: AlertOctagon,
  },
  WARNING: {
    label: "Warning",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
    icon: AlertTriangle,
  },
  INFO: {
    label: "Info",
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    border: "border-sky-500/20",
    icon: Info,
  },
};

/**
 * Mirrors StatusBadge/FinancialBadge's exact visual convention (this repo
 * has no shared design-system package — every badge is a small local
 * component styled the same way). Severity is never color-only: icon +
 * text label always accompany the tint.
 */
export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  size = "md",
  className,
  ...props
}) => {
  const config = CONFIG[severity] ?? CONFIG.INFO;
  const Icon = config.icon;
  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-[10px] gap-1 rounded-md" : "px-2.5 py-1 text-xs gap-1.5 rounded-lg";

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center font-medium border uppercase tracking-wider shrink-0",
          config.bg,
          config.text,
          config.border,
          sizeClasses,
          className
        )
      )}
      {...props}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};

export default SeverityBadge;
