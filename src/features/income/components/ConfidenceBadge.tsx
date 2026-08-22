import React from "react";
import { CheckCircle2, AlertTriangle, HelpCircle, XCircle } from "lucide-react";
import { CONFIDENCE_LABEL, ConfidenceLevel } from "../utils/confidence";

const STYLES: Record<ConfidenceLevel, { className: string; icon: React.ReactNode }> = {
  high: {
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: <CheckCircle2 className="w-3 h-3" aria-hidden="true" />,
  },
  medium: {
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: <AlertTriangle className="w-3 h-3" aria-hidden="true" />,
  },
  low: {
    className: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    icon: <XCircle className="w-3 h-3" aria-hidden="true" />,
  },
  "not-detected": {
    className: "bg-slate-800 text-slate-400 border-slate-700",
    icon: <HelpCircle className="w-3 h-3" aria-hidden="true" />,
  },
};

/**
 * Never color-only: an icon + text label always accompanies the color, per
 * the accessibility requirement that no status be conveyed by color alone.
 */
export const ConfidenceBadge: React.FC<{ level: ConfidenceLevel }> = ({ level }) => {
  const style = STYLES[level];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${style.className}`}
    >
      {style.icon}
      {CONFIDENCE_LABEL[level]}
    </span>
  );
};
