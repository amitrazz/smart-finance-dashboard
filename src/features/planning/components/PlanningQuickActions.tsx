import React from "react";
import { Target, Wallet, PiggyBank, ArrowRightLeft, Sliders, Download, RefreshCw } from "lucide-react";

interface PlanningQuickActionsProps {
  onCreateGoal?: () => void;
  onCreateBudget?: () => void;
  onAddContribution?: () => void;
  onTransferMoney?: () => void;
  onAdjustBudget?: () => void;
  onExport?: () => void;
  onRefresh?: () => void;
}

export const PlanningQuickActions: React.FC<PlanningQuickActionsProps> = ({
  onCreateGoal,
  onCreateBudget,
  onAddContribution,
  onTransferMoney,
  onAdjustBudget,
  onExport,
  onRefresh,
}) => {
  const actions = [
    { label: "Create Goal", icon: <Target className="w-4 h-4" />, onClick: onCreateGoal, accent: "text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30" },
    { label: "Create Budget", icon: <Wallet className="w-4 h-4" />, onClick: onCreateBudget, accent: "text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/30" },
    { label: "Add Contribution", icon: <PiggyBank className="w-4 h-4" />, onClick: onAddContribution, accent: "text-teal-400 hover:bg-teal-500/10 hover:border-teal-500/30" },
    { label: "Transfer Money", icon: <ArrowRightLeft className="w-4 h-4" />, onClick: onTransferMoney, accent: "text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/30" },
    { label: "Adjust Budget", icon: <Sliders className="w-4 h-4" />, onClick: onAdjustBudget, accent: "text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/30" },
    { label: "Export", icon: <Download className="w-4 h-4" />, onClick: onExport, accent: "text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/30" },
    { label: "Refresh", icon: <RefreshCw className="w-4 h-4" />, onClick: onRefresh, accent: "text-slate-400 hover:bg-slate-700/40 hover:border-slate-700/40" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold transition-all duration-200 ${action.accent}`}
          title={action.label}
        >
          {action.icon}
          <span className="hidden sm:inline">{action.label}</span>
        </button>
      ))}
    </div>
  );
};

export default PlanningQuickActions;
