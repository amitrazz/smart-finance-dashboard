import React from "react";
import { AlertTriangle, Clock, CloudOff, Lock, RefreshCw, ShieldOff, WifiOff } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { presentAiError, type AiErrorKind } from "../../utils/aiErrorMessages";

const ICONS: Record<AiErrorKind, React.ComponentType<{ className?: string }>> = {
  offline: WifiOff,
  network: CloudOff,
  timeout: Clock,
  auth: Lock,
  forbidden: ShieldOff,
  "not-found": AlertTriangle,
  "rate-limited": Clock,
  "concurrency-conflict": RefreshCw,
  "business-rule": AlertTriangle,
  validation: AlertTriangle,
  unavailable: CloudOff,
  unknown: AlertTriangle,
};

/**
 * The one place that turns any caught error into a typed, actionable inline
 * state — never a bare "Something went wrong". `presentAiError` decides the
 * copy and whether a retry makes sense; this component only renders it.
 */
export const AiErrorState: React.FC<{ error: unknown; onRetry?: () => void }> = ({ error, onRetry }) => {
  const presented = presentAiError(error);
  const Icon = ICONS[presented.kind];

  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/5 px-3.5 py-3 text-sm"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="font-medium text-rose-200">{presented.title}</p>
        <p className="text-xs text-rose-300/80">{presented.message}</p>
        {presented.retryable && onRetry && (
          <Button variant="danger" hierarchy="outline" size="sm" onClick={onRetry} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
            Try again
          </Button>
        )}
      </div>
    </div>
  );
};

export default AiErrorState;
