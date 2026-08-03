import React from "react";

import { formatCurrency } from "../../../utils/formatters";
import { Lock, Zap, Clock, ShieldCheck } from "lucide-react";

interface LiquidityCardProps {
  available: string;
  pending: string;
  locked: string;
  emergency: string;
  currency?: string;
}

export const LiquidityCard: React.FC<LiquidityCardProps> = ({
  available,
  pending,
  locked,
  emergency,
  currency = "INR",
}) => {
  const availNum = parseFloat(available || "0");
  const pendNum = parseFloat(pending || "0");
  const lockNum = parseFloat(locked || "0");
  const total = availNum + pendNum + lockNum || 1;

  const availPct = Math.round((availNum / total) * 100);
  const pendPct = Math.round((pendNum / total) * 100);
  const lockPct = Math.round((lockNum / total) * 100);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>Liquidity Spectrum</span>
          </h3>
          <p className="text-xs text-slate-400">Immediate access vs pending settlements vs locked FD capital</p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          High Liquidity Ratio
        </span>
      </div>

      {/* Progress Bar Spectrum */}
      <div className="space-y-2">
        <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-slate-800">
          <div style={{ width: `${availPct}%` }} className="bg-emerald-400 rounded-l-full h-full transition-all duration-500" title={`Available ${availPct}%`} />
          <div style={{ width: `${pendPct}%` }} className="bg-amber-400 h-full transition-all duration-500" title={`Pending ${pendPct}%`} />
          <div style={{ width: `${lockPct}%` }} className="bg-indigo-500 rounded-r-full h-full transition-all duration-500" title={`Locked ${lockPct}%`} />
        </div>
        <div className="flex justify-between text-[11px] text-slate-400 font-medium px-1">
          <span>Available ({availPct}%)</span>
          <span>Pending ({pendPct}%)</span>
          <span>Locked ({lockPct}%)</span>
        </div>
      </div>

      {/* Metrics Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3 text-emerald-400" /> Immediate
          </span>
          <p className="text-base font-extrabold text-slate-100">{formatCurrency(availNum, currency)}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" /> Pending Clearing
          </span>
          <p className="text-base font-extrabold text-slate-100">{formatCurrency(pendNum, currency)}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Lock className="w-3 h-3 text-indigo-400" /> Locked FDs
          </span>
          <p className="text-base font-extrabold text-slate-100">{formatCurrency(lockNum, currency)}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-teal-400" /> Emergency Reserve
          </span>
          <p className="text-base font-extrabold text-slate-100">{formatCurrency(parseFloat(emergency || "0"), currency)}</p>
        </div>
      </div>
    </div>
  );
};
