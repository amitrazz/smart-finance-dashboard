import React, { useState, useEffect, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useUIStore } from "../../store/useUIStore";
import {
  useImports,
  useReviewQueueInfinite,
  useCommitImport,
  useUploadImport,
  useAccounts,
  useCreditCards,
  useCategories,
  useConfirmColumnMapping,
  useUpdateImportRow,
  useRetryImport,
  useRollbackImport,
  useImportPreviewInfinite,
  useImportJob,
  useReviewClustersInfinite,
  useReviewCluster,
  useResolveReviewCluster,
  useMerchants,
  useMerchant,
} from "../../hooks/useFinanceQueries";
import {
  ImportJob,
  ImportJobStatus,
  ImportRowStaging,
  NormalizedTransactionRowData,
  NormalizedTradeRowData,
  ColumnMappingData,
  Account,
  Category,
  MerchantReviewCluster,
  ResolveReviewClusterInput,
} from "../../types";
import { PaginatedResponse } from "../../services/api/endpoints";
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileText,
  ArrowRight,
  Undo2,
  XCircle,
  Users,
  Sparkles,
  Search,
} from "lucide-react";
import { AsyncSearchSelect } from "../../components/common/AsyncSearchSelect";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import { Button } from "../../components/ui/Button";

function isTradeRow(
  data: NormalizedTransactionRowData | NormalizedTradeRowData | null | undefined
): data is NormalizedTradeRowData {
  return !!data && "tradeDate" in data;
}

// The row's `normalizedData` shape depends on whether the source routed into
// `transactions` (bank/CSV/Excel) or `investments` (CAS/broker PDF) — see the
// Institution Detection stage in packages/finance/docs/03-import-pipeline.md.
//
// `merchantName` and `categoryId` are two independent, frequently-diverging
// fields — a tax line (IGST/CGST) or EMI-amortization split has no merchant
// but can still carry a real categoryId from a keyword rule, and a category
// can be null (genuinely uncategorized, e.g. unrecognized P2P UPI) even when
// a merchant name is present. Keep them separate here; resolving categoryId
// to a display name happens in the component, against the loaded categories
// list.
function getRowDisplay(row: ImportRowStaging) {
  const data = row.normalizedData;
  if (isTradeRow(data)) {
    return {
      date: data.tradeDate,
      description: data.schemeName,
      direction: data.tradeType,
      amount: data.amount,
      merchantName: data.isin || "—",
      categoryId: undefined as string | undefined,
    };
  }
  return {
    date: data?.transactionDate,
    description: data?.description,
    direction: data?.direction,
    amount: data?.amount,
    merchantName: data?.merchantName,
    categoryId: data?.categoryId,
  };
}

// Renders the actual CSV/Excel header names (from the upload's auto-mapper
// guess) as a dropdown so the user picks a column by name instead of
// guessing a blind zero-based index. Falls back to a plain number input
// when no header row is available.
function ColumnPicker({
  headers,
  value,
  onChange,
  allowNone,
}: {
  headers?: string[];
  value: number;
  onChange: (index: number) => void;
  allowNone?: boolean;
}) {
  if (!headers || headers.length === 0) {
    return (
      <input
        type="number"
        min={allowNone ? -1 : 0}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100"
      />
    );
  }
  return (
    <select
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100"
    >
      {allowNone && <option value={-1}>-- None --</option>}
      {headers.map((h, idx) => (
        <option key={idx} value={idx}>
          Col {idx}: {h}
        </option>
      ))}
    </select>
  );
}

// Per-row category picker for the staged-rows and review-queue tables.
// `/finance/categories` is an unpaginated bare array (small per-user counts
// by design — see 15-frontend-search-integration.md), and it's already
// fully loaded once for `categoryNameById`'s row-display lookups, so rather
// than each visible row firing its own `?search=` request, this filters
// that already-fetched list client-side — same substring-match result,
// without N simultaneous requests for N visible rows.
function CategoryPickerCell({
  categories,
  value,
  currentLabel,
  onSelect,
}: {
  categories: Category[];
  value?: string;
  currentLabel: string;
  onSelect: (categoryId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? categories.filter((c) => c.name.toLowerCase().includes(q)) : categories;
  }, [categories, query]);

  return (
    <AsyncSearchSelect<Category>
      value={value}
      valueLabel={currentLabel}
      items={filtered}
      onSearch={setQuery}
      onSelect={(c) => onSelect(c.id)}
      getOptionKey={(c) => c.id}
      placeholder={currentLabel}
      emptyMessage="No matching categories"
      renderOption={(c) => <span className="truncate">{c.name}</span>}
    />
  );
}

