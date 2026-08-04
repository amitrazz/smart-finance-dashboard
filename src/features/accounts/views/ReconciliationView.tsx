import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  EyeOff,
  ListChecks,
  RefreshCw,
  ShieldCheck,
  Undo2,
} from "lucide-react";
import {
  useAccounts,
  useCompleteReconciliation,
  useReconciliationSummary,
  useRunReconciliationAutoMatch,
  useStatementLinesInfinite,
  useTransaction,
  useUnmatchStatementLine,
} from "../../../hooks/useFinanceQueries";
import { StatementLine, StatementLineStatus } from "../../../types";
import { Money } from "../../../components/common/Money";
import { MetricCard } from "../../../components/common/MetricCard";
import { formatDate } from "../../../utils/formatters";
import { EmptyState } from "../../../components/common/EmptyState";
import { ResolveStatementLineModal } from "../components/reconciliation/ResolveStatementLineModal";
import { SuggestionActions } from "../components/reconciliation/SuggestionActions";

const STATUS_FILTERS: { id: StatementLineStatus | "ALL"; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "UNMATCHED", label: "Unmatched" },
  { id: "SUGGESTED", label: "Suggested" },
  { id: "DUPLICATE", label: "Possible Duplicate" },
  { id: "MATCHED", label: "Matched" },
  { id: "IGNORED", label: "Ignored" },
];

const STATUS_BADGE: Record<StatementLineStatus, string> = {
  UNMATCHED: "bg-slate-800 text-slate-300 border-slate-700",
  SUGGESTED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  MATCHED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  DUPLICATE: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  IGNORED: "bg-slate-800/60 text-slate-500 border-slate-800",
};

const MatchedTransactionLabel: React.FC<{ transactionId: string }> = ({ transactionId }) => {
  const { data: transaction, isLoading } = useTransaction(transactionId);
  if (isLoading) return <span className="text-slate-600">Loading…</span>;
  return <span className="text-emerald-300">{transaction?.description || "Matched transaction"}</span>;
};

