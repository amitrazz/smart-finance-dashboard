import React, { useState } from "react";
import { Holding, Lot } from "../../../types";
import { formatCurrency } from "../../../utils/formatters";
import { useHoldingLots } from "../../../hooks/useFinanceQueries";
import { ChevronDown, ChevronRight, Layers, ExternalLink } from "lucide-react";
import { GainLossBadge } from "./GainLossBadge";

interface LotTableProps {
  holdings: Holding[];
  onSelectAsset?: (holding: Holding) => void;
}

const LotsSubTable: React.FC<{ holdingId: string; currency: string }> = ({ holdingId, currency }) => {
  const { data: lots, isLoading } = useHoldingLots(holdingId);

  if (isLoading) {
    return <div className="p-4 text-center text-xs text-slate-500">Loading tax lots...</div>;
  }

  if (!lots || lots.length === 0) {
    return <div className="p-4 text-center text-xs text-slate-500">No lot records available for this position.</div>;
  }

  return (
    <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/90">
      <table className="w-full text-left text-xs text-slate-300">
        <thead className="bg-slate-950 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800">
          <tr>
            <th className="p-3">Open Date</th>
            <th className="p-3 text-right">Original Qty</th>
            <th className="p-3 text-right">Remaining Qty</th>
            <th className="p-3 text-right">Unit Cost</th>
            <th className="p-3 text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {lots.map((lot: Lot) => (
            <tr key={lot.id} className="hover:bg-slate-800/40">
              <td className="p-3 font-semibold text-slate-200 font-mono">{lot.openDate}</td>
              <td className="p-3 text-right text-slate-400">{lot.originalQuantity}</td>
              <td className="p-3 text-right font-bold text-slate-100">{lot.remainingQuantity}</td>
              <td className="p-3 text-right font-mono text-slate-300">
                {formatCurrency({ amount: lot.unitCost, currency })}
              </td>
              <td className="p-3 text-center">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    lot.status === "OPEN"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  {lot.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const LotTable: React.FC<LotTableProps> = ({ holdings, onSelectAsset }) => {
  const [expandedHoldingId, setExpandedHoldingId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedHoldingId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="rounded-3xl bg-slate-900/70 border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-4 w-10"></th>
              <th className="p-4">Security / Asset</th>
              <th className="p-4">Asset Class</th>
              <th className="p-4 text-right">Quantity</th>
              <th className="p-4 text-right">Avg Cost</th>
              <th className="p-4 text-right">Market Value</th>
              <th className="p-4 text-right">Unrealized Gain</th>
              <th className="p-4 text-center">Lots</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {holdings.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-xs text-slate-500">
                  No investment holdings found matching current search/filter.
                </td>
              </tr>
            ) : (
              holdings.map((h) => {
                const isExpanded = expandedHoldingId === h.id;
                const currency = h.marketValue?.currency || "INR";
                return (
                  <React.Fragment key={h.id}>
                    <tr
                      className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        isExpanded ? "bg-slate-800/30" : ""
                      }`}
                      onClick={() => toggleExpand(h.id)}
                    >
                      <td className="p-4 text-slate-400">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </td>
                      <td className="p-4 font-bold text-slate-100">
                        <div>
                          <span className="text-sm">{h.security?.name || "Unknown Security"}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-mono text-slate-400">{h.security?.symbol || "—"}</span>
                            {h.security?.sector && (
                              <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                                {h.security.sector}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
                          {h.security?.assetClass?.replace(/_/g, " ") || "—"}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-slate-200">{h.quantity}</td>
                      <td className="p-4 text-right text-xs text-slate-400 font-mono">
                        {formatCurrency({ amount: h.averageCost, currency })}
                      </td>
                      <td className="p-4 text-right font-extrabold text-slate-100 font-mono">
                        {formatCurrency(h.marketValue)}
                      </td>
                      <td className="p-4 text-right">
                        <GainLossBadge amount={h.unrealizedGain} percent={parseFloat(h.unrealizedGainPercent)} size="sm" />
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                          <Layers className="w-3 h-3" />
                          View
                        </span>
                      </td>
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectAsset && onSelectAsset(h)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="View Asset Details"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan={9} className="p-0 bg-slate-950/60 border-y border-slate-800">
                          <div className="p-4 sm:p-6 space-y-3">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                              <Layers className="w-4 h-4" /> Tax Lot Breakdown (FIFO Order)
                            </h5>
                            <LotsSubTable holdingId={h.id} currency={currency} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