// Unknown Counterparty Workflow — resolves every narration variant of one
// MerchantReviewCluster (e.g. "RAMACH"/"RAMACHAN"/"D RAMACH") in a single
// action: link to an existing merchant, or create a new one, optionally
// backfilling every already-imported transaction that matches.
function ResolveClusterModal({
  clusterId,
  onClose,
}: {
  clusterId: string;
  onClose: () => void;
}) {
  const { data: cluster, isLoading } = useReviewCluster(clusterId);
  const { data: categories = [] } = useCategories();
  const resolveMutation = useResolveReviewCluster();

  const [mode, setMode] = useState<"existing" | "new">("new");
  const [merchantSearch, setMerchantSearch] = useState("");
  const [debouncedMerchantSearch, setDebouncedMerchantSearch] = useState("");
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [newMerchantName, setNewMerchantName] = useState("");
  const [merchantType, setMerchantType] = useState("INDIVIDUAL");
  const [categoryId, setCategoryId] = useState("");
  const [backfill, setBackfill] = useState(true);
  const [ignoreReason, setIgnoreReason] = useState("");

  // Debounce on the client before hitting `?search=` on every keystroke —
  // matches 15-frontend-search-integration.md's guidance (250-400ms typical).
  useEffect(() => {
    const t = setTimeout(() => setDebouncedMerchantSearch(merchantSearch.trim()), 250);
    return () => clearTimeout(t);
  }, [merchantSearch]);

  const { data: merchantResults = [] } = useMerchants(
    debouncedMerchantSearch.length >= 2 ? { search: debouncedMerchantSearch, limit: 10 } : undefined
  );
  const { data: suggestedMerchant } = useMerchant(cluster?.suggestedMerchantId ?? null);
  const { data: aiSuggestedMerchant } = useMerchant(cluster?.aiSuggestedMerchantId ?? null);

  useEffect(() => {
    if (cluster) setNewMerchantName(cluster.aiSuggestedName || cluster.representativeName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cluster?.id]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const canResolve = mode === "existing" ? Boolean(selectedMerchantId) : newMerchantName.trim().length > 0;

  const handleResolve = () => {
    if (!cluster || !canResolve) return;
    resolveMutation.mutate(
      {
        id: cluster.id,
        data: {
          status: "RESOLVED",
          ...(mode === "existing"
            ? { merchantId: selectedMerchantId! }
            : { newMerchantName: newMerchantName.trim(), merchantType }),
          ...(categoryId ? { categoryId } : {}),
          backfillTransactions: backfill,
        },
      },
      { onSuccess: onClose }
    );
  };

  const handleIgnore = () => {
    if (!cluster) return;
    resolveMutation.mutate(
      { id: cluster.id, data: { status: "IGNORED", reason: ignoreReason.trim() || undefined } },
      { onSuccess: onClose }
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <XCircle className="w-5 h-5" />
        </button>

        {isLoading || !cluster ? (
          <p className="text-xs text-slate-400 py-12 text-center">Loading cluster…</p>
        ) : (
          <>
            <div className="pr-8">
              <h3 className="font-bold text-lg text-slate-100">Resolve Counterparty</h3>
              <p className="text-xs text-slate-400 mt-1">
                {cluster.memberCount} narration variant{cluster.memberCount === 1 ? "" : "s"} of the same
                unresolved counterparty. Resolving links every one of them at once.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3 space-y-1 max-h-28 overflow-y-auto">
              {(cluster.members ?? []).map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-300 truncate">{m.rawDescription}</span>
                  <span className="text-slate-500 shrink-0">×{m.occurrenceCount}</span>
                </div>
              ))}
            </div>

            {(suggestedMerchant || aiSuggestedMerchant || cluster.aiSuggestedName) && (
              <div className="rounded-2xl bg-indigo-500/5 border border-indigo-500/20 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-indigo-400 text-[11px] font-bold">
                  <Sparkles className="w-3.5 h-3.5" /> Suggestion
                </div>
                {suggestedMerchant && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("existing");
                      setSelectedMerchantId(suggestedMerchant.id);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200"
                  >
                    {suggestedMerchant.displayName || suggestedMerchant.name} —{" "}
                    {cluster.suggestedConfidence}% name match
                  </button>
                )}
                {aiSuggestedMerchant && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("existing");
                      setSelectedMerchantId(aiSuggestedMerchant.id);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200"
                  >
                    {aiSuggestedMerchant.displayName || aiSuggestedMerchant.name} — AI, {cluster.aiConfidence}%
                    confidence
                  </button>
                )}
                {!aiSuggestedMerchant && cluster.aiSuggestedName && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("new");
                      setNewMerchantName(cluster.aiSuggestedName!);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200"
                  >
                    Create "{cluster.aiSuggestedName}" — AI, {cluster.aiConfidence}% confidence
                  </button>
                )}
                {cluster.aiReason && <p className="text-[10px] text-slate-500 italic">{cluster.aiReason}</p>}
              </div>
            )}

            <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => setMode("existing")}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === "existing" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Existing Counterparty
              </button>
              <button
                type="button"
                onClick={() => setMode("new")}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === "new" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Create New
              </button>
            </div>

            {mode === "existing" ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    value={merchantSearch}
                    onChange={(e) => setMerchantSearch(e.target.value)}
                    placeholder="Search merchants / counterparties…"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100"
                  />
                </div>
                {merchantResults.length > 0 && (
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {merchantResults.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMerchantId(m.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-colors ${
                          selectedMerchantId === m.id
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        {m.displayName || m.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  value={newMerchantName}
                  onChange={(e) => setNewMerchantName(e.target.value)}
                  placeholder="Counterparty name, e.g. Ramachandran"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100"
                />
                <select
                  value={merchantType}
                  onChange={(e) => setMerchantType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100"
                >
                  <option value="INDIVIDUAL">Individual / Person</option>
                  <option value="OTHER">Business / Other</option>
                </select>
              </div>
            )}

            <CategoryPickerCell
              categories={categories}
              value={categoryId}
              currentLabel={categories.find((c) => c.id === categoryId)?.name || "No category (optional)"}
              onSelect={setCategoryId}
            />

            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={backfill}
                onChange={(e) => setBackfill(e.target.checked)}
                className="rounded"
              />
              Also fix past transactions from this counterparty that are still uncategorized
            </label>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <input
                  value={ignoreReason}
                  onChange={(e) => setIgnoreReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 w-32"
                />
                <button
                  type="button"
                  onClick={handleIgnore}
                  disabled={resolveMutation.isPending}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all disabled:opacity-40"
                >
                  Ignore
                </button>
              </div>
              <button
                type="button"
                onClick={handleResolve}
                disabled={!canResolve || resolveMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg transition-all disabled:opacity-40"
              >
                {resolveMutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Resolve{cluster.memberCount > 1 ? ` All ${cluster.memberCount}` : ""}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const RETRYABLE_STATUSES: ImportJobStatus[] = ["FAILED", "PARTIALLY_COMPLETED"];
const ROLLBACKABLE_STATUSES: ImportJobStatus[] = ["COMPLETED", "PARTIALLY_COMPLETED"];

// There's no push channel (WebSocket/SSE) for import job status — the backend
// is poll-only, so the PROCESSING step below polls GET /finance/imports/:id
// on an interval until the job lands on a terminal status.
const PROCESSING_STATUS_LABELS: Partial<Record<ImportJobStatus, string>> = {
  UPLOADED: "Queued for processing…",
  VALIDATING: "Validating file…",
  PARSING: "Parsing document…",
  OCR_PROCESSING: "Extracting text with OCR…",
  AI_EXTRACTING: "Reading statement with AI…",
  NORMALIZING: "Normalizing transaction rows…",
  DETECTING_DUPLICATES: "Checking for duplicate transactions…",
};
const POLL_TIMEOUT_MS = 75000;

export const ImportsView: React.FC = () => {
  const { activeSubTab, setActiveSubTab } = useUIStore();
  const { data: importJobs = [], isLoading, isError, error, refetch } = useImports();
  const {
    data: reviewQueueData,
    fetchNextPage: fetchNextReviewQueuePage,
    hasNextPage: hasNextReviewQueuePage,
    isFetchingNextPage: isFetchingNextReviewQueuePage,
  } = useReviewQueueInfinite();
  const reviewQueue = useMemo(
    () => reviewQueueData?.pages.flatMap((p) => p.data) ?? [],
    [reviewQueueData]
  );
  // API-reported total, not the count of rows loaded so far — a plain
  // `.length` on the (paginated) loaded array undercounts once there's
  // more than one page's worth of NEEDS_REVIEW rows.
  const reviewQueueTotal = reviewQueueData?.pages[0]?.totalCount ?? reviewQueueData?.pages[0]?.total ?? reviewQueue.length;

  const {
    data: reviewClustersData,
    isLoading: isLoadingClusters,
    fetchNextPage: fetchNextReviewClustersPage,
    hasNextPage: hasNextReviewClustersPage,
    isFetchingNextPage: isFetchingNextReviewClustersPage,
  } = useReviewClustersInfinite({ status: "PENDING" });
  const reviewClusters = useMemo(
    () => reviewClustersData?.pages.flatMap((p) => p.data) ?? [],
    [reviewClustersData]
  );
  const reviewClustersTotal =
    reviewClustersData?.pages[0]?.totalCount ?? reviewClustersData?.pages[0]?.total ?? reviewClusters.length;
  const [resolvingClusterId, setResolvingClusterId] = useState<string | null>(null);
  const bulkClusterResolveMutation = useResolveReviewCluster();
  const [selectedClusterIds, setSelectedClusterIds] = useState<Set<string>>(new Set());
  const [isBulkClusterActionPending, setIsBulkClusterActionPending] = useState(false);
  const [autoResolveThreshold, setAutoResolveThreshold] = useState(90);
  const [autoResolveBackfill, setAutoResolveBackfill] = useState(false);
  const [targetAccountSearch, setTargetAccountSearch] = useState("");
  const { data: accounts = [], isFetching: isTargetAccountsFetching } = useAccounts({
    search: targetAccountSearch || undefined,
    limit: 100,
  });
  const { data: creditCards = [], isFetching: isTargetCardsFetching } = useCreditCards({
    search: targetAccountSearch || undefined,
    limit: 100,
  });
  const { data: categories = [] } = useCategories();
  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const combinedAccounts = React.useMemo(() => {
    const accountIds = new Set(accounts.map((a) => a.id));
    const convertedCards: Account[] = creditCards
      .filter((c) => !accountIds.has(c.id))
      .map((c) => {
        const cardName = c.nickname || [c.issuer, "Card", c.lastFourDigits ? `(•••• ${c.lastFourDigits})` : ""].filter(Boolean).join(" ");
        return {
          id: c.id,
          name: cardName || "Credit Card",
          type: "CREDIT_CARD" as const,
          currentBalance:
            typeof c.currentOutstanding === "object" && c.currentOutstanding !== null
              ? c.currentOutstanding
              : { amount: String(c.currentOutstanding || c.creditLimit || "0"), currency: c.currency || "INR" },
          status: (c.status as import("../../types").AccountStatus) || "ACTIVE",
          isManual: true,
          currency: c.currency || "INR",
          maskedNumber: c.lastFourDigits ? `•••• ${c.lastFourDigits}` : undefined,
          updatedAt: c.updatedAt,
          lastSyncedAt: c.lastSyncedAt,
        };
      });
    return [...accounts, ...convertedCards];
  }, [accounts, creditCards]);

  const uploadMutation = useUploadImport();
  const commitMutation = useCommitImport();
  const columnMappingMutation = useConfirmColumnMapping();
  const updateRowMutation = useUpdateImportRow();
  const retryMutation = useRetryImport();
  const rollbackMutation = useRollbackImport();

  type StepType = "UPLOAD" | "PROCESSING" | "MAPPING" | "PREVIEW" | "QUEUE" | "CLUSTERS";
  const [activeStep, setActiveStep] = useState<StepType>("UPLOAD");

  const prevSubTabRef = useRef<string | null>(activeSubTab);

  const changeStep = (step: StepType) => {
    setActiveStep(step);
    const subTabMap: Record<StepType, string> = {
      UPLOAD: "wizard",
      PROCESSING: "processing",
      MAPPING: "mapping",
      PREVIEW: "staged-preview",
      QUEUE: "review-queue",
      CLUSTERS: "counterparties",
    };
    if (subTabMap[step]) {
      prevSubTabRef.current = subTabMap[step];
      setActiveSubTab(subTabMap[step]);
    }
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [documentType, setDocumentType] = useState<string>("BANK_STATEMENT");
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [rowCategoryChoice, setRowCategoryChoice] = useState<Record<string, string>>({});
  const [suggestedMapping, setSuggestedMapping] = useState<ColumnMappingData | null>(null);
  const [targetSelectionNotice, setTargetSelectionNotice] = useState<string | null>(null);
  const [processingStartedAt, setProcessingStartedAt] = useState<number | null>(null);
  const [processingGaveUp, setProcessingGaveUp] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);

  const selectedIsCreditCard = useMemo(
    () => combinedAccounts.find((acc) => acc.id === selectedAccountId)?.type === "CREDIT_CARD",
    [combinedAccounts, selectedAccountId]
  );

  const availableDocumentTypes = useMemo(() => {
    const selected = combinedAccounts.find((a) => a.id === selectedAccountId);
    if ((selected as { type?: string })?.type === "CREDIT_CARD") {
      return [
        { value: "CREDIT_CARD_STATEMENT", label: "Credit Card Statement (PDF/CSV)" },
      ];
    }
    if (selected && (selected as { type?: string })?.type !== "CREDIT_CARD") {
      return [
        { value: "BANK_STATEMENT", label: "Bank Statement (PDF/CSV)" },
      ];
    }
    return [
      { value: "BANK_STATEMENT", label: "Bank Statement (PDF/CSV)" },
      { value: "CREDIT_CARD_STATEMENT", label: "Credit Card Statement (PDF/CSV)" },
      { value: "CAS_STATEMENT", label: "Consolidated Account Statement (CAS PDF)" },
      { value: "MUTUAL_FUND_STATEMENT", label: "Mutual Fund Statement PDF" },
    ];
  }, [combinedAccounts, selectedAccountId]);

  const filteredTargetAccounts = useMemo(() => {
    if (documentType === "CAS_STATEMENT" || documentType === "MUTUAL_FUND_STATEMENT") {
      return [];
    }
    return combinedAccounts;
  }, [combinedAccounts, documentType]);

  const handleSelectTargetAccount = (acc: Account) => {
    setSelectedAccountId(acc.id);
    setTargetSelectionNotice(null);
    if (acc.type === "CREDIT_CARD") {
      setDocumentType("CREDIT_CARD_STATEMENT");
    } else {
      setDocumentType("BANK_STATEMENT");
    }
  };

  const handleClearTargetAccount = () => {
    setSelectedAccountId("");
    setTargetSelectionNotice(null);
  };

  const handleChangeDocumentType = (newType: string) => {
    setDocumentType(newType);
    const currentAcc = combinedAccounts.find((a) => a.id === selectedAccountId);
    if (newType === "CREDIT_CARD_STATEMENT" && currentAcc && currentAcc.type !== "CREDIT_CARD") {
      setSelectedAccountId("");
    } else if (newType === "BANK_STATEMENT" && currentAcc && currentAcc.type === "CREDIT_CARD") {
      setSelectedAccountId("");
    } else if (newType === "CAS_STATEMENT" || newType === "MUTUAL_FUND_STATEMENT") {
      setSelectedAccountId("");
    }
  };

  const pollIntervalMs = activeStep === "PROCESSING" ? (processingGaveUp ? 15000 : 2500) : undefined;
  const {
    data: polledJob,
    dataUpdatedAt: polledJobUpdatedAt,
    refetch: refetchPolledJob,
    isFetching: isCheckingNow,
  } = useImportJob(activeStep === "PROCESSING" ? currentJobId || "" : "", { pollIntervalMs });

  const applyAwaitingReviewJob = (job: ImportJob, file: File | null) => {
    setPreviewReady(true);
    const guess = job.columnMapping;
    setSuggestedMapping(guess);
    if (guess) {
      setMapping({
        transactionDate: guess.fields.transactionDate,
        description: guess.fields.description,
        amount: guess.fields.amount ?? 2,
        withdrawal: guess.fields.withdrawal ?? 2,
        deposit: guess.fields.deposit ?? 3,
        balance: guess.fields.balance ?? -1,
        hasSeparateAmount: guess.fields.amount === undefined && guess.fields.withdrawal !== undefined,
      });
    }
    const isCsvLike = !!file && (file.name.endsWith(".csv") || file.name.endsWith(".txt"));
    changeStep(isCsvLike ? "MAPPING" : "PREVIEW");
  };

  const handleFailedJob = (job: ImportJob) => {
    const detail = job.errorLog?.[0]?.message;
    useUIStore
      .getState()
      .showToast(detail || "Statement processing failed. See Import Job History below for details.", "error");
    changeStep("UPLOAD");
  };

  const handleAlreadySettledJob = (job: ImportJob) => {
    useUIStore
      .getState()
      .showToast(
        `This statement was already ${job.status.replace(/_/g, " ").toLowerCase()} — see Import Job History below.`,
        "info"
      );
    changeStep("UPLOAD");
  };

  const handleJobStatus = (job: ImportJob, file: File | null): boolean => {
    if (job.status === "AWAITING_REVIEW") {
      applyAwaitingReviewJob(job, file);
      return true;
    }
    if (job.status === "FAILED") {
      handleFailedJob(job);
      return true;
    }
    if (job.status === "COMPLETED" || job.status === "PARTIALLY_COMPLETED" || job.status === "ROLLED_BACK") {
      handleAlreadySettledJob(job);
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (activeStep !== "PROCESSING" || !polledJob || processingStartedAt === null) return;
    if (handleJobStatus(polledJob, selectedFile)) return;
    if (Date.now() - processingStartedAt > POLL_TIMEOUT_MS) {
      setProcessingGaveUp(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polledJob, polledJobUpdatedAt, activeStep, processingStartedAt]);

  useEffect(() => {
    if (activeStep !== "PROCESSING" || processingGaveUp || processingStartedAt === null) return;
    const timer = setInterval(() => {
      if (Date.now() - processingStartedAt > POLL_TIMEOUT_MS) {
        setProcessingGaveUp(true);
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [activeStep, processingGaveUp, processingStartedAt]);

  // Sync activeSubTab from global route navigation only when activeSubTab changes externally
  useEffect(() => {
    if (prevSubTabRef.current !== activeSubTab) {
      prevSubTabRef.current = activeSubTab;
      if (activeSubTab === "review-queue") {
        setActiveStep("QUEUE");
      } else if (activeSubTab === "counterparties") {
        setActiveStep("CLUSTERS");
      } else if (activeSubTab === "staged-preview") {
        setActiveStep("PREVIEW");
      } else if (activeSubTab === "wizard") {
        setActiveStep("UPLOAD");
      }
    }
  }, [activeSubTab]);

  const {
    data: previewData,
    isLoading: isLoadingPreview,
    isFetching: isFetchingPreview,
    isPending: isPendingPreview,
    fetchNextPage: fetchNextPreviewPage,
    hasNextPage: hasNextPreviewPage,
    isFetchingNextPage: isFetchingNextPreviewPage,
  } = useImportPreviewInfinite(currentJobId || "");

  const stagedRows = useMemo<ImportRowStaging[]>(() => {
    if (!previewData) return [];
    return previewData.pages.flatMap((p: PaginatedResponse<ImportRowStaging> | ImportRowStaging[]) => {
      if (Array.isArray(p)) return p;
      if (p && Array.isArray(p.data)) return p.data;
      return [];
    });
  }, [previewData]);

  const totalStagedCount = useMemo(() => {
    if (!previewData?.pages[0]) return 0;
    const firstPage = previewData.pages[0] as PaginatedResponse<ImportRowStaging> | ImportRowStaging[];
    if (!Array.isArray(firstPage)) {
      if (typeof firstPage.totalCount === "number") return firstPage.totalCount;
      if (typeof firstPage.total === "number") return firstPage.total;
      if (Array.isArray(firstPage.data)) return firstPage.data.length;
    } else {
      return firstPage.length;
    }
    return 0;
  }, [previewData]);

  const isStagedLoading = Boolean(currentJobId) && (isLoadingPreview || isFetchingPreview || isPendingPreview) && !previewData;

  const stagedScrollRef = useRef<HTMLDivElement>(null);
  const stagedRowVirtualizer = useVirtualizer({
    count: stagedRows.length,
    getScrollElement: () => stagedScrollRef.current,
    estimateSize: () => 56,
    overscan: 8,
  });
  const stagedVirtualRows = stagedRowVirtualizer.getVirtualItems();

  const [mapping, setMapping] = useState({
    transactionDate: 0,
    description: 1,
    amount: 2,
    withdrawal: 2,
    deposit: 3,
    balance: -1,
    hasSeparateAmount: false,
  });

  useEffect(() => {
    const lastRow = stagedVirtualRows[stagedVirtualRows.length - 1];
    if (!lastRow) return;
    if (lastRow.index >= stagedRows.length - 5 && hasNextPreviewPage && !isFetchingNextPreviewPage) {
      fetchNextPreviewPage();
    }
  }, [stagedVirtualRows, stagedRows.length, hasNextPreviewPage, isFetchingNextPreviewPage, fetchNextPreviewPage]);

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    const targetAccountId = selectedAccountId;
    const formData = new FormData();
    formData.append("file", selectedFile);
    if (targetAccountId) {
      // accountId and creditCardId are mutually exclusive on the backend
      // (422 AMBIGUOUS_IMPORT_TARGET if both are sent) — only ever append one.
      if (selectedIsCreditCard) {
        formData.append("creditCardId", targetAccountId);
      } else {
        formData.append("accountId", targetAccountId);
      }
    }
    if (documentType) {
      formData.append("documentType", documentType);
    }

    setTargetSelectionNotice(null);
    setPreviewReady(false);

    uploadMutation.mutate(formData, {
      // The POST response reflects the job's state at that instant — usually
      // still PARSING/OCR_PROCESSING for PDFs, occasionally already
      // AWAITING_REVIEW for a fast CSV. Handle both instead of assuming
      // it's already finished.
      onSuccess: (job: ImportJob) => {
        setCurrentJobId(job.id);
        if (!handleJobStatus(job, selectedFile)) {
          setProcessingGaveUp(false);
          setProcessingStartedAt(Date.now());
          setActiveStep("PROCESSING");
        }
      },
      onError: (err: unknown) => {
        const code = err !== null && typeof err === "object" ? (err as { error?: string }).error : undefined;
        if (code === "ACCOUNT_REQUIRED") {
          setTargetSelectionNotice(
            "Couldn't auto-detect the bank account for this statement — please select it above."
          );
        } else if (code === "CREDIT_CARD_REQUIRED") {
          setTargetSelectionNotice(
            "Couldn't auto-detect the credit card for this statement — please select it above."
          );
        } else if (code === "ENTITY_NOT_FOUND") {
          setTargetSelectionNotice(
            "The selected account/card couldn't be found — it may have been removed. Please pick another."
          );
        } else if (code === "AMBIGUOUS_IMPORT_TARGET") {
          setTargetSelectionNotice(
            "Only one target can be set — please select either an account or a credit card, not both."
          );
        }
      },
    });
  };

  const handleConfirmMapping = () => {
    if (!currentJobId) return;
    // ConfirmColumnMappingDto requires transactionDate + description; amount
    // XOR withdrawal/deposit; balance is optional.
    const dtoPayload: Record<string, number> = {
      transactionDate: Number(mapping.transactionDate) || 0,
      description: Number(mapping.description) || 0,
    };
    if (mapping.hasSeparateAmount) {
      dtoPayload.withdrawal = Number(mapping.withdrawal) || 0;
      dtoPayload.deposit = Number(mapping.deposit) || 0;
    } else {
      dtoPayload.amount = Number(mapping.amount) || 0;
    }
    if (mapping.balance >= 0) {
      dtoPayload.balance = mapping.balance;
    }

    columnMappingMutation.mutate(
      { id: currentJobId, mapping: dtoPayload as unknown as Record<string, string> },
      {
        onSuccess: () => {
          setActiveStep("PREVIEW");
        },
      }
    );
  };

  const handleCommit = () => {
    if (!currentJobId) return;
    commitMutation.mutate(currentJobId, {
      onSuccess: () => {
        setActiveStep("UPLOAD");
        setSelectedFile(null);
        setCurrentJobId(null);
        setPreviewReady(false);
      },
    });
  };

  // Takes jobId explicitly (rather than reading currentJobId from closure) so
  // it also works from the Review Queue tab, which spans rows from many
  // different jobs at once — each row now carries its own importJobId.
  const handleResolveRow = (
    jobId: string,
    rowId: string,
    action: "accept" | "reject",
    options?: { silent?: boolean }
  ) => {
    const categoryId = rowCategoryChoice[rowId];
    return updateRowMutation.mutateAsync({
      jobId,
      rowId,
      silent: options?.silent,
      data:
        action === "reject"
          ? { reject: true }
          : { confirmNotDuplicate: true, ...(categoryId ? { categoryId } : {}) },
    });
  };

  const [selectedQueueRowIds, setSelectedQueueRowIds] = useState<Set<string>>(new Set());
  const [isBulkResolvingQueue, setIsBulkResolvingQueue] = useState(false);
  // Rollback undoes every transaction a committed import job created — a
  // real, hard-to-reverse write against the ledger, so it goes through the
  // shared ConfirmModal instead of firing straight off the icon click.
  const [rollbackTargetJob, setRollbackTargetJob] = useState<ImportJob | null>(null);

  const toggleQueueRowSelected = (rowId: string) => {
    setSelectedQueueRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  const handleBulkResolveQueue = async (action: "accept" | "reject") => {
    const targets = reviewQueue.filter((row) => selectedQueueRowIds.has(row.id));
    if (targets.length === 0) return;
    setIsBulkResolvingQueue(true);
    try {
      const results = await Promise.allSettled(
        targets.map((row) => handleResolveRow(row.importJobId, row.id, action, { silent: true }))
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      const succeeded = results.length - failed;
      if (succeeded > 0) {
        useUIStore
          .getState()
          .showToast(
            `${succeeded} row${succeeded === 1 ? "" : "s"} ${action === "accept" ? "accepted" : "rejected"}${failed ? `, ${failed} failed` : ""}`,
            failed ? "info" : "success"
          );
      } else if (failed > 0) {
        useUIStore.getState().showToast(`Failed to ${action} ${failed} row${failed === 1 ? "" : "s"}`, "error");
      }
      setSelectedQueueRowIds(new Set());
    } finally {
      setIsBulkResolvingQueue(false);
    }
  };

  const toggleClusterSelected = (clusterId: string) => {
    setSelectedClusterIds((prev) => {
      const next = new Set(prev);
      if (next.has(clusterId)) next.delete(clusterId);
      else next.add(clusterId);
      return next;
    });
  };

  const runBulkClusterResolve = async (
    targets: MerchantReviewCluster[],
    buildData: (c: MerchantReviewCluster) => ResolveReviewClusterInput,
    verb: string
  ) => {
    if (targets.length === 0) return;
    setIsBulkClusterActionPending(true);
    try {
      const results = await Promise.allSettled(
        targets.map((c) => bulkClusterResolveMutation.mutateAsync({ id: c.id, data: buildData(c), silent: true }))
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      const succeeded = results.length - failed;
      if (succeeded > 0) {
        useUIStore
          .getState()
          .showToast(
            `${succeeded} counterpart${succeeded === 1 ? "y" : "ies"} ${verb}${failed ? `, ${failed} failed` : ""}`,
            failed ? "info" : "success"
          );
      } else if (failed > 0) {
        useUIStore.getState().showToast(`Failed to ${verb} ${failed} counterpart${failed === 1 ? "y" : "ies"}`, "error");
      }
    } finally {
      setIsBulkClusterActionPending(false);
    }
  };

  const handleBulkIgnoreClusters = () => {
    const targets = reviewClusters.filter((c) => selectedClusterIds.has(c.id));
    runBulkClusterResolve(targets, () => ({ status: "IGNORED" }), "ignored").then(() =>
      setSelectedClusterIds(new Set())
    );
  };

  // Only ever links to an *existing* merchant the matcher already found
  // (suggestedMerchantId from fuzzy name match, or aiSuggestedMerchantId
  // from the AI classifier) — never auto-creates a new merchant from a bare
  // name, since that's exactly the judgment call the manual "Create New"
  // flow in ResolveClusterModal exists for.
  const highConfidenceClusters = useMemo(
    () =>
      reviewClusters.filter(
        (c) =>
          (c.suggestedMerchantId && (c.suggestedConfidence ?? 0) >= autoResolveThreshold) ||
          (c.aiSuggestedMerchantId && (c.aiConfidence ?? 0) >= autoResolveThreshold)
      ),
    [reviewClusters, autoResolveThreshold]
  );

  const handleAutoResolveHighConfidence = () => {
    runBulkClusterResolve(
      highConfidenceClusters,
      (c) => ({
        status: "RESOLVED",
        merchantId: c.suggestedMerchantId ?? c.aiSuggestedMerchantId!,
        backfillTransactions: autoResolveBackfill,
      }),
      "resolved"
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3" />
        <div className="h-44 bg-slate-900/60 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Failed to Load Imports</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not retrieve import pipeline status."}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Ingestion & Import Pipeline</h2>
          <p className="text-xs text-slate-400">
            {activeSubTab
              ? `Sub-View: ${activeSubTab.replace("-", " ").toUpperCase()}`
              : "Import statements (CSV, Excel, PDF) with AI parsing, OCR, fuzzy duplicate detection & column mapping"}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => changeStep("UPLOAD")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeStep === "UPLOAD" ? "bg-emerald-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Upload Wizard
          </button>
          {currentJobId && previewReady && (
            <button
              onClick={() => changeStep("PREVIEW")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeStep === "PREVIEW" ? "bg-emerald-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Staged Preview
            </button>
          )}
          <button
            onClick={() => changeStep("QUEUE")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeStep === "QUEUE" ? "bg-emerald-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Review Queue
            {reviewQueueTotal > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-emerald-400 text-[10px]">
                {reviewQueueTotal}
              </span>
            )}
          </button>
          <button
            onClick={() => changeStep("CLUSTERS")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeStep === "CLUSTERS" ? "bg-emerald-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Counterparties
            {reviewClustersTotal > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-emerald-400 text-[10px]">
                {reviewClustersTotal}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Step 1: Upload Zone */}
      {activeStep === "UPLOAD" && (
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Drop your Financial Statement</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Supports HDFC, ICICI, SBI, Axis PDF statements, Zerodha/Groww CAS PDFs, Swiggy/Amazon CSVs, and Excel files.
            </p>
          </div>

          {/* Account & Document Type Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Target Account / Card (Optional)</label>
              <AsyncSearchSelect
                value={selectedAccountId}
                valueLabel={(() => {
                  const acc = combinedAccounts.find((a) => a.id === selectedAccountId);
                  return acc ? `${acc.type === "CREDIT_CARD" ? "💳 " : "🏦 "}${acc.name} (${acc.type})` : undefined;
                })()}
                items={filteredTargetAccounts}
                isFetching={isTargetAccountsFetching || isTargetCardsFetching}
                disabled={documentType === "CAS_STATEMENT" || documentType === "MUTUAL_FUND_STATEMENT"}
                onSearch={setTargetAccountSearch}
                onSelect={handleSelectTargetAccount}
                onClear={handleClearTargetAccount}
                getOptionKey={(acc) => acc.id}
                placeholder={
                  documentType === "CREDIT_CARD_STATEMENT"
                    ? "-- Select Credit Card (or Auto-detect) --"
                    : documentType === "BANK_STATEMENT"
                    ? "-- Select Bank Account (or Auto-detect) --"
                    : "-- Auto-detect / Portfolio Target --"
                }
                emptyMessage="No matching accounts or cards"
                renderOption={(acc: Account) => (
                  <span className="truncate">
                    {acc.type === "CREDIT_CARD" ? "💳 " : "🏦 "}{acc.name} ({acc.type})
                  </span>
                )}
              />
              {documentType === "CAS_STATEMENT" || documentType === "MUTUAL_FUND_STATEMENT" ? (
                <p className="mt-1 text-[10px] text-slate-500">
                  CAS/mutual-fund statements target a portfolio directly — no account needed.
                </p>
              ) : selectedAccountId ? (
                <p className="mt-1 text-[10px] text-emerald-400 font-medium">
                  {selectedIsCreditCard
                    ? "✓ Synced with Credit Card Statement ingestion"
                    : "✓ Synced with Bank Statement ingestion"}
                </p>
              ) : null}
              {targetSelectionNotice && (
                <p className="mt-1 text-[10px] text-amber-400">{targetSelectionNotice}</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Document Type</label>
              <select
                value={documentType}
                onChange={(e) => handleChangeDocumentType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
              >
                {availableDocumentTypes.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* File Picker Box */}
          <div className="max-w-xl mx-auto p-6 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/40 hover:border-emerald-500/50 transition-all cursor-pointer relative text-center">
            <input
              type="file"
              accept=".pdf,.csv,.xlsx,.xls,.txt"
              onChange={handleFileDrop}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3 text-emerald-400 font-semibold text-sm">
                <FileText className="w-5 h-5" />
                <span>
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            ) : (
              <p className="text-xs font-semibold text-slate-400">
                Click to browse or drag statement file here (<span className="text-emerald-400">PDF, CSV, XLSX</span>)
              </p>
            )}
          </div>

          {selectedFile && (
            <div className="text-center">
              <Button
                variant="primary"
                hierarchy="filled"
                size="lg"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                isLoading={uploadMutation.isPending}
                loadingText="Ingesting Statement to Pipeline..."
                onClick={handleUploadSubmit}
              >
                Start Parsing Pipeline
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 1b: Processing — polls GET /finance/imports/:id since the
          backend has no push channel (no WebSocket/SSE) for job status. */}
      {activeStep === "PROCESSING" && (
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-100">
              {processingGaveUp ? "Still Processing" : "Processing Statement"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {processingGaveUp
                ? "This is taking longer than usual — heavy OCR/AI extraction on large PDFs can occasionally run past a minute. Still checking in the background; you'll be notified here the moment it settles."
                : (polledJob?.status && PROCESSING_STATUS_LABELS[polledJob.status]) || "Working on your statement…"}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            {processingGaveUp && (
              <button
                onClick={() => refetchPolledJob()}
                disabled={isCheckingNow}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingNow ? "animate-spin" : ""}`} />
                Check Now
              </button>
            )}
            <button
              onClick={() => {
                changeStep("UPLOAD");
                setSelectedFile(null);
                setCurrentJobId(null);
                setProcessingGaveUp(false);
                setProcessingStartedAt(null);
                setPreviewReady(false);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-all"
            >
              Upload a Different File
            </button>
          </div>
        </div>
      )}

      {/* Step 2: CSV Column Mapping */}
      {activeStep === "MAPPING" && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-slate-100">Configure CSV Column Mapping</h3>
            <p className="text-xs text-slate-400">Map statement headers to standardized transaction properties.</p>
          </div>

          {suggestedMapping ? (
            <div
              className={`max-w-xl px-4 py-2.5 rounded-xl text-xs border ${
                suggestedMapping.confidence >= 0.8
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-300"
              }`}
            >
              Auto-detected mapping at {(suggestedMapping.confidence * 100).toFixed(0)}% confidence — review
              before confirming.
            </div>
          ) : (
            <div className="max-w-xl px-4 py-2.5 rounded-xl text-xs border bg-slate-800/40 border-slate-700 text-slate-400">
              No header row detected — pick columns by zero-based index instead.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date Column</label>
              <ColumnPicker
                headers={suggestedMapping?.headers}
                value={mapping.transactionDate}
                onChange={(v) => setMapping({ ...mapping, transactionDate: v })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Description Column</label>
              <ColumnPicker
                headers={suggestedMapping?.headers}
                value={mapping.description}
                onChange={(v) => setMapping({ ...mapping, description: v })}
              />
            </div>
          </div>

          <div className="max-w-xl">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={mapping.hasSeparateAmount}
                onChange={(e) => setMapping({ ...mapping, hasSeparateAmount: e.target.checked })}
                className="rounded border-slate-700 bg-slate-950"
              />
              Statement has separate Withdrawal / Deposit columns
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            {mapping.hasSeparateAmount ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Withdrawal (Debit) Column</label>
                  <ColumnPicker
                    headers={suggestedMapping?.headers}
                    value={mapping.withdrawal}
                    onChange={(v) => setMapping({ ...mapping, withdrawal: v })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Deposit (Credit) Column</label>
                  <ColumnPicker
                    headers={suggestedMapping?.headers}
                    value={mapping.deposit}
                    onChange={(v) => setMapping({ ...mapping, deposit: v })}
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Signed Amount Column</label>
                <ColumnPicker
                  headers={suggestedMapping?.headers}
                  value={mapping.amount}
                  onChange={(v) => setMapping({ ...mapping, amount: v })}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Balance Column (Optional)</label>
              <ColumnPicker
                headers={suggestedMapping?.headers}
                value={mapping.balance}
                onChange={(v) => setMapping({ ...mapping, balance: v })}
                allowNone
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              onClick={handleConfirmMapping}
              disabled={columnMappingMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md"
            >
              {columnMappingMutation.isPending ? "Confirming Mapping..." : "Confirm & Staging Preview"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Staged Row Preview & Atomic Commit */}
      {activeStep === "PREVIEW" && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Staged Row Mapping Preview</h3>
              <p className="text-xs text-slate-400">
                Job ID: <span className="font-mono text-slate-300">{currentJobId}</span> • {totalStagedCount ?? stagedRows.length} rows staged
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCommit}
                disabled={commitMutation.isPending || stagedRows.length === 0}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all"
              >
                {commitMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Commit All Staged Rows
              </button>
            </div>
          </div>

          {isStagedLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Loading staged row preview...</span>
            </div>
          ) : stagedRows.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-1">
              <p>No rows are staged for this job.</p>
              <p className="text-slate-500">
                Every row may already be committed, rejected, or filtered out as a duplicate — check
                Import Job History below for this job's current status.
              </p>
            </div>
          ) : (
            <div ref={stagedScrollRef} className="rounded-xl border border-slate-800 overflow-auto max-h-[560px] scrollbar-thin">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 border-b border-slate-800 sticky top-0 z-10">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Merchant</th>
                    <th className="p-3">Type / Direction</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stagedRows.map((row) => {
                    const r = getRowDisplay(row);
                    const needsReview = row.status === "NEEDS_REVIEW";
                    // categoryId can legitimately be set (matched by a keyword
                    // rule, e.g. tax lines / EMI splits) even when there's no
                    // merchant, and can legitimately be null (unrecognized
                    // P2P UPI auto-commits uncategorized by design) even when
                    // a merchant name is present — the two are independent,
                    // so don't conflate them into one column.
                    const currentCategoryName = r.categoryId
                      ? categoryNameById.get(r.categoryId) ?? "Uncategorized"
                      : "Uncategorized";
                    return (
                    <tr key={row.id} className="hover:bg-slate-800/30">
                      <td className="p-3 text-xs text-slate-300 font-mono">{r.date || "—"}</td>
                      <td className="p-3 font-semibold text-slate-100">{r.description || "—"}</td>
                      <td className="p-3 text-xs text-slate-400">{r.merchantName || "—"}</td>
                      <td className="p-3 text-xs font-bold text-emerald-400">{r.direction || "—"}</td>
                      <td className="p-3 font-bold text-slate-100">₹{r.amount || "0"}</td>
                      <td className="p-3 text-xs text-slate-400">
                        {needsReview ? (
                          <CategoryPickerCell
                            categories={categories}
                            currentLabel={
                              categories.find((c) => c.id === rowCategoryChoice[row.id])?.name || currentCategoryName
                            }
                            onSelect={(categoryId) =>
                              setRowCategoryChoice((prev) => ({ ...prev, [row.id]: categoryId }))
                            }
                          />
                        ) : (
                          currentCategoryName
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            needsReview
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : row.status === "DUPLICATE"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          {row.status}
                        </span>
                        {row.rejectionReason && (
                          <p className="mt-1 text-[10px] text-slate-500">{row.rejectionReason}</p>
                        )}
                      </td>
                      <td className="p-3">
                        {(needsReview || row.status === "DUPLICATE") && row.status !== "COMMITTED" && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => currentJobId && handleResolveRow(currentJobId, row.id, "accept")}
                              disabled={updateRowMutation.isPending}
                              title="Accept / confirm not a duplicate"
                              aria-label="Accept / confirm not a duplicate"
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 disabled:opacity-40"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => currentJobId && handleResolveRow(currentJobId, row.id, "reject")}
                              disabled={updateRowMutation.isPending}
                              title="Reject row"
                              aria-label="Reject row"
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 disabled:opacity-40"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Review Queue: NEEDS_REVIEW / DUPLICATE rows across every import job.
          Each row carries its own importJobId, so it can be resolved
          directly here — "Open" still jumps into that job's full Staged
          Preview when the surrounding rows' context is useful. */}
      {activeStep === "QUEUE" && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Manual Review Queue</h3>
              <p className="text-xs text-slate-400">
                Rows flagged low-confidence, ambiguous institution/account match, or ambiguous duplicate across all import jobs.
              </p>
            </div>
            {selectedQueueRowIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{selectedQueueRowIds.size} selected</span>
                <button
                  onClick={() => handleBulkResolveQueue("accept")}
                  disabled={isBulkResolvingQueue}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold disabled:opacity-40"
                >
                  {isBulkResolvingQueue && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Accept Selected
                </button>
                <button
                  onClick={() => handleBulkResolveQueue("reject")}
                  disabled={isBulkResolvingQueue}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold disabled:opacity-40"
                >
                  {isBulkResolvingQueue && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Reject Selected
                </button>
              </div>
            )}
          </div>
          {reviewQueue.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">Nothing needs review right now.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-950 text-slate-400 font-semibold">
                  <tr>
                    <th className="p-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedQueueRowIds.size > 0 && selectedQueueRowIds.size === reviewQueue.length}
                        onChange={(e) =>
                          setSelectedQueueRowIds(e.target.checked ? new Set(reviewQueue.map((r) => r.id)) : new Set())
                        }
                        className="rounded"
                        aria-label="Select all"
                      />
                    </th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Confidence</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {reviewQueue.map((row) => {
                    const r = getRowDisplay(row);
                    const isResolvable = row.status === "NEEDS_REVIEW" || row.status === "DUPLICATE";
                    return (
                      <tr key={row.id} className="hover:bg-slate-800/40">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedQueueRowIds.has(row.id)}
                            onChange={() => toggleQueueRowSelected(row.id)}
                            disabled={!isResolvable}
                            className="rounded"
                            aria-label={`Select row ${row.id}`}
                          />
                        </td>
                        <td className="p-3 font-mono">{r.date || "—"}</td>
                        <td className="p-3 font-semibold text-slate-100">{r.description || "—"}</td>
                        <td className="p-3 font-bold text-slate-100">₹{r.amount || "0"}</td>
                        <td className="p-3">
                          {row.status === "NEEDS_REVIEW" ? (
                            <CategoryPickerCell
                              categories={categories}
                              currentLabel={
                                categories.find((c) => c.id === rowCategoryChoice[row.id])?.name ||
                                (r.categoryId ? categoryNameById.get(r.categoryId) ?? "Uncategorized" : "Uncategorized")
                              }
                              onSelect={(categoryId) =>
                                setRowCategoryChoice((prev) => ({ ...prev, [row.id]: categoryId }))
                              }
                            />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-3">
                          {row.confidenceScore ? `${(Number(row.confidenceScore) * 100).toFixed(0)}%` : "—"}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {row.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            {isResolvable && (
                              <>
                                <button
                                  onClick={() => handleResolveRow(row.importJobId, row.id, "accept")}
                                  disabled={updateRowMutation.isPending}
                                  title="Accept / confirm not a duplicate"
                                  aria-label="Accept / confirm not a duplicate"
                                  className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 disabled:opacity-40"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleResolveRow(row.importJobId, row.id, "reject")}
                                  disabled={updateRowMutation.isPending}
                                  title="Reject row"
                                  aria-label="Reject row"
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 disabled:opacity-40"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => {
                                setCurrentJobId(row.importJobId);
                                setPreviewReady(true);
                                changeStep("PREVIEW");
                              }}
                              title="Open this row's import job"
                              aria-label="Open this row's import job"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {hasNextReviewQueuePage && (
                <div className="pt-4 text-center">
                  <button
                    onClick={() => fetchNextReviewQueuePage()}
                    disabled={isFetchingNextReviewQueuePage}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    {isFetchingNextReviewQueuePage && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    Load More
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Unknown Counterparty Workflow: fuzzy-similar review-queue misses
          (e.g. "RAMACH"/"RAMACHAN"/"D RAMACH") grouped into one cluster per
          real-world counterparty, so resolving one cluster resolves every
          narration variant — and, optionally, every past transaction that
          matches — at once. Distinct from the row-level Review Queue above. */}
      {activeStep === "CLUSTERS" && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Unknown Counterparties
              </h3>
              <p className="text-xs text-slate-400">
                Every raw narration for the same unresolved person or business, grouped together. Resolve
                once to link (or create) the counterparty for every variant — and optionally backfill past
                transactions.
              </p>
            </div>
            {selectedClusterIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{selectedClusterIds.size} selected</span>
                <button
                  onClick={handleBulkIgnoreClusters}
                  disabled={isBulkClusterActionPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold disabled:opacity-40"
                >
                  {isBulkClusterActionPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Ignore Selected
                </button>
              </div>
            )}
          </div>

          {/* Bulk-approve confident matches instead of opening the Resolve
              modal one cluster at a time — only ever links to a merchant the
              matcher already found (never auto-creates a new one), and
              backfilling past transactions defaults off since that's a
              wider-blast-radius write than resolving the cluster alone. */}
          {reviewClusters.length > 0 && (
            <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-3">
              <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" /> Bulk-resolve high-confidence matches
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <label className="flex items-center gap-2">
                  Confidence ≥
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={autoResolveThreshold}
                    onChange={(e) => setAutoResolveThreshold(Number(e.target.value) || 90)}
                    className="w-16 px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
                  />
                  %
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoResolveBackfill}
                    onChange={(e) => setAutoResolveBackfill(e.target.checked)}
                    className="rounded"
                  />
                  Also backfill past transactions
                </label>
                <button
                  onClick={handleAutoResolveHighConfidence}
                  disabled={isBulkClusterActionPending || highConfidenceClusters.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold disabled:opacity-40"
                >
                  {isBulkClusterActionPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Resolve {highConfidenceClusters.length} Match{highConfidenceClusters.length === 1 ? "" : "es"}
                </button>
              </div>
            </div>
          )}

          {isLoadingClusters ? (
            <p className="text-xs text-slate-400 text-center py-8">Loading…</p>
          ) : reviewClusters.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              No unresolved counterparties right now.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {reviewClusters.map((cluster: MerchantReviewCluster) => (
                <div
                  key={cluster.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedClusterIds.has(cluster.id)}
                        onChange={() => toggleClusterSelected(cluster.id)}
                        className="mt-1 rounded"
                        aria-label={`Select ${cluster.representativeName}`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-100 truncate">
                          {cluster.representativeName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {cluster.memberCount} narration variant{cluster.memberCount === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    {(cluster.suggestedConfidence !== null || cluster.aiConfidence !== null) && (
                      <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Sparkles className="w-3 h-3" />
                        {cluster.suggestedConfidence ?? cluster.aiConfidence}%
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setResolvingClusterId(cluster.id)}
                    className="w-full px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all"
                  >
                    Resolve
                  </button>
                </div>
              ))}
            </div>
          )}
          {hasNextReviewClustersPage && (
            <div className="pt-2 text-center">
              <button
                onClick={() => fetchNextReviewClustersPage()}
                disabled={isFetchingNextReviewClustersPage}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-all disabled:opacity-50"
              >
                {isFetchingNextReviewClustersPage && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Load More
              </button>
            </div>
          )}
        </div>
      )}

      {resolvingClusterId && (
        <ResolveClusterModal
          clusterId={resolvingClusterId}
          onClose={() => setResolvingClusterId(null)}
        />
      )}

      {/* Import History Table */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-100">Import Job History</h3>
        {importJobs.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No import jobs recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950 text-slate-400 font-semibold">
                <tr>
                  <th className="p-3">Filename</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Rows</th>
                  <th className="p-3">Created At</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {importJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-100">{job.fileName}</td>
                    <td className="p-3 text-slate-400">{job.sourceType}</td>
                    <td className="p-3 font-semibold text-slate-200">
                      {job.importedRows}/{job.totalRows}
                    </td>
                    <td className="p-3 text-slate-400">{job.createdAt}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {job.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {(job.status === "AWAITING_REVIEW" ||
                          job.status === "PARTIALLY_COMPLETED") && (
                          <button
                            onClick={() => {
                              setCurrentJobId(job.id);
                              setPreviewReady(true);
                              changeStep("PREVIEW");
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold"
                          >
                            View
                          </button>
                        )}
                        {RETRYABLE_STATUSES.includes(job.status) && (
                          <button
                            onClick={() => retryMutation.mutate(job.id)}
                            disabled={retryMutation.isPending}
                            title="Re-attempt commit for remaining rows"
                            aria-label="Re-attempt commit for remaining rows"
                            className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 disabled:opacity-40"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${retryMutation.isPending && retryMutation.variables === job.id ? "animate-spin" : ""}`} />
                          </button>
                        )}
                        {ROLLBACKABLE_STATUSES.includes(job.status) && (
                          <button
                            onClick={() => setRollbackTargetJob(job)}
                            disabled={rollbackMutation.isPending}
                            title="Undo every transaction this job created"
                            aria-label="Undo every transaction this job created"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 disabled:opacity-40"
                          >
                            <Undo2 className={`w-3.5 h-3.5 ${rollbackMutation.isPending && rollbackMutation.variables === job.id ? "animate-spin" : ""}`} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={rollbackTargetJob !== null}
        title="Roll Back Import Job"
        message={
          rollbackTargetJob
            ? `This will undo every transaction created by "${rollbackTargetJob.fileName}". This cannot be undone from here — you'd need to re-import the statement.`
            : ""
        }
        confirmText="Roll Back"
        cancelText="Cancel"
        variant="danger"
        isLoading={rollbackMutation.isPending}
        onClose={() => setRollbackTargetJob(null)}
        onConfirm={() => {
          if (!rollbackTargetJob) return;
          rollbackMutation.mutate(rollbackTargetJob.id, {
            onSuccess: () => setRollbackTargetJob(null),
          });
        }}
      />
    </div>
  );
};