const StatementLineRow: React.FC<{
  line: StatementLine;
  onResolve: (line: StatementLine) => void;
}> = ({ line, onResolve }) => {
  const unmatchMutation = useUnmatchStatementLine();

  return (
    <tr className="hover:bg-slate-800/30">
      <td className="p-3 text-xs text-slate-300 font-mono whitespace-nowrap">
        {formatDate(line.transactionDate)}
      </td>
      <td className="p-3 max-w-xs">
        <p className="font-semibold text-slate-100 truncate">{line.description}</p>
        {line.status === "MATCHED" && line.matchedTransactionId && (
          <p className="text-[11px] truncate">
            Matched to <MatchedTransactionLabel transactionId={line.matchedTransactionId} />
          </p>
        )}
        {line.referenceNumber && (
          <p className="text-[10px] text-slate-500 font-mono truncate">Ref: {line.referenceNumber}</p>
        )}
      </td>
      <td className="p-3 text-xs font-bold whitespace-nowrap">
        <span className={line.direction === "OUTFLOW" ? "text-rose-400" : "text-emerald-400"}>
          {line.direction === "OUTFLOW" ? "−" : "+"}
          <Money value={line.amount} />
        </span>
      </td>
      <td className="p-3">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE[line.status]}`}
        >
          {line.status === "DUPLICATE" && <Copy className="w-3 h-3" />}
          {line.status}
        </span>
        {line.confidenceScore !== null && line.status !== "SUGGESTED" && (
          <p className="mt-1 text-[10px] text-slate-500">{line.confidenceScore}% confidence</p>
        )}
      </td>
      <td className="p-3">
        {(line.status === "UNMATCHED" || line.status === "DUPLICATE") && (
          <button
            onClick={() => onResolve(line)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-[11px] font-semibold transition-all"
          >
            Review
          </button>
        )}
        {line.status === "SUGGESTED" && <SuggestionActions statementLineId={line.id} />}
        {line.status === "MATCHED" && (
          <button
            onClick={() => unmatchMutation.mutate({ id: line.id, version: line.version })}
            disabled={unmatchMutation.isPending}
            title="Undo this match"
            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 disabled:opacity-40"
          >
            {unmatchMutation.isPending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Undo2 className="w-3.5 h-3.5" />
            )}
          </button>
        )}
        {line.status === "IGNORED" && (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
            <EyeOff className="w-3.5 h-3.5" /> Ignored{line.ignoredAt ? ` ${formatDate(line.ignoredAt)}` : ""}
          </span>
        )}
      </td>
    </tr>
  );
};

export const ReconciliationView: React.FC = () => {
  const { data: accounts = [] } = useAccounts();
  const [accountId, setAccountId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatementLineStatus | "ALL">("ALL");
  const [resolvingLine, setResolvingLine] = useState<StatementLine | null>(null);

  const summaryParams = accountId ? { accountId } : undefined;
  const { data: summary, isLoading: summaryLoading } = useReconciliationSummary(summaryParams);

  const listParams = useMemo(
    () => ({
      accountId: accountId || undefined,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      limit: 25,
    }),
    [accountId, statusFilter],
  );

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useStatementLinesInfinite(listParams);

  const lines = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

  const autoMatchMutation = useRunReconciliationAutoMatch();
  const completeMutation = useCompleteReconciliation();

  const pendingCount = summary ? summary.unmatched + summary.suggested + summary.duplicates : 0;

  return (
    <div className="space-y-6">
      {/* Summary Strip */}
      {summaryLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array(5)
            .fill(null)
            .map((_, i) => (
              <div key={i} className="h-28 bg-slate-900/60 rounded-2xl border border-slate-800 animate-pulse" />
            ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Reconciled"
            value={`${summary.reconciliationPercent.toFixed(1)}%`}
            subtitle={`${summary.matched}/${summary.importedLines} lines`}
            icon={<ShieldCheck className="w-5 h-5" />}
            accentColor="emerald"
            progressPercent={summary.reconciliationPercent}
          />
          <MetricCard
            title="Needs Review"
            value={String(summary.needsReview)}
            icon={<AlertTriangle className="w-5 h-5" />}
            accentColor="amber"
          />
          <MetricCard
            title="Suggested"
            value={String(summary.suggested)}
            icon={<ListChecks className="w-5 h-5" />}
            accentColor="sky"
          />
          <MetricCard
            title="Duplicates"
            value={String(summary.duplicates)}
            icon={<Copy className="w-5 h-5" />}
            accentColor="rose"
          />
          <MetricCard
            title="Unmatched Difference"
            value={{ amount: summary.totalDifference, currency: "INR" }}
            subtitle={`${summary.unmatched} unmatched lines`}
            icon={<CheckCircle2 className="w-5 h-5" />}
            accentColor="purple"
          />
        </div>
      ) : null}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                  statusFilter === f.id
                    ? "bg-emerald-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => autoMatchMutation.mutate(accountId ? { accountId } : undefined)}
            disabled={autoMatchMutation.isPending}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-all disabled:opacity-50"
          >
            {autoMatchMutation.isPending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Run Auto-Match
          </button>
          <button
            onClick={() => completeMutation.mutate(accountId ? { accountId } : undefined)}
            disabled={completeMutation.isPending || pendingCount > 0}
            title={
              pendingCount > 0
                ? `${pendingCount} line(s) still need review before this can be marked complete`
                : "Mark this reconciliation pass complete"
            }
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-40 disabled:shadow-none"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Mark Complete
          </button>
        </div>
      </div>

      {/* Statement Lines Table */}
      {isLoading ? (
        <div className="h-96 bg-slate-900/60 rounded-3xl border border-slate-800 animate-pulse" />
      ) : isError ? (
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-100">Failed to Load Statement Lines</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {(error as Error)?.message || "Could not retrieve reconciliation data."}
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      ) : lines.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="w-10 h-10 text-slate-600 mx-auto" aria-hidden="true" />}
          title="Nothing to Reconcile"
          message="No statement lines match this filter. Import a bank statement to start reconciling, or try a different filter."
        />
      ) : (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {lines.map((line) => (
                  <StatementLineRow key={line.id} line={line} onResolve={setResolvingLine} />
                ))}
              </tbody>
            </table>
          </div>

          {hasNextPage && (
            <div className="p-4 text-center border-t border-slate-800/60">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition-all disabled:opacity-50"
              >
                {isFetchingNextPage ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      )}

      <ResolveStatementLineModal statementLine={resolvingLine} onClose={() => setResolvingLine(null)} />
    </div>
  );
};
