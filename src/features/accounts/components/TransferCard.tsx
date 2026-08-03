import React from "react";

import { AccountTransfer } from "../../../types";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { StatusBadge } from "./StatusBadge";
import { ArrowRight, ArrowRightLeft, Calendar, FileText } from "lucide-react";

interface TransferCardProps {
  transfer: AccountTransfer;
}

export const TransferCard: React.FC<TransferCardProps> = ({ transfer }) => {
  const amt = parseFloat(transfer.amount?.amount || "0");
  const formattedAmt = formatCurrency(amt, transfer.amount?.currency || "INR");

  return (
    <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 backdrop-blur-xl transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
          <ArrowRightLeft className="w-5 h-5" />
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap font-bold text-slate-100 text-sm">
            <span>{transfer.fromAccountName}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-emerald-400">{transfer.toAccountName}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {formatDate(transfer.transferDate || transfer.createdAt)}
            </span>
            {transfer.referenceId && <span className="text-slate-500">Ref: {transfer.referenceId}</span>}
          </div>

          {transfer.note && (
            <p className="text-xs text-slate-500 italic flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-600" />
              {transfer.note}
            </p>
          )}
        </div>
      </div>

      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
        <span className="font-extrabold text-base text-slate-100">{formattedAmt}</span>
        <StatusBadge status={transfer.status} size="sm" className="mt-1" />
      </div>
    </div>
  );
};
