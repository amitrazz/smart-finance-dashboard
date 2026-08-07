import React from "react";

import { Account } from "../../../types";
import { formatCurrency, formatLastSyncedAt } from "../../../utils/formatters";
import { StatusBadge } from "./StatusBadge";
import { Landmark, CreditCard, Wallet, ArrowUpRight, ShieldCheck, FileText, ArrowRightLeft } from "lucide-react";

interface AccountCardProps {
  account: Account;
  onViewDetails?: (account: Account) => void;
  onTransfer?: (account: Account) => void;
  onStatement?: (account: Account) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onViewDetails,
  onTransfer,
  onStatement,
}) => {
  const getAccountIcon = () => {
    switch (account.type) {
      case "CHECKING":
      case "SAVINGS":
        return <Landmark className="w-5 h-5 text-emerald-400" />;
      case "CREDIT_CARD":
        return <CreditCard className="w-5 h-5 text-purple-400" />;
      case "CASH":
      case "WALLET":
        return <Wallet className="w-5 h-5 text-amber-400" />;
      default:
        return <Landmark className="w-5 h-5 text-indigo-400" />;
    }
  };

  const currBalance = parseFloat(account.currentBalance?.amount || "0");
  const formattedBalance = formatCurrency(currBalance, account.currency || "INR");

  return (
    <div
      onClick={() => onViewDetails?.(account)}
      className="group relative bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-6 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Card Header: Institution Logo + Account Name + Status */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-800/90 border border-slate-700/60 flex items-center justify-center p-2 shadow-inner group-hover:scale-105 transition-transform duration-200">
              {account.institution?.logoUrl ? (
                <img
                  src={account.institution.logoUrl}
                  alt={account.institution.name}
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                getAccountIcon()
              )}
            </div>

            <div>
              <h4 className="font-bold text-slate-100 text-base group-hover:text-emerald-400 transition-colors line-clamp-1">
                {account.name}
              </h4>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <span>{account.institution?.name || "Bank Account"}</span>
                {account.maskedNumber && <span className="text-slate-500">• {account.maskedNumber}</span>}
              </p>
            </div>
          </div>

          <StatusBadge status={account.status || "ACTIVE"} size="sm" />
        </div>

        {/* Balance Display */}
        <div className="my-5 space-y-1">
          <p className="text-xs text-slate-400 font-medium">Current Balance</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            {formattedBalance}
          </h3>
          <p className="text-xs text-slate-500 font-normal">
            Available: <span className="text-slate-300 font-semibold">{formattedBalance}</span>
          </p>
        </div>
      </div>

      {/* Footer Info & Actions */}
      <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between">
        <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Synced {formatLastSyncedAt(account.lastSyncedAt || account.updatedAt || new Date().toISOString())}</span>
        </div>

        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
          {onTransfer && (
            <button
              title="Transfer Money"
              aria-label="Transfer Money"
              onClick={(e) => {
                e.stopPropagation();
                onTransfer(account);
              }}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-emerald-400 transition-colors"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          )}

          {onStatement && (
            <button
              title="View Statement"
              aria-label="View Statement"
              onClick={(e) => {
                e.stopPropagation();
                onStatement(account);
              }}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-emerald-400 transition-colors"
            >
              <FileText className="w-4 h-4" />
            </button>
          )}

          <button
            title="Open Account Workspace"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails?.(account);
            }}
            className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors flex items-center gap-1 text-xs font-bold"
          >
            <span>Workspace</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
