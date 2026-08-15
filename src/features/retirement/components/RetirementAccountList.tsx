import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, PiggyBank, Plus, Search } from "lucide-react";
import { RetirementAccount, RetirementProductType } from "../../../types";
import { formatDate } from "../../../utils/formatters";
import { Money as MoneyDisplay } from "../../../components/common/Money";
import { EmptyState } from "../../../components/common/EmptyState";
import { PRODUCT_TYPE_CONFIG, PRODUCT_TYPE_LIST, STATUS_LABELS } from "../constants/productTypes";
import { useRetirementAccounts } from "../hooks/useRetirementQueries";
import { useInstitutions } from "../../../hooks/useFinanceQueries";

interface RetirementAccountListProps {
  onSelectAccount: (account: RetirementAccount) => void;
  onCreateAccount: () => void;
}

const PAGE_SIZE = 10;

export const RetirementAccountList: React.FC<RetirementAccountListProps> = ({
  onSelectAccount,
  onCreateAccount,
}) => {
  const [productFilter, setProductFilter] = useState<RetirementProductType | "ALL">("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([undefined]);
  const { data: institutions = [] } = useInstitutions({ limit: 100 });

  const getInstitutionInfo = (id: string | null) => {
    if (!id) return null;
    return institutions.find((i) => i.id === id) || null;
  };

  // Server-side cursor pagination — the shared page-number Pagination
  // component assumes a known total-page count, which a cursor API doesn't
  // give up front, so this feature drives its own Prev/Next off the API's
  // own hasMore/nextCursor rather than fetching everything and paging
  // client-side.
  const pageIndex = cursorStack.length - 1;
  const currentCursor = cursorStack[pageIndex];

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setCursorStack([undefined]);
  }, [productFilter, search]);

  const { data, isLoading, isError, error, refetch, isFetching } = useRetirementAccounts({
    productType: productFilter === "ALL" ? undefined : productFilter,
    search: search || undefined,
    cursor: currentCursor,
    limit: PAGE_SIZE,
  });

  const accounts = data?.data ?? [];

  const goNext = () => {
    if (data?.nextCursor) setCursorStack((s) => [...s, data.nextCursor]);
  };
  const goPrev = () => {
    setCursorStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setProductFilter("ALL")}
            aria-pressed={productFilter === "ALL"}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              productFilter === "ALL"
                ? "bg-slate-100 text-slate-900 border-slate-100"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            All
          </button>
          {PRODUCT_TYPE_LIST.map((pt) => {
            const cfg = PRODUCT_TYPE_CONFIG[pt];
            const isActive = productFilter === pt;
            return (
              <button
                key={pt}
                onClick={() => setProductFilter(pt)}
                aria-pressed={isActive}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  isActive ? "" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
                style={
                  isActive
                    ? { backgroundColor: `${cfg.color}25`, borderColor: `${cfg.color}60`, color: cfg.color }
                    : undefined
                }
              >
                {cfg.shortLabel}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search accounts…"
              aria-label="Search retirement accounts"
              className="pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 w-48"
            />
          </div>
          <button
            onClick={onCreateAccount}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-slate-950 font-bold text-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add Account
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 rounded-3xl bg-rose-500/5 border border-rose-500/20 text-center space-y-3">
          <p className="text-sm text-rose-400 font-semibold">
            {(error as { userMessage?: string })?.userMessage || "Failed to load retirement accounts."}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
          >
            Retry
          </button>
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={<PiggyBank className="w-8 h-8" aria-hidden="true" />}
          title="No retirement accounts yet"
          message="Add your EPF, PPF, NPS, or VPF account to track your retirement corpus."
          actionLabel="Add Retirement Account"
          actionIcon={<Plus className="w-4 h-4" />}
          onAction={onCreateAccount}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-3xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase font-semibold">
                  <th scope="col" className="px-4 py-3">Product</th>
                  <th scope="col" className="px-4 py-3">Name</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Last Updated</th>
                  <th scope="col" className="px-4 py-3 text-right">Current Value</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => {
                  const cfg = PRODUCT_TYPE_CONFIG[account.productType];
                  return (
                    <tr
                      key={account.id}
                      onClick={() => onSelectAccount(account)}
                      className="border-b border-slate-800/60 bg-slate-900/40 hover:bg-slate-900 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                          style={{ backgroundColor: `${cfg.color}1a`, borderColor: `${cfg.color}40`, color: cfg.color }}
                        >
                          {cfg.shortLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-100">{account.name}</p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          {account.employerName && <span>{account.employerName}</span>}
                          {account.employerName && getInstitutionInfo(account.institutionId) && <span>•</span>}
                          {(() => {
                            const inst = getInstitutionInfo(account.institutionId);
                            if (!inst) return null;
                            return (
                              <span className="inline-flex items-center gap-1">
                                {inst.logoUrl && (
                                  <img src={inst.logoUrl} alt="" className="w-3.5 h-3.5 rounded object-contain shrink-0" />
                                )}
                                <span>{inst.name}</span>
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                            account.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-slate-800 text-slate-300 border-slate-700"
                          }`}
                        >
                          {STATUS_LABELS[account.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">{formatDate(account.lastValuedAt)}</td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-100">
                        <MoneyDisplay value={account.currentBalance} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {accounts.map((account) => {
              const cfg = PRODUCT_TYPE_CONFIG[account.productType];
              return (
                <button
                  key={account.id}
                  onClick={() => onSelectAccount(account)}
                  className="w-full text-left p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                      style={{ backgroundColor: `${cfg.color}1a`, borderColor: `${cfg.color}40`, color: cfg.color }}
                    >
                      {cfg.shortLabel}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                        account.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-slate-800 text-slate-300 border-slate-700"
                      }`}
                    >
                      {STATUS_LABELS[account.status]}
                    </span>
                  </div>
                  <p className="font-bold text-slate-100 text-sm">{account.name}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                    {account.employerName && <span>{account.employerName}</span>}
                    {account.employerName && getInstitutionInfo(account.institutionId) && <span>•</span>}
                    {(() => {
                      const inst = getInstitutionInfo(account.institutionId);
                      if (!inst) return null;
                      return (
                        <span className="inline-flex items-center gap-1">
                          {inst.logoUrl && (
                            <img src={inst.logoUrl} alt="" className="w-3.5 h-3.5 rounded object-contain shrink-0" />
                          )}
                          <span>{inst.name}</span>
                        </span>
                      );
                    })()}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{formatDate(account.lastValuedAt)}</span>
                    <span className="font-bold text-slate-100">
                      <MoneyDisplay value={account.currentBalance} />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Cursor pagination footer */}
          <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
            <span>
              {data?.totalCount !== undefined ? `${data.totalCount} accounts total` : `${accounts.length} accounts`}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                disabled={pageIndex === 0 || isFetching}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-slate-300"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 font-bold text-slate-200">
                Page {pageIndex + 1}
              </span>
              <button
                onClick={goNext}
                disabled={!data?.hasMore || isFetching}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-slate-300"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
