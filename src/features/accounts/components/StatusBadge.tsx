import React from "react";

export type StatusVariant =
  | "ACTIVE"
  | "INACTIVE"
  | "CLOSED"
  | "FROZEN"
  | "MATCHED"
  | "PENDING"
  | "EXCEPTION"
  | "EXCEPTIONS"
  | "MANUAL_REVIEW"
  | "UNMATCHED"
  | "COMPLETED"
  | "SCHEDULED"
  | "FAILED"
  | "READY"
  | "PROCESSING"
  | "SYNCED"
  | "WARNING";

interface StatusBadgeProps {
  status: StatusVariant | string;
  size?: "sm" | "md";
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "md", className = "" }) => {
  const norm = (status || "").toUpperCase();

  let style = "bg-slate-800/80 text-slate-300 border-slate-700/60";
  const label = status;

  switch (norm) {
    case "ACTIVE":
    case "MATCHED":
    case "COMPLETED":
    case "READY":
    case "SYNCED":
      style = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      break;
    case "PENDING":
    case "SCHEDULED":
    case "PROCESSING":
    case "MANUAL_REVIEW":
      style = "bg-amber-500/10 text-amber-400 border-amber-500/30";
      break;
    case "EXCEPTION":
    case "EXCEPTIONS":
    case "FAILED":
    case "UNMATCHED":
    case "FROZEN":
    case "WARNING":
      style = "bg-rose-500/10 text-rose-400 border-rose-500/30";
      break;
    case "INACTIVE":
    case "CLOSED":
      style = "bg-slate-800/80 text-slate-400 border-slate-700/40";
      break;
  }

  const padding = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${padding} ${style} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
};
