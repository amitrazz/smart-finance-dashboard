import React, { useState } from "react";

import { motion } from "framer-motion";
import { useInstitutions, useAccounts, useDeleteInstitution } from "../../../hooks/useFinanceQueries";
import { InstitutionCard } from "../components/InstitutionCard";
import { ConfirmModal } from "../../../components/common/ConfirmModal";
import { Building2, Plus } from "lucide-react";
import { FinancialInstitution } from "../../../types";

interface InstitutionsSubViewProps {
  onAddInstitution?: () => void;
}

export const InstitutionsSubView: React.FC<InstitutionsSubViewProps> = ({ onAddInstitution }) => {
  const { data: institutions = [], isLoading } = useInstitutions();
  const { data: accounts = [] } = useAccounts();
  const deleteInstitution = useDeleteInstitution();
  const [pendingDelete, setPendingDelete] = useState<FinancialInstitution | null>(null);

  const getAccountCount = (instId: string): number =>
    accounts.filter((a) => a.institutionId === instId || a.institution?.id === instId).length;

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    deleteInstitution.mutate(
      { id: pendingDelete.id },
      { onSuccess: () => setPendingDelete(null) },
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
        {Array(4).fill(null).map((_, i) => <div key={i} className="h-52 bg-slate-900/60 rounded-3xl border border-slate-800" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-indigo-400" />
          <div>
            <p className="font-bold text-slate-100">{institutions.length} Connected Institutions</p>
            <p className="text-xs text-slate-400">{accounts.length} total accounts across all institutions</p>
          </div>
        </div>
        <button
          onClick={onAddInstitution}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Institution</span>
        </button>
      </div>

      {institutions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {institutions.map((inst: FinancialInstitution, i) => (
            <motion.div key={inst.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <InstitutionCard
                institution={inst}
                accountCount={getAccountCount(inst.id)}
                onDelete={(inst) => setPendingDelete(inst)}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 space-y-4">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-300">No Institutions Connected</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">Connect your bank, brokerage, or credit institution to automatically sync accounts and balances.</p>
          <button onClick={onAddInstitution} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Institution</span>
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(pendingDelete)}
        title="Disconnect Institution"
        message={
          pendingDelete
            ? `Disconnect ${pendingDelete.name}? Accounts linked to this institution will remain, but automatic syncing will stop.`
            : ""
        }
        confirmText="Disconnect"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteInstitution.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
};
