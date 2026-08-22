import React, { useMemo, useState } from "react";
import { UploadCloud, FileText, AlertTriangle, RefreshCw } from "lucide-react";
import { useIncomeRecords } from "../../../hooks/useFinanceQueries";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { ReconciliationStatusBadge } from "./ReconciliationStatusBadge";
import { Button } from "../../../components/ui/Button";

interface SalarySlipListProps {
  onSelectRecord: (id: string) => void;
  onImport: () => void;
}

export const SalarySlipList: React.FC<SalarySlipListProps> = ({ onSelectRecord, onImport }) => {
  const { data: records = [], isLoading, isError, refetch } = useIncomeRecords();
  const [yearFilter, setYearFilter] = useState<string>("");
  const [employerFilter, setEmployerFilter] = useState<string>("");
  const [reconciliationFilter, setReconciliationFilter] = useState<string>("");

  // A "salary slip" is any IncomeRecord derived from an imported slip —
  // distinguished from a manually-recorded income entry by having a
  // salaryPeriod at all.
  const salarySlips = useMemo(() => records.filter((r) => Boolean(r.salaryPeriod)), [records]);

  const years = useMemo(
    () =>
      Array.from(
        new Set(
          salarySlips
            .map((r) => (r.salaryPeriod ? r.salaryPeriod.slice(0, 4) : null))
            .filter((y): y is string => Boolean(y)),
        ),
      ).sort((a, b) => b.localeCompare(a)),
    [salarySlips],
  );
  const employers = useMemo(
    () =>
      Array.from(
        new Set(salarySlips.map((r) => r.employerName).filter((name): name is string => Boolean(name))),
      ).sort(),
    [salarySlips],
  );

  const filtered = useMemo(() => {
    return salarySlips.filter((r) => {
      if (yearFilter && !r.salaryPeriod?.startsWith(yearFilter)) return false;
      if (employerFilter && r.employerName !== employerFilter) return false;
      if (reconciliationFilter && r.reconciliationStatus !== reconciliationFilter) return false;
      return true;
    });
  }, [salarySlips, yearFilter, employerFilter, reconciliationFilter]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3" />
        <div className="h-64 bg-slate-900/60 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" aria-hidden="true" />
        <h3 className="text-lg font-bold text-slate-100">Failed to Load Salary Slips</h3>
        <Button onClick={() => refetch()} variant="neutral" leftIcon={<RefreshCw className="w-4 h-4" />}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Salary Slips</h2>
          <p className="text-xs text-slate-400">
            Uploaded and confirmed salary slips — net pay from these feeds Monthly Planner's
            expected income.
          </p>
        </div>
        <Button onClick={onImport} leftIcon={<UploadCloud className="w-4 h-4" />}>
          Import Salary Slip
        </Button>
      </div>

      {salarySlips.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Filter by year"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
          >
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by employer"
            value={employerFilter}
            onChange={(e) => setEmployerFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
          >
            <option value="">All employers</option>
            {employers.map((e) => (
              <option key={e as string} value={e as string}>
                {e}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by reconciliation status"
            value={reconciliationFilter}
            onChange={(e) => setReconciliationFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
          >
            <option value="">Any reconciliation status</option>
            <option value="MATCHED">Matched</option>
            <option value="SUGGESTED">Suggested Match</option>
            <option value="UNMATCHED">Unmatched</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="p-10 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" aria-hidden="true" />
          <p className="text-sm text-slate-400">
            {salarySlips.length === 0
              ? "No salary slips imported yet."
              : "No salary slips match these filters."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-800">
          <table className="w-full text-sm">
            <caption className="sr-only">Confirmed salary slips</caption>
            <thead className="bg-slate-900/80 text-slate-400 text-xs">
              <tr>
                <th scope="col" className="text-left font-semibold px-4 py-3">
                  Period
                </th>
                <th scope="col" className="text-left font-semibold px-4 py-3">
                  Employer
                </th>
                <th scope="col" className="text-right font-semibold px-4 py-3">
                  Gross
                </th>
                <th scope="col" className="text-right font-semibold px-4 py-3">
                  Net Pay
                </th>
                <th scope="col" className="text-left font-semibold px-4 py-3">
                  Status
                </th>
                <th scope="col" className="text-left font-semibold px-4 py-3">
                  Reconciliation
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr
                  key={record.id}
                  className="border-t border-slate-800 bg-slate-950/40 hover:bg-slate-900 transition-colors"
                >
                  <td className="px-0 py-0 text-slate-200">
                    <button
                      onClick={() => onSelectRecord(record.id)}
                      aria-label={`View salary slip for ${record.employerName || "Unknown employer"}, ${
                        record.salaryPeriod ? formatDate(record.salaryPeriod) : ""
                      }`}
                      className="w-full text-left px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
                    >
                      {record.salaryPeriod ? formatDate(record.salaryPeriod) : "—"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{record.employerName || "—"}</td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {formatCurrency(record.grossAmount)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                    {formatCurrency(record.netAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">
                      Confirmed
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ReconciliationStatusBadge status={record.reconciliationStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
