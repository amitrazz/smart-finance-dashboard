import React from "react";
import {
  ArrowRightLeft,
  Plus,
  Upload,
  CheckCircle2,
  RefreshCw,
  Download,
} from "lucide-react";
import { Button, ButtonVariant } from "../../../components/ui/Button";

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
  const actions: Array<{
    label: string;
    icon: React.ReactNode;
    onClick?: () => void;
    variant: ButtonVariant;
    hierarchy: "filled" | "outline";
  }> = [
    { label: "Add Account", icon: <Plus className="w-4 h-4" />, onClick: onAddAccount, variant: "primary", hierarchy: "filled" },
    { label: "Transfer", icon: <ArrowRightLeft className="w-4 h-4" />, onClick: onTransfer, variant: "info", hierarchy: "outline" },
    { label: "Import Statement", icon: <Upload className="w-4 h-4" />, onClick: onImport, variant: "neutral", hierarchy: "outline" },
    { label: "Reconcile", icon: <CheckCircle2 className="w-4 h-4" />, onClick: onReconcile, variant: "success", hierarchy: "outline" },
    { label: "Export", icon: <Download className="w-4 h-4" />, onClick: onExport, variant: "neutral", hierarchy: "outline" },
    { label: "Refresh All", icon: <RefreshCw className="w-4 h-4" />, onClick: onRefresh, variant: "neutral", hierarchy: "outline" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action) => {
        const isDisabled = !action.onClick;
        return (
          <Button
            key={action.label}
            variant={action.variant}
            hierarchy={action.hierarchy}
            size="sm"
            leftIcon={action.icon}
            disabled={isDisabled}
            onClick={action.onClick}
            title={isDisabled ? `${action.label} isn't available yet — no backend endpoint exists` : action.label}
          >
            <span className="hidden sm:inline">{action.label}</span>
          </Button>
        );
      })}
    </div>
  );
};
