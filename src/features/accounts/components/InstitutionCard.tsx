import React from "react";

import { FinancialInstitution } from "../../../types";
import { StatusBadge } from "./StatusBadge";
import { Building2, RefreshCw, Trash2, CheckCircle2, ShieldAlert } from "lucide-react";

interface InstitutionCardProps {
  institution: FinancialInstitution;
  accountCount?: number;
  onSync?: (inst: FinancialInstitution) => void;
  onDelete?: (inst: FinancialInstitution) => void;
}

export const InstitutionCard: React.FC<InstitutionCardProps> = ({
  institution,
  accountCount = 1,
  onSync,
  onDelete,
}) => {
  const isHealthy = institution.status !== "ERROR" && institution.status !== "DISCONNECTED";

  return (
    <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 backdrop-blur-xl transition-all duration-200 flex flex-col justify-between space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/90 border border-slate-700/60 p-2.5 flex items-center justify-center shadow-inner">
            {institution.logoUrl ? (
              <img src={institution.logoUrl} alt={institution.name} className="w-full h-full object-contain" />
            ) : (
              <Building2 className="w-6 h-6 text-indigo-400" />
            )}
          </div>
          <div>
            <h4 className="font-bold text-slate-100 text-base">{institution.name}</h4>
            <p className="text-xs text-slate-400 font-medium">
              {accountCount} connected {accountCount === 1 ? "account" : "accounts"}
            </p>
          </div>
        </div>

        <StatusBadge status={isHealthy ? "SYNCED" : "WARNING"} size="sm" />
      </div>

      <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-950/50 border border-slate-800/60 text-xs">
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-semibold">Health Score</span>
          <span className="text-slate-200 font-bold flex items-center gap-1">
            {isHealthy ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 100% Healthy
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Needs Re-auth
              </>
            )}
          </span>
        </div>

        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-semibold">Connection Type</span>
          <span className="text-slate-300 font-medium">Direct Bank API</span>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
        <button
          onClick={() => onSync?.(institution)}
          disabled={!onSync}
          title={onSync ? "Sync Institution" : "Institution sync isn't available yet — no backend endpoint exists"}
          className={`text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            onSync ? "text-slate-300 hover:text-emerald-400" : "text-slate-600 cursor-not-allowed opacity-50"
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Institution</span>
        </button>

        <button
          onClick={() => onDelete?.(institution)}
          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Disconnect Institution"
          aria-label="Disconnect Institution"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
