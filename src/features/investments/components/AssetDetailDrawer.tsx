import React from "react";
import { useAssetDetails } from "../hooks/useInvestmentQueries";
import { formatCurrency } from "../../../utils/formatters";
import { X, Layers } from "lucide-react";
import { GainLossBadge } from "./GainLossBadge";
import { RiskBadge } from "./RiskBadge";

interface AssetDetailDrawerProps {
  securityId: string | null;
  onClose: () => void;
}

export const AssetDetailDrawer: React.FC<AssetDetailDrawerProps> = ({ securityId, onClose }) => {
  const { data, isLoading } = useAssetDetails(securityId || "");

  if (!securityId) return null;

  const asset = data?.asset;
  const holding = data?.holding;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end">
      <div className="relative w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                {asset?.assetClass.replace("_", " ") || "EQUITY"}
              </span>
              <span className="text-xs font-mono text-slate-400">{asset?.symbol}</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-100">{asset?.name || "Asset Details"}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        {isLoading || !asset ? (
          <div className="p-8 space-y-4 animate-pulse">
            <div className="h-6 bg-slate-800 rounded w-1/2" />
            <div className="h-32 bg-slate-950 rounded-2xl" />
            <div className="h-48 bg-slate-950 rounded-2xl" />
          </div>
        ) : (
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Price Hero */}
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Market Price</span>
                <span className="text-3xl font-extrabold text-slate-100 font-mono">
                  {formatCurrency(asset.currentPrice)}
                </span>
              </div>
              <GainLossBadge amount={asset.dayChangeAmount} percent={asset.dayChangePercent} size="lg" />
            </div>

            {/* Position Summary if user holds this asset */}
            {holding && (
              <div className="p-5 rounded-3xl bg-indigo-950/20 border border-indigo-500/20 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Your Portfolio Position
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Total Quantity</span>
                    <span className="text-slate-100 font-bold">{holding.quantity}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Avg Cost</span>
                    <span className="text-slate-100 font-bold font-mono">{formatCurrency(holding.averageCostPrice)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Current Value</span>
                    <span className="text-indigo-400 font-extrabold font-mono">{formatCurrency(holding.currentValue)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Unrealized Gain</span>
                    <GainLossBadge amount={holding.unrealizedGain} percent={holding.unrealizedGainPercent} size="sm" />
                  </div>
                </div>
              </div>
            )}

            {/* Fundamentals & Stats */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Security Fundamentals</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">ISIN</span>
                  <span className="text-slate-200 font-mono font-semibold">{asset.isin || "—"}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Sector</span>
                  <span className="text-slate-200 font-semibold">{asset.sector || "—"}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Exchange</span>
                  <span className="text-slate-200 font-semibold">{asset.exchange || "NSE"}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Risk Rating</span>
                  <RiskBadge category={asset.riskRating} size="sm" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">P/E Ratio</span>
                  <span className="text-slate-200 font-mono font-bold">{asset.peRatio || "—"}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Dividend Yield</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {asset.dividendYield ? `${asset.dividendYield}%` : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* 52-Week Range */}
            {asset.weekHigh52 && asset.weekLow52 && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">52-Week Low: <strong className="text-slate-200 font-mono">{formatCurrency(asset.weekLow52)}</strong></span>
                  <span className="text-slate-400">52-Week High: <strong className="text-slate-200 font-mono">{formatCurrency(asset.weekHigh52)}</strong></span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full w-2/3" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
