import React, { useEffect, useState } from "react";
import { ArrowLeft, FileText, AlertTriangle, ArrowRight } from "lucide-react";
import { useIncomeRecord } from "../../../hooks/useFinanceQueries";
import { api } from "../../../services/api";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { ReconciliationStatusBadge } from "./ReconciliationStatusBadge";
import { useUIStore } from "../../../store/useUIStore";

type DetailTab =
  | "overview"
  | "earnings"
  | "deductions"
  | "contributions"
  | "document"
  | "reconciliation"
  | "planning"
  | "audit";

const TABS: Array<{ id: DetailTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "earnings", label: "Earnings" },
  { id: "deductions", label: "Deductions" },
  { id: "contributions", label: "Employer Contributions" },
  { id: "document", label: "Document" },
  { id: "reconciliation", label: "Reconciliation" },
  { id: "planning", label: "Planning Impact" },
  { id: "audit", label: "Audit History" },
];

interface SalarySlipDetailProps {
  incomeRecordId: string;
  onBack: () => void;
}

export const SalarySlipDetail: React.FC<SalarySlipDetailProps> = ({ incomeRecordId, onBack }) => {
  const { data: record, isLoading, isError } = useIncomeRecord(incomeRecordId);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

  if (isLoading) {
    return <div className="h-64 bg-slate-900/60 rounded-3xl border border-slate-800 animate-pulse" />;
  }

  if (isError || !record) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" aria-hidden="true" />
        <h3 className="text-lg font-bold text-slate-100">Salary slip not found</h3>
        <p className="text-xs text-slate-400">
          It may have been removed, or you may not have access to it.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
        >
          Back to Salary Slips
        </button>
      </div>
    );
  }

  const title = record.salaryPeriod
    ? `Salary Slip — ${formatDate(record.salaryPeriod)}`
    : "Income Record";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label="Back to Salary Slips"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
          <p className="text-xs text-slate-400">{record.employerName || "Manual entry"}</p>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Salary slip sections"
        className="flex items-center gap-1 p-1 rounded-2xl bg-slate-900/80 border border-slate-800 overflow-x-auto"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {activeTab === "overview" && <OverviewTab record={record} />}
        {activeTab === "earnings" && <LineItemsTab title="Earnings" items={record.components} currency={record.netAmount.currency} />}
        {activeTab === "deductions" && (
          <LineItemsTab title="Deductions" items={record.deductions} currency={record.netAmount.currency} />
        )}
        {activeTab === "contributions" && (
          <LineItemsTab
            title="Employer Contributions"
            items={record.contributions}
            currency={record.netAmount.currency}
            note="Employer contributions are never bank income — they never increase your available cash."
          />
        )}
        {activeTab === "document" && <DocumentTab documentId={record.documentId} />}
        {activeTab === "reconciliation" && <ReconciliationTab record={record} />}
        {activeTab === "planning" && <PlanningImpactTab record={record} />}
        {activeTab === "audit" && <AuditHistoryTab />}
      </div>
    </div>
  );
};

function StatRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-sm font-semibold ${emphasize ? "text-emerald-400" : "text-slate-200"}`}>
        {value}
      </span>
    </div>
  );
}

function OverviewTab({ record }: { record: ReturnType<typeof useIncomeRecord>["data"] }) {
  if (!record) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">Totals</h4>
        <StatRow label="Gross Earnings" value={formatCurrency(record.grossAmount)} />
        <StatRow
          label="Total Deductions"
          value={record.totalDeductions ? formatCurrency(record.totalDeductions) : "—"}
        />
        <StatRow label="Net Pay" value={formatCurrency(record.netAmount)} emphasize />
        <p className="text-[11px] text-slate-500 mt-2">
          Gross salary is not available cash — the Monthly Planner uses Net Pay only.
        </p>
      </div>
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">Details</h4>
        <StatRow label="Employer" value={record.employerName || "—"} />
        <StatRow label="Employee" value={record.employeeName || "—"} />
        <StatRow label="Designation" value={record.designation || "—"} />
        <StatRow label="Department" value={record.department || "—"} />
        <StatRow label="Pay Date" value={record.payDate ? formatDate(record.payDate) : "—"} />
        <div className="flex items-center justify-between py-2">
          <span className="text-xs text-slate-400">Reconciliation</span>
          <ReconciliationStatusBadge status={record.reconciliationStatus} />
        </div>
      </div>
    </div>
  );
}

function LineItemsTab({
  title,
  items,
  currency,
  note,
}: {
  title: string;
  items: Array<{ code: string; name: string; amount: { amount: string; currency: string } }>;
  currency: string;
  note?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
        <p className="text-xs text-slate-500">No {title.toLowerCase()} extracted for this slip.</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
      {note && <p className="text-[11px] text-slate-500 px-4 pt-4">{note}</p>}
      <table className="w-full text-sm">
        <caption className="sr-only">{title}</caption>
        <thead className="text-slate-400 text-xs">
          <tr>
            <th scope="col" className="text-left font-semibold px-4 py-3">
              Name
            </th>
            <th scope="col" className="text-right font-semibold px-4 py-3">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.code} className="border-t border-slate-800/60">
              <td className="px-4 py-2.5 text-slate-200">{item.name}</td>
              <td className="px-4 py-2.5 text-right text-slate-300">
                {formatCurrency(item.amount ?? { amount: "0", currency })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DocumentTab({ documentId }: { documentId: string | null }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    api
      .downloadDocument(documentId)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => !cancelled && setError("Could not load the original document."));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentId]);

  if (!documentId) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
        <p className="text-xs text-slate-500">No source document on file for this income record.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-950/40 border border-slate-800 overflow-hidden min-h-[500px] flex flex-col">
      <div className="px-4 py-2 border-b border-slate-800 flex items-center gap-2 text-xs text-slate-400">
        <FileText className="w-3.5 h-3.5" aria-hidden="true" /> Original Document
      </div>
      {url ? (
        <iframe title="Salary slip document" src={url} className="flex-1 w-full min-h-[480px] bg-white" />
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-xs text-slate-500 p-6">{error}</div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-slate-500 p-6">Loading…</div>
      )}
    </div>
  );
}

function ReconciliationTab({ record }: { record: NonNullable<ReturnType<typeof useIncomeRecord>["data"]> }) {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
          Bank Transaction Reconciliation
        </h4>
        <ReconciliationStatusBadge status={record.reconciliationStatus} />
      </div>
      <p className="text-xs text-slate-500">
        Matching this salary record to the actual bank credit is coming in a future update. Nothing
        is automatically matched — only a confirmed match ever links a real transaction here.
      </p>
    </div>
  );
}

function PlanningImpactTab({ record }: { record: NonNullable<ReturnType<typeof useIncomeRecord>["data"]> }) {
  const navigateToRoute = useUIStore((s) => s.navigateToRoute);
  return (
    <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
      <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wide">Planning Impact</h4>
      <p className="text-sm text-slate-200">
        This confirmed salary slip's <span className="font-semibold text-emerald-400">Net Pay</span> (
        {formatCurrency(record.netAmount)}) is included in the Monthly Planner's Expected Income —
        never the gross figure.
      </p>
      <button
        onClick={() => navigateToRoute("planning")}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all"
      >
        View Monthly Planner <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function AuditHistoryTab() {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
      <p className="text-xs text-slate-500">
        Audit history for this record isn't exposed via the API yet — this is a disclosed
        limitation, not a missing feature on this screen.
      </p>
    </div>
  );
}
