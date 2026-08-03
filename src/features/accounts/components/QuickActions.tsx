import React from "react";

import {
  ArrowRightLeft,
  Plus,
  Upload,
  CheckCircle2,
  RefreshCw,
  Download,
} from "lucide-react";

interface QuickActionsProps {
  onTransfer?: () => void;
  onAddAccount?: () => void;
  onImport?: () => void;
  onReconcile?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onTransfer,
  onAddAccount,
  onImport,
  onReconcile,
  onRefresh,
  onExport,
}) => {
  const actions = [
    { label: "Transfer", icon: <ArrowRightLeft className="w-4 h-4" />, onClick: onTransfer, accent: "text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30" },
    { label: "Add Account", icon: <Plus className="w-4 h-4" />, onClick: onAddAccount, accent: "text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/30" },
    { label: "Import Statement", icon: <Upload className="w-4 h-4" />, onClick: onImport, accent: "text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/30" },
    { label: "Reconcile", icon: <CheckCircle2 className="w-4 h-4" />, onClick: onReconcile, accent: "text-teal-400 hover:bg-teal-500/10 hover:border-teal-500/30" },
    { label: "Export", icon: <Download className="w-4 h-4" />, onClick: onExport, accent: "text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/30" },
    { label: "Refresh All", icon: <RefreshCw className="w-4 h-4" />, onClick: onRefresh, accent: "text-slate-400 hover:bg-slate-700/40 hover:border-slate-700/40" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action) => {
        const isDisabled = !action.onClick;
        return (
          <button
            key={action.label}
            onClick={action.onClick}
            disabled={isDisabled}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold transition-all duration-200 ${
              isDisabled ? "text-slate-600 cursor-not-allowed opacity-50" : action.accent
            }`}
            title={isDisabled ? `${action.label} isn't available yet — no backend endpoint exists` : action.label}
          >
            {action.icon}
            <span className="hidden sm:inline">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
};
