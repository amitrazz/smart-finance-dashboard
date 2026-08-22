import React from "react";
import { CheckCircle2, HelpCircle, Search, XCircle } from "lucide-react";

type ReconciliationStatus = "UNMATCHED" | "SUGGESTED" | "MATCHED" | "REJECTED";

const STYLES: Record<ReconciliationStatus, { label: string; className: string; icon: React.ReactNode }> = {
  MATCHED: {
    label: "Matched",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: <CheckCircle2 className="w-3 h-3" aria-hidden="true" />,
  },
  SUGGESTED: {
    label: "Suggested Match",
    className: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    icon: <Search className="w-3 h-3" aria-hidden="true" />,
  },
  UNMATCHED: {
    label: "Unmatched",
    className: "bg-slate-800 text-slate-400 border-slate-700",
    icon: <HelpCircle className="w-3 h-3" aria-hidden="true" />,
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    icon: <XCircle className="w-3 h-3" aria-hidden="true" />,
  },
};

export const ReconciliationStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const style = STYLES[status as ReconciliationStatus] ?? STYLES.UNMATCHED;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${style.className}`}
    >
      {style.icon}
      {style.label}
    </span>
  );
};
