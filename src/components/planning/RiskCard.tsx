import React from "react";
import { AlertOctagon } from "lucide-react";

interface RiskCardProps {
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category?: string;
  resolutionHint?: string;
  onClick?: () => void;
}

const SEVERITY_STYLES: Record<RiskCardProps["severity"], string> = {
  LOW: "border-slate-700 bg-slate-800/40 text-slate-400",
  MEDIUM: "border-amber-500/20 bg-amber-500/5 text-amber-400",
  HIGH: "border-orange-500/20 bg-orange-500/5 text-orange-400",
  CRITICAL: "border-rose-500/20 bg-rose-500/5 text-rose-400",
};

export const RiskCard: React.FC<RiskCardProps> = ({ title, description, severity, category, resolutionHint, onClick }) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={`w-full text-left p-4 rounded-2xl border bg-slate-900/70 ${SEVERITY_STYLES[severity]} border-l-4 flex gap-3 ${
      onClick ? "cursor-pointer hover:bg-slate-900" : "cursor-default"
    }`}
  >
    <AlertOctagon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
    <div className="flex-1 min-w-0 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-slate-100">{title}</h4>
        <span className="text-[10px] font-bold uppercase tracking-wide">{severity}</span>
      </div>
      <p className="text-xs text-slate-400">{description}</p>
      <div className="flex items-center gap-2 text-[11px] text-slate-500">
        {category && <span>{category}</span>}
        {resolutionHint && <span className="italic">{resolutionHint}</span>}
      </div>
    </div>
  </button>
);

export default RiskCard;
