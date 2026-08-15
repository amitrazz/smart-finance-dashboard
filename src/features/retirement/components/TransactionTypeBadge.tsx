import React from "react";
import { ArrowDownCircle, ArrowUpCircle, Circle } from "lucide-react";
import { RetirementTransactionType } from "../../../types";
import { TRANSACTION_TYPE_LABELS, TransactionTone } from "../constants/productTypes";

// Never color-only: every tone also gets a distinct icon so the meaning
// survives for users who can't distinguish color (accessibility requirement
// from the task spec, section 26).
const TONE_STYLES: Record<TransactionTone, { chip: string; icon: React.ReactNode }> = {
  positive: {
    chip: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: <ArrowUpCircle className="w-3.5 h-3.5" aria-hidden="true" />,
  },
  negative: {
    chip: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    icon: <ArrowDownCircle className="w-3.5 h-3.5" aria-hidden="true" />,
  },
  neutral: {
    chip: "bg-slate-800 text-slate-300 border-slate-700",
    icon: <Circle className="w-3 h-3" aria-hidden="true" />,
  },
};

interface TransactionTypeBadgeProps {
  type: RetirementTransactionType;
  className?: string;
}

export const TransactionTypeBadge: React.FC<TransactionTypeBadgeProps> = ({ type, className = "" }) => {
  const config = TRANSACTION_TYPE_LABELS[type];
  const style = TONE_STYLES[config.tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${style.chip} ${className}`}
    >
      {style.icon}
      {config.label}
    </span>
  );
};
