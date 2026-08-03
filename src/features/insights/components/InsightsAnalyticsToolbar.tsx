import React, { useState } from "react";
import { TimeHorizon } from "../types/insightsTypes";
import { Calendar, Download, RefreshCw, Landmark } from "lucide-react";
import { useAccounts } from "../../../hooks/useFinanceQueries";

interface InsightsAnalyticsToolbarProps {
  horizon?: TimeHorizon;
  onHorizonChange?: (horizon: TimeHorizon) => void;
  onExportPdf?: () => void;
  onRefresh?: () => void;
}

export const InsightsAnalyticsToolbar: React.FC<InsightsAnalyticsToolbarProps> = ({
  horizon = "1Y",
  onHorizonChange,
  onExportPdf,
  onRefresh,
}) => {
  const [selectedAccount, setSelectedAccount] = useState<string>("ALL");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("INR");
  const { data: accounts = [] } = useAccounts({ limit: 50 });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Account Selector */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <Landmark className="w-3.5 h-3.5 text-indigo-400" />
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-slate-900">All Accounts & Cards</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id} className="bg-slate-900">
                {account.institution?.name ? `${account.institution.name} • ${account.name}` : account.name}
              </option>
            ))}
          </select>
        </div>

        {/* Currency Selector */}
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <span className="text-slate-500 font-bold">Currency:</span>
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
          >
            <option value="INR" className="bg-slate-900">INR (₹)</option>
            <option value="USD" className="bg-slate-900">USD ($)</option>
            <option value="EUR" className="bg-slate-900">EUR (€)</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Date Horizon Pills */}
        {onHorizonChange && (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-indigo-400 ml-1.5" />
            {(["30D", "90D", "6M", "1Y", "3Y", "ALL"] as const).map((h) => (
              <button
                key={h}
                onClick={() => onHorizonChange(h)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  horizon === h
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        )}

        {/* Export Action */}
        {onExportPdf && (
          <button
            onClick={onExportPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Report</span>
          </button>
        )}

        {/* Refresh Action */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all"
            title="Refresh Analytics Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
