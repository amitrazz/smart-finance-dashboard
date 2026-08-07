import React from "react";

import { motion } from "framer-motion";
import { useAccountStatements } from "../../../hooks/useFinanceQueries";
import { StatementTimeline } from "../components/StatementTimeline";
import { EmptyState } from "../../../components/common/EmptyState";
import { AccountStatementItem } from "../../../types";
import { FileText, Upload } from "lucide-react";
import type { ActiveRoute } from "../components/AccountsNavigation";
import { useUIStore } from "../../../store/useUIStore";

/** Map the route-level tab to a statement type filter */
const ROUTE_TO_TYPE: Partial<Record<ActiveRoute, string>> = {
  "statements-bank": "BANK",
  "statements-card": "CREDIT_CARD",
  "statements-imports": "IMPORTED",
};

interface StatementsSubViewProps {
  activeTab?: ActiveRoute;
}

export const StatementsSubView: React.FC<StatementsSubViewProps> = ({
  activeTab = "statements-overview",
}) => {
  const { data: statements = [], isLoading, isError } = useAccountStatements();

  const typeFilter = ROUTE_TO_TYPE[activeTab] ?? null;
  const filtered = typeFilter
    ? statements.filter((s: AccountStatementItem) => s.type === typeFilter)
    : statements;

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {Array(3)
          .fill(null)
          .map((_, i) => (
            <div key={i} className="h-20 bg-slate-900/60 rounded-2xl border border-slate-800" />
          ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={<FileText className="w-10 h-10 text-slate-600 mx-auto" aria-hidden="true" />}
        title="Statement Center Not Available"
        message="There is no backend endpoint that generates or aggregates account statements yet. You can still import a bank or card statement file directly."
        actionLabel="Import Statement"
        onAction={() => {
          useUIStore.getState().setImportModalOpen(true);
          useUIStore.getState().setActiveTab("imports");
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Statement Center
          </h3>
          <p className="text-xs text-slate-400">
            Bank, credit card, wallet, and investment account statements
          </p>
        </div>
        <button
          onClick={() => {
            useUIStore.getState().setImportModalOpen(true);
            useUIStore.getState().setActiveTab("imports");
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Upload className="w-4 h-4" />
          <span>Import Statement</span>
        </button>
      </div>

      {/* Statements */}
      {filtered.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <StatementTimeline statements={filtered} />
        </motion.div>
      ) : (
        <div className="text-center py-16 space-y-3">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No Statements Found</h3>
          <p className="text-sm text-slate-400">
            Import bank statements or connect accounts to fetch statements automatically.
          </p>
        </div>
      )}
    </div>
  );
};
