import React from "react";
import { Lightbulb, X } from "lucide-react";

interface RecommendationCardProps {
  title: string;
  text: string;
  severity?: "INFO" | "WARNING" | "CRITICAL";
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}

const SEVERITY_STYLES: Record<NonNullable<RecommendationCardProps["severity"]>, string> = {
  INFO: "border-indigo-500/20 bg-indigo-500/5 text-indigo-400",
  WARNING: "border-amber-500/20 bg-amber-500/5 text-amber-400",
  CRITICAL: "border-rose-500/20 bg-rose-500/5 text-rose-400",
};

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  title,
  text,
  severity = "INFO",
  actionLabel,
  onAction,
  onDismiss,
}) => (
  <div className={`p-4 rounded-2xl border bg-slate-900/70 ${SEVERITY_STYLES[severity]} border-l-4 flex gap-3`}>
    <Lightbulb className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
    <div className="flex-1 min-w-0 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-bold text-slate-100">{title}</h4>
        {onDismiss && (
          <button onClick={onDismiss} aria-label="Dismiss recommendation" className="text-slate-500 hover:text-slate-300 shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <p className="text-xs text-slate-400">{text}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">
          {actionLabel} →
        </button>
      )}
    </div>
  </div>
);

export default RecommendationCard;
