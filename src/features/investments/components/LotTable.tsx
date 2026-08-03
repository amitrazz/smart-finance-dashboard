import React, { useState } from "react";
import { Holding, HoldingLot } from "../types/investmentTypes";
import { formatCurrency } from "../../../utils/formatters";
import { ChevronDown, ChevronRight, Layers, ExternalLink } from "lucide-react";
import { GainLossBadge } from "./GainLossBadge";

interface LotTableProps {
  holdings: Holding[];
  onSelectAsset?: (securityId: string) => void;
}

export const LotTable: React.FC<LotTableProps> = ({ holdings, onSelectAsset }) => {
  const [expandedHoldingId, setExpandedHoldingId] = useState<string | null>(holdings[0]?.id || null);

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
              <th className="p-4 text-right">Current Price</th>
              <th className="p-4 text-right">Current Value</th>
              <th className="p-4 text-right">Unrealized Gain</th>
              <th className="p-4 text-center">Lots</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {holdings.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-xs text-slate-500">
                  No investment holdings found matching current search/filter.
                </td>
              </tr>
            ) : (
              holdings.map((h) => {
                const isExpanded = expandedHoldingId === h.id;
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
                        <div className="flex items-center gap-2">
                          <div>
                            <span className="text-sm hover:text-indigo-400 transition-colors">
                              {h.securityName}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-mono text-slate-400">{h.symbol}</span>
                              {h.sector && (
                                <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                                  {h.sector}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
                          {h.assetClass.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-slate-200">
                        {h.quantity.toLocaleString()}
                      </td>
                      <td className="p-4 text-right text-xs text-slate-400 font-mono">
                        {formatCurrency(h.averageCostPrice)}
                      </td>
                      <td className="p-4 text-right text-xs font-semibold text-slate-200 font-mono">
                        {formatCurrency(h.currentPrice)}
                      </td>
                      <td className="p-4 text-right font-extrabold text-slate-100 font-mono">
                        {formatCurrency(h.currentValue)}
                      </td>
                      <td className="p-4 text-right">
                        <GainLossBadge amount={h.unrealizedGain} percent={h.unrealizedGainPercent} size="sm" />
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                          <Layers className="w-3 h-3" />
                          {h.lots?.length || 0} Lots
                        </span>
                      </td>
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectAsset && onSelectAsset(h.securityId)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="View Asset Details"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>

                    {/* Expandable FIFO Lots Subtable */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={10} className="p-0 bg-slate-950/60 border-y border-slate-800">
                          <div className="p-4 sm:p-6 space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                                <Layers className="w-4 h-4" /> Tax Lot Breakdown (FIFO Order)
                              </h5>
                              <span className="text-[11px] text-slate-400">
                                Broker: <strong className="text-slate-200">{h.brokerName || "Primary Demat"}</strong>
                              </span>
                            </div>

                            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/90">
                              <table className="w-full text-left text-xs text-slate-300">
                                <thead className="bg-slate-950 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800">
                                  <tr>
                                    <th className="p-3">Purchase Date</th>
                                    <th className="p-3">Holding Period</th>
                                    <th className="p-3 text-right">Orig Qty</th>
                                    <th className="p-3 text-right">Remaining Units</th>
                                    <th className="p-3 text-right">Cost / Unit</th>
                                    <th className="p-3 text-right">Total Cost</th>
                                    <th className="p-3 text-right">Current Value</th>
                                    <th className="p-3 text-right">Lot Gain / Loss</th>
                                    <th className="p-3 text-center">Tax Term</th>
                                    <th className="p-3 text-center">FIFO Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                  {(!h.lots || h.lots.length === 0) ? (
                                    <tr>
                                      <td colSpan={10} className="p-4 text-center text-slate-500">
                                        No lot records available for this position.
                                      </td>
                                    </tr>
                                  ) : (
                                    h.lots.map((lot: HoldingLot) => (
                                      <tr key={lot.id} className="hover:bg-slate-800/40">
                                        <td className="p-3 font-semibold text-slate-200 font-mono">
                                          {lot.purchaseDate}
                                        </td>
                                        <td className="p-3 text-slate-400">{lot.holdingPeriodDays} days</td>
                                        <td className="p-3 text-right text-slate-400">{lot.purchaseQuantity}</td>
                                        <td className="p-3 text-right font-bold text-slate-100">{lot.remainingQuantity}</td>
                                        <td className="p-3 text-right font-mono text-slate-300">{formatCurrency(lot.purchaseCostPerUnit)}</td>
                                        <td className="p-3 text-right font-mono text-slate-300">{formatCurrency(lot.totalCost)}</td>
                                        <td className="p-3 text-right font-mono font-bold text-slate-100">{formatCurrency(lot.currentValue)}</td>
                                        <td className="p-3 text-right">
                                          <GainLossBadge amount={lot.unrealizedGain} percent={lot.unrealizedGainPercent} size="sm" />
                                        </td>
                                        <td className="p-3 text-center">
                                          <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                              lot.taxTerm === "LONG_TERM"
                                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                            }`}
                                          >
                                            {lot.taxTerm.replace("_", " ")}
                                          </span>
                                        </td>
                                        <td className="p-3 text-center">
                                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                            {lot.fifoStatus}
                                          </span>
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
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
