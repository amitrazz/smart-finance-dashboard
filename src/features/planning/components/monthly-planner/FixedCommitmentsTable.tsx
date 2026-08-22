import React from "react";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import { EmptyState } from "../../../../components/common/EmptyState";
import { formatCurrency, formatDate } from "../../../../utils/formatters";
import { MonthlyFixedCommitments } from "../../../../types";
import { obligationStatusLabel, obligationStatusToBadge } from "./monthlyPlanner.utils";

interface FixedCommitmentsTableProps {
  fixedCommitments: MonthlyFixedCommitments;
}

/** Spec §8 — rent/EMIs/bills/subscriptions/insurance/other recurring obligations. Rows are non-interactive: this app has no live per-item detail page for recurring obligations yet (known limitation, not a broken link). */
export const FixedCommitmentsTable: React.FC<FixedCommitmentsTableProps> = ({ fixedCommitments }) => {
  const items = fixedCommitments.items;

  return (
    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-bold text-slate-100">Fixed Commitments</h3>
        <div className="text-xs text-slate-400">
          Planned <span className="font-semibold text-slate-200">{formatCurrency(fixedCommitments.planned)}</span>
          {fixedCommitments.actual && (
            <>
              {" · "}Actual <span className="font-semibold text-slate-200">{formatCurrency(fixedCommitments.actual)}</span>
            </>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState title="No Recurring Commitments Found" message="Rent, EMIs, bills, and subscriptions detected from your transactions will show up here." />
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden sm:block rounded-2xl border border-slate-800 overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase bg-slate-950/40">
                  <th scope="col" className="py-2.5 px-4">Description</th>
                  <th scope="col" className="py-2.5 px-4">Due Date</th>
                  <th scope="col" className="py-2.5 px-4 text-right">Planned</th>
                  <th scope="col" className="py-2.5 px-4 text-right">Actual</th>
                  <th scope="col" className="py-2.5 px-4 text-right">Variance</th>
                  <th scope="col" className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 px-4 font-semibold text-slate-100">{item.description}</td>
                    <td className="py-3 px-4 text-slate-400">{item.dueDate ? formatDate(item.dueDate) : "—"}</td>
                    <td className="py-3 px-4 text-right text-slate-200">{formatCurrency(item.expectedAmount)}</td>
                    <td className="py-3 px-4 text-right text-slate-400">—</td>
                    <td className="py-3 px-4 text-right text-slate-400">—</td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        status={obligationStatusToBadge(item.status)}
                        label={obligationStatusLabel(item.status)}
                        size="sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="sm:hidden space-y-2">
            {items.map((item) => (
              <div key={item.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-100 text-sm truncate">{item.description}</span>
                  <StatusBadge status={obligationStatusToBadge(item.status)} label={obligationStatusLabel(item.status)} size="sm" />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{item.dueDate ? formatDate(item.dueDate) : "No due date"}</span>
                  <span className="font-semibold text-slate-200">{formatCurrency(item.expectedAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default FixedCommitmentsTable;
