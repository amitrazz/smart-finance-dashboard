import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Failed to Load",
  message = "Something went wrong while loading this data.",
  onRetry,
}) => (
  <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
    <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" aria-hidden="true" />
    <h3 className="text-lg font-bold text-slate-100">{title}</h3>
    <p className="text-xs text-slate-400 max-w-md mx-auto">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        aria-label="Retry loading data"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-all"
      >
        <RefreshCw className="w-4 h-4" aria-hidden="true" /> Retry
      </button>
    )}
  </div>
);

export default ErrorState;
