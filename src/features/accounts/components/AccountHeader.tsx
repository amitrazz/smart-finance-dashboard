import React from "react";

import { Account } from "../../../types";
import { formatCurrency, formatLastSyncedAt } from "../../../utils/formatters";
import { StatusBadge } from "./StatusBadge";
import {
  Landmark, CreditCard, Wallet, ArrowRightLeft, FileText,
  Settings, ShieldCheck, TrendingUp, TrendingDown, ChevronLeft,
} from "lucide-react";

interface AccountHeaderProps {
  account: Account;
  income30d?: number;
  expenses30d?: number;
  onBack?: () => void;
  onTransfer?: () => void;
  onStatement?: () => void;
  onSettings?: () => void;
}

export const AccountHeader: React.FC<AccountHeaderProps> = ({
  account,
  income30d = 0,
  expenses30d = 0,
  onBack,
  onTransfer,
  onStatement,
  onSettings,
}) => {
  const balance = parseFloat(account.currentBalance?.amount || "0");
  const currency = account.currency || "INR";

  const getIcon = () => {
    switch (account.type) {
      case "CHECKING": case "SAVINGS": return <Landmark className="w-6 h-6 text-emerald-400" />;
      case "CREDIT_CARD": return <CreditCard className="w-6 h-6 text-purple-400" />;
      case "CASH": case "WALLET": return <Wallet className="w-6 h-6 text-amber-400" />;
      default: return <Landmark className="w-6 h-6 text-indigo-400" />;
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 backdrop-blur-xl space-y-6">
      {/* Glow BG */}
      <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl opacity-40 pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <div className="w-14 h-14 rounded-2xl bg-slate-800/90 border border-slate-700/60 flex items-center justify-center shadow-inner">
            {account.institution?.logoUrl ? (
              <img src={account.institution.logoUrl} alt={account.institution.name} className="w-10 h-10 object-contain rounded-xl" />
            ) : getIcon()}
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">{account.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-slate-400 font-medium">{account.institution?.name || "Independent"}</span>
              {account.maskedNumber && <span className="text-sm text-slate-500">• {account.maskedNumber}</span>}
              <StatusBadge status={account.status || "ACTIVE"} size="sm" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={onTransfer} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-colors shadow-lg shadow-emerald-500/20">
            <ArrowRightLeft className="w-4 h-4" />
            <span>Transfer</span>
          </button>
          <button onClick={onStatement} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors">
            <FileText className="w-4 h-4" />
            <span>Statement</span>
          </button>
          <button onClick={onSettings} className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Balance Row */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-1 space-y-1">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Current Balance</p>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            {formatCurrency(balance, currency)}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Last synced {formatLastSyncedAt(account.lastSyncedAt || account.updatedAt || new Date().toISOString())}</span>
          </div>
        </div>

        <div className="sm:col-span-2 grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> 30-Day Inflow
            </p>
            <p className="text-lg font-extrabold text-emerald-400">{formatCurrency(income30d, currency)}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1 mb-1">
              <TrendingDown className="w-3 h-3 text-rose-400" /> 30-Day Outflow
            </p>
            <p className="text-lg font-extrabold text-rose-400">{formatCurrency(expenses30d, currency)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
