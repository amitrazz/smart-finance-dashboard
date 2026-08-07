import React from "react";
import { Inbox, HelpCircle, ArrowRight } from "lucide-react";
import { Button } from "../ui/Button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  helpLabel?: string;
  helpUrl?: string;
  onHelpClick?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title = "Nothing Here Yet",
  message = "There's no data to show for this view.",
  actionLabel,
  onAction,
  actionIcon,
  helpLabel,
  helpUrl,
  onHelpClick,
}) => (
  <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-slate-800/80 text-center space-y-5 max-w-xl mx-auto shadow-xl">
    <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 w-16 h-16 mx-auto flex items-center justify-center text-blue-400">
      {icon ?? <Inbox className="w-8 h-8" aria-hidden="true" />}
    </div>
    
    <div className="space-y-1.5">
      <h3 className="text-lg font-bold text-slate-100 tracking-tight">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
        {message}
      </p>
    </div>

    {(actionLabel || helpLabel) && (
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        {actionLabel && onAction && (
          <Button
            variant="primary"
            hierarchy="filled"
            size="md"
            leftIcon={actionIcon}
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        )}

        {(helpLabel || helpUrl || onHelpClick) && (
          <button
            type="button"
            onClick={onHelpClick || (() => helpUrl && window.open(helpUrl, "_blank"))}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors font-medium cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{helpLabel || "Learn how this works"}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    )}
  </div>
);

export default EmptyState;
