import React, { useState } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";
import { formatCurrency } from "../../../../utils/formatters";
import { MonthlySafeToSpend } from "../../../../types";

interface SafeToSpendPanelProps {
  safeToSpend?: MonthlySafeToSpend;
  minimumCashBuffer: string;
  onBufferChange: (value: string) => void;
}

const ROW_LABELS: Array<{ key: keyof MonthlySafeToSpend; label: string; sign: "+" | "-" }> = [
  { key: "expectedIncome", label: "Expected Income", sign: "+" },
  { key: "mandatoryCommitments", label: "Mandatory Commitments", sign: "-" },
  { key: "debtPayments", label: "Debt Payments", sign: "-" },
  { key: "plannedSavings", label: "Planned Savings", sign: "-" },
  { key: "plannedInvestments", label: "Planned Investments", sign: "-" },
  { key: "minimumCashBuffer", label: "Minimum Cash Buffer", sign: "-" },
];

/** Spec §6 — the primary decision metric. Every number is rendered straight from the backend's safeToSpend breakdown; nothing is recalculated in React. */
export const SafeToSpendPanel: React.FC<SafeToSpendPanelProps> = ({
  safeToSpend,
  minimumCashBuffer,
  onBufferChange,
}) => {
  const [isExpanded, setExpanded] = useState(false);
  const isNegative = safeToSpend ? parseFloat(safeToSpend.safeToSpend.amount) < 0 : false;

  return (
    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-bold text-slate-400 tracking-wide uppercase flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> Safe to Spend
          </p>
          <p
            aria-live="polite"
            className={`text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 ${
              isNegative ? "text-rose-400" : "text-slate-100"
            }`}
          >
            {safeToSpend ? formatCurrency(safeToSpend.safeToSpend) : "—"}
          </p>
        </div>

        <label className="flex flex-col gap-1 text-xs">
          <span className="font-bold text-slate-500 uppercase tracking-wide">Minimum Cash Buffer</span>
          <input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={minimumCashBuffer}
            onChange={(e) => onBufferChange(e.target.value)}
            aria-label="Minimum cash buffer"
            className="w-36 px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={isExpanded}
        className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} aria-hidden="true" />
        {isExpanded ? "Hide calculation" : "Show calculation"}
      </button>

      {isExpanded && safeToSpend && (
        <div className="pt-3 border-t border-slate-800/60 space-y-2 text-sm">
          {ROW_LABELS.map((row) => (
            <div key={row.key} className="flex items-center justify-between text-slate-300">
              <span>{row.label}</span>
              <span className="font-semibold">
                {row.sign === "-" ? "− " : ""}
                {formatCurrency(safeToSpend[row.key])}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 font-extrabold">
            <span className="text-slate-100">Safe to Spend</span>
            <span className={isNegative ? "text-rose-400" : "text-emerald-400"}>
              {formatCurrency(safeToSpend.safeToSpend)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SafeToSpendPanel;
