import React from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title = "Nothing Here Yet",
  message = "There's no data to show for this view.",
  actionLabel,
  onAction,
}) => (
  <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
    {icon ?? <Inbox className="w-10 h-10 text-slate-600 mx-auto" aria-hidden="true" />}
    <h3 className="text-lg font-bold text-slate-100">{title}</h3>
    <p className="text-xs text-slate-400 max-w-md mx-auto">{message}</p>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
