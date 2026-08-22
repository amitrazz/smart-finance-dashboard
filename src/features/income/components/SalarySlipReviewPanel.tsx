import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { api } from "../../../services/api";
import { useImportJob, useUpdateImportRow, useCommitImport } from "../../../hooks/useFinanceQueries";
import {
  ImportRowStaging,
  NormalizedSalarySlipRowData,
  SalarySlipEarning,
  SalarySlipDeduction,
  SalarySlipContribution,
} from "../../../types";
import { formatCurrency } from "../../../utils/formatters";
import { confidenceLevel } from "../utils/confidence";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { Button } from "../../../components/ui/Button";
import { useUIStore } from "../../../store/useUIStore";

interface SalarySlipReviewPanelProps {
  jobId: string;
  row: ImportRowStaging;
  salaryData: NormalizedSalarySlipRowData;
  confidenceScore: string | null;
  onConfirmed: (incomeRecordId: string) => void;
  onFailed: (message: string) => void;
}

function FieldRow({
  label,
  value,
  onChange,
  type = "text",
  present,
  documentConfidence,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  present: boolean;
  documentConfidence: ReturnType<typeof confidenceLevel>;
}) {
  // A present field shows the real document-level confidence bucket; an
  // absent one shows "Not detected" — see this file's top-level doc comment
  // for why there is no true per-field confidence to show instead.
  const level = present ? documentConfidence : "not-detected";
  const inputId = `salary-field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
      <div>
        <label htmlFor={inputId} className="block text-[11px] text-slate-400 mb-1">
          {label}
        </label>
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
        />
      </div>
      <div className="pt-5">
        <ConfidenceBadge level={level} />
      </div>
    </div>
  );
}

/**
 * Extraction-confidence display is honest about a real backend limitation:
 * only a single document-level confidence score exists today (no per-field
 * confidence is returned by any API) — see docs/24-salary-slip-import.md
 * ("Backend Issues Found" in the frontend delivery report). Every present
 * field shows that one real document-level bucket; an absent field shows
 * "Not detected", which genuinely is field-specific information (its
 * presence/absence, unlike its confidence, is known).
 */
export const SalarySlipReviewPanel: React.FC<SalarySlipReviewPanelProps> = ({
  jobId,
  row,
  salaryData,
  confidenceScore,
  onConfirmed,
  onFailed,
}) => {
  const { data: job } = useImportJob(jobId);
  const updateRowMutation = useUpdateImportRow();
  const commitMutation = useCommitImport();
  const [isConfirming, setIsConfirming] = useState(false);

  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);

  useEffect(() => {
    if (!job?.documentId) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    api
      .downloadDocument(job.documentId)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setDocumentUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setDocumentError("Could not load the original document.");
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [job?.documentId]);

  const [employerName, setEmployerName] = useState(salaryData.employerName ?? "");
  const [employeeName, setEmployeeName] = useState(salaryData.employeeName ?? "");
  const [designation, setDesignation] = useState(salaryData.designation ?? "");
  const [department, setDepartment] = useState(salaryData.department ?? "");
  const [salaryPeriod, setSalaryPeriod] = useState(salaryData.salaryPeriod ?? "");
  const [payDate, setPayDate] = useState(salaryData.payDate ?? "");
  const [grossEarnings, setGrossEarnings] = useState(salaryData.grossEarnings ?? "");
  const [totalDeductions, setTotalDeductions] = useState(salaryData.totalDeductions ?? "");
  const [netPay, setNetPay] = useState(salaryData.netPay ?? "");
  const [earnings, setEarnings] = useState<SalarySlipEarning[]>(salaryData.earnings);
  const [deductions, setDeductions] = useState<SalarySlipDeduction[]>(salaryData.deductions);
  const [contributions, setContributions] = useState<SalarySlipContribution[]>(
    salaryData.employerContributions,
  );

  const currency = salaryData.currency || "INR";
  const overallConfidence = confidenceLevel(confidenceScore);

  const invariantMismatch = !salaryData.invariantCheck.withinTolerance;

  const isDirty = useMemo(() => {
    return (
      employerName !== (salaryData.employerName ?? "") ||
      employeeName !== (salaryData.employeeName ?? "") ||
      designation !== (salaryData.designation ?? "") ||
      department !== (salaryData.department ?? "") ||
      salaryPeriod !== (salaryData.salaryPeriod ?? "") ||
      payDate !== (salaryData.payDate ?? "") ||
      grossEarnings !== (salaryData.grossEarnings ?? "") ||
      totalDeductions !== (salaryData.totalDeductions ?? "") ||
      netPay !== (salaryData.netPay ?? "") ||
      JSON.stringify(earnings) !== JSON.stringify(salaryData.earnings) ||
      JSON.stringify(deductions) !== JSON.stringify(salaryData.deductions) ||
      JSON.stringify(contributions) !== JSON.stringify(salaryData.employerContributions)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    employerName,
    employeeName,
    designation,
    department,
    salaryPeriod,
    payDate,
    grossEarnings,
    totalDeductions,
    netPay,
    earnings,
    deductions,
    contributions,
  ]);

  const updateLineItem = <T extends { name: string; amount: string }>(
    list: T[],
    setList: (v: T[]) => void,
    index: number,
    patch: Partial<T>,
  ) => {
    setList(list.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      const needsRowUpdate = isDirty || row.status === "NEEDS_REVIEW";
      if (needsRowUpdate) {
        await updateRowMutation.mutateAsync({
          jobId,
          rowId: row.id,
          silent: true,
          data: {
            confirmNotDuplicate: true,
            salarySlip: {
              employerName: employerName || undefined,
              employeeName: employeeName || undefined,
              designation: designation || undefined,
              department: department || undefined,
              salaryPeriod: salaryPeriod || undefined,
              payDate: payDate || undefined,
              grossEarnings: grossEarnings || undefined,
              totalDeductions: totalDeductions || undefined,
              netPay: netPay || undefined,
              earnings,
              deductions,
              employerContributions: contributions,
            },
          },
        });
      }

      await commitMutation.mutateAsync(jobId);

      // The commit response is the ImportJob, not per-row provenance — read
      // the freshly-committed row back to get the new IncomeRecord's id.
      const preview = await api.getImportPreview(jobId, { limit: 1 });
      const rows = Array.isArray(preview) ? preview : preview.data;
      const committedId = rows?.[0]?.committedEntityId;
      if (committedId) {
        onConfirmed(committedId);
      } else {
        useUIStore
          .getState()
          .showToast("Confirmed, but couldn't determine the new record's id.", "info");
      }
    } catch (err) {
      const message =
        err !== null && typeof err === "object" && "userMessage" in err
          ? String((err as { userMessage: unknown }).userMessage)
          : "Failed to confirm this salary slip.";
      onFailed(message);
    } finally {
      setIsConfirming(false);
    }
  };

  const isBusy = isConfirming || updateRowMutation.isPending || commitMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-100">Review Extracted Salary</h3>
        <ConfidenceBadge level={overallConfidence} />
      </div>

      {invariantMismatch && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-rose-300">
              The extracted salary totals do not reconcile.
            </p>
            <p className="text-xs text-rose-400/80 mt-1">
              Please review the highlighted Gross / Deductions / Net Pay fields below and correct
              them if needed.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document preview */}
        <div className="rounded-2xl bg-slate-950/40 border border-slate-800 overflow-hidden min-h-[420px] flex flex-col">
          <div className="px-4 py-2 border-b border-slate-800 flex items-center gap-2 text-xs text-slate-400">
            <FileText className="w-3.5 h-3.5" aria-hidden="true" /> Salary Slip Document
          </div>
          {documentUrl ? (
            <iframe
              title="Salary slip document preview"
              src={documentUrl}
              className="flex-1 w-full min-h-[400px] bg-white"
            />
          ) : documentError ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-500 p-6 text-center">
              {documentError}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-500 p-6">
              Loading document…
            </div>
          )}
        </div>

        {/* Extracted fields */}
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldRow
              label="Employer"
              value={employerName}
              onChange={setEmployerName}
              present={Boolean(salaryData.employerName)}
            documentConfidence={overallConfidence}
            />
            <FieldRow
              label="Employee Name"
              value={employeeName}
              onChange={setEmployeeName}
              present={Boolean(salaryData.employeeName)}
            documentConfidence={overallConfidence}
            />
            <FieldRow
              label="Designation"
              value={designation}
              onChange={setDesignation}
              present={Boolean(salaryData.designation)}
            documentConfidence={overallConfidence}
            />
            <FieldRow
              label="Department"
              value={department}
              onChange={setDepartment}
              present={Boolean(salaryData.department)}
            documentConfidence={overallConfidence}
            />
            <FieldRow
              label="Salary Period"
              type="date"
              value={salaryPeriod}
              onChange={setSalaryPeriod}
              present={Boolean(salaryData.salaryPeriod)}
            documentConfidence={overallConfidence}
            />
            <FieldRow
              label="Pay Date"
              type="date"
              value={payDate}
              onChange={setPayDate}
              present={Boolean(salaryData.payDate)}
            documentConfidence={overallConfidence}
            />
          </div>

          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Totals</h4>
            <div className={`grid grid-cols-3 gap-3 ${invariantMismatch ? "ring-1 ring-rose-500/40 rounded-xl p-2" : ""}`}>
              <FieldRow
                label="Gross Earnings"
                value={grossEarnings}
                onChange={setGrossEarnings}
                present={Boolean(salaryData.grossEarnings)}
              documentConfidence={overallConfidence}
              />
              <FieldRow
                label="Total Deductions"
                value={totalDeductions}
                onChange={setTotalDeductions}
                present={Boolean(salaryData.totalDeductions)}
              documentConfidence={overallConfidence}
              />
              <FieldRow
                label="Net Pay"
                value={netPay}
                onChange={setNetPay}
                present={Boolean(salaryData.netPay)}
              documentConfidence={overallConfidence}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Gross salary is not available cash — the Monthly Planner uses{" "}
              <span className="text-emerald-400 font-semibold">Net Pay</span> only.
            </p>
          </div>

          <LineItemSection
            title="Earnings"
            items={earnings}
            onChange={(i, patch) => updateLineItem(earnings, setEarnings, i, patch)}
            currency={currency}
          />
          <LineItemSection
            title="Deductions"
            items={deductions}
            onChange={(i, patch) => updateLineItem(deductions, setDeductions, i, patch)}
            currency={currency}
          />
          <LineItemSection
            title="Employer Contributions"
            items={contributions}
            onChange={(i, patch) => updateLineItem(contributions, setContributions, i, patch)}
            currency={currency}
            note="Not bank income — never counted as available cash."
          />

          <Button
            onClick={handleConfirm}
            disabled={isBusy}
            fullWidth
            size="lg"
            leftIcon={isBusy ? undefined : <CheckCircle2 className="w-4 h-4" />}
            isLoading={isBusy}
            loadingText="Confirming…"
          >
            Confirm Salary Slip
          </Button>
          <p className="text-[11px] text-slate-500 text-center">
            Confirming makes this salary available as expected income for financial planning. It
            will not create a bank transaction.
          </p>
        </div>
      </div>
    </div>
  );
};

function LineItemSection<T extends { code: string; name: string; amount: string }>({
  title,
  items,
  onChange,
  currency,
  note,
}: {
  title: string;
  items: T[];
  onChange: (index: number, patch: Partial<T>) => void;
  currency: string;
  note?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">{title}</h4>
        <p className="text-xs text-slate-500">None extracted.</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-2">
      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">{title}</h4>
      {note && <p className="text-[11px] text-slate-500">{note}</p>}
      <table className="w-full text-xs">
        <caption className="sr-only">{title} breakdown</caption>
        <thead>
          <tr className="text-left text-slate-500">
            <th scope="col" className="font-medium pb-1">
              Name
            </th>
            <th scope="col" className="font-medium pb-1 text-right">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={`${item.code}-${i}`} className="border-t border-slate-800/60">
              <td className="py-1.5 pr-2">
                <input
                  value={item.name}
                  onChange={(e) => onChange(i, { name: e.target.value } as Partial<T>)}
                  className="w-full bg-transparent text-slate-200 focus:outline-none focus:text-emerald-400"
                  aria-label={`${title} item ${i + 1} name`}
                />
              </td>
              <td className="py-1.5 text-right">
                <input
                  value={item.amount}
                  onChange={(e) => onChange(i, { amount: e.target.value } as Partial<T>)}
                  className="w-28 bg-transparent text-right text-slate-200 focus:outline-none focus:text-emerald-400"
                  aria-label={`${title} item ${i + 1} amount`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="sr-only">
        {items
          .map((i) => `${i.name}: ${formatCurrency({ amount: i.amount, currency }, "en-IN")}`)
          .join(", ")}
      </p>
    </div>
  );
}
