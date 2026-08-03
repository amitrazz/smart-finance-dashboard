import React from "react";

import { motion } from "framer-motion";
import { useReconciliation, useBulkReconcile } from "../../../hooks/useFinanceQueries";
import { ReconciliationTable } from "../components/ReconciliationTable";
import { ReconciliationItem } from "../../../types";
import { CheckCircle2, AlertTriangle, Clock, XCircle } from "lucide-react";

export const ReconciliationView: React.FC = () => {
  const { data: items = [], isLoading } = useReconciliation();
  const bulkReconcile = useBulkReconcile();

  const matched = items.filter((i: ReconciliationItem) => i.status === "MATCHED").length;
  const pending = items.filter((i: ReconciliationItem) => i.status === "PENDING").length;
  const exceptions = items.filter((i: ReconciliationItem) => ["EXCEPTION", "EXCEPTIONS"].includes(i.status)).length;
  const unmatched = items.filter((i: ReconciliationItem) => i.status === "UNMATCHED").length;

  if (isLoading) {
    return <div className="h-96 bg-slate-900/60 rounded-3xl border border-slate-800 animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Matched", count: matched, icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />, style: "border-emerald-500/20 bg-emerald-500/5" },
          { label: "Pending Review", count: pending, icon: <Clock className="w-5 h-5 text-amber-400" />, style: "border-amber-500/20 bg-amber-500/5" },
          { label: "Exceptions", count: exceptions, icon: <AlertTriangle className="w-5 h-5 text-rose-400" />, style: "border-rose-500/20 bg-rose-500/5" },
          { label: "Unmatched", count: unmatched, icon: <XCircle className="w-5 h-5 text-slate-400" />, style: "border-slate-700 bg-slate-800/40" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 rounded-2xl border ${stat.style} space-y-2`}
          >
            {stat.icon}
            <p className="text-2xl font-extrabold text-slate-100">{stat.count}</p>
            <p className="text-xs text-slate-400 font-semibold">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Reconciliation Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <ReconciliationTable
          items={items}
          onBulkAction={(ids, action) => bulkReconcile.mutate({ ids, action })}
          onReconcileSingle={(item) => {
            console.log("Reconcile single:", item.id);
          }}
        />
      </motion.div>
    </div>
  );
};
