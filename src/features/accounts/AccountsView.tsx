import React, { useState } from "react";
import { useAccounts, useCreateAccount, useDeleteAccount, useInstitutions, useCreditCards } from "../../hooks/useFinanceQueries";
import { formatCurrency, formatLastSyncedAt } from "../../utils/formatters";
import { Account, AccountType, AccountStatus, FinancialInstitution } from "../../types";
import { Landmark, CreditCard, Wallet, ShieldAlert, Plus, RefreshCw, X, Check, AlertTriangle, Building2, Trash2 } from "lucide-react";
import { AddCreditCardModal } from "../credit-cards/components/AddCreditCardModal";
import { AddInstitutionModal } from "../institutions/components/AddInstitutionModal";
import { Pagination } from "../../components/common/Pagination";

export const AccountsView: React.FC = () => {
  const { data: accounts = [], isLoading, isError, error, refetch } = useAccounts();
  const { data: institutions = [] } = useInstitutions();
  const { data: rawCreditCards = [] } = useCreditCards();
  const createAccountMutation = useCreateAccount();
  const deleteAccountMutation = useDeleteAccount();

  const handleDeleteAccount = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete account "${name}"? This action cannot be undone.`)) {
      deleteAccountMutation.mutate({ id });
    }
  };

  const [activeViewTab, setActiveViewTab] = useState<"all" | "credit-cards" | "institutions">("all");
  const [isModalOpen, setModalOpen] = useState(false);
  const [isCreditCardModalOpen, setCreditCardModalOpen] = useState(false);
  const [isInstitutionModalOpen, setInstitutionModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("SAVINGS");
  const [institutionId, setInstitutionId] = useState("");
  const [balance, setBalance] = useState("0");
  const [currency, setCurrency] = useState("INR");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAccountMutation.mutate(
      {
        name,
        type,
        institutionId: institutionId || undefined,
        openingBalance: balance,
        currentBalance: { amount: balance, currency },
        status: "ACTIVE",
        isManual: true,
        currency,
      },
      {
        onSuccess: () => {
          setModalOpen(false);
          setName("");
          setInstitutionId("");
          setBalance("0");
        },
      }
    );
  };

  const creditCardAccounts = React.useMemo(() => {
    const accCards = accounts.filter((a) => a.type === "CREDIT_CARD");
    const existingIds = new Set(accCards.map((a) => a.id));
    const convertedFromApi: Account[] = rawCreditCards
      .filter((c) => !existingIds.has(c.id))
      .map((c) => ({
        id: c.id,
        name: c.name,
        type: "CREDIT_CARD" as AccountType,
        currentBalance: typeof c.currentBalance === "object" && c.currentBalance !== null
          ? c.currentBalance
          : { amount: String(c.currentBalance || c.creditLimit || "0"), currency: c.currency || "INR" },
        status: (c.status as AccountStatus) || "ACTIVE",
        isManual: true,
        currency: c.currency || "INR",
        maskedNumber: c.maskedNumber,
        updatedAt: c.updatedAt,
        lastSyncedAt: c.lastSyncedAt,
      }));
    return [...accCards, ...convertedFromApi];
  }, [accounts, rawCreditCards]);

  const getAccountIcon = (accType: AccountType) => {
    switch (accType) {
      case "CREDIT_CARD":
        return <CreditCard className="w-5 h-5 text-indigo-400" />;
      case "LOAN":
        return <ShieldAlert className="w-5 h-5 text-rose-400" />;
      case "WALLET":
      case "CASH":
        return <Wallet className="w-5 h-5 text-amber-400" />;
      default:
        return <Landmark className="w-5 h-5 text-emerald-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-slate-900/60 rounded-2xl border border-slate-800" />
          <div className="h-32 bg-slate-900/60 rounded-2xl border border-slate-800" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Failed to Load Accounts</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not fetch user accounts."}
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

  const totalAssets = accounts
    .filter((a) => a.type !== "LOAN" && a.type !== "CREDIT_CARD")
    .reduce((acc, a) => acc + parseFloat(a.currentBalance?.amount || "0"), 0);

  const totalLiabilities = accounts
    .filter((a) => a.type === "LOAN" || a.type === "CREDIT_CARD")
    .reduce((acc, a) => acc + parseFloat(a.currentBalance?.amount || "0"), 0);

  const totalCreditDebt = creditCardAccounts.reduce(
    (acc, a) => acc + parseFloat(a.currentBalance?.amount || "0"),
    0
  );

  return (
    <div className="space-y-8">
      {/* Header & View Option Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Accounts & Cash Position</h2>
          <p className="text-xs text-slate-400">View and manage bank accounts, credit cards, and financial institutions</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setInstitutionModalOpen(true)}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all border border-slate-700"
          >
            <Building2 className="w-4 h-4 text-cyan-400" /> Add Institution
          </button>
          <button
            onClick={() => setCreditCardModalOpen(true)}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all border border-slate-700"
          >
            <CreditCard className="w-4 h-4 text-indigo-400" /> Add Credit Card
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" /> Add Account
          </button>
        </div>
      </div>

      {/* View Options Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 w-fit">
        <button
          onClick={() => {
            setActiveViewTab("all");
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeViewTab === "all"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Landmark className="w-4 h-4" />
          All Accounts ({accounts.length})
        </button>
        <button
          onClick={() => {
            setActiveViewTab("credit-cards");
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeViewTab === "credit-cards"
              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Credit Cards ({creditCardAccounts.length})
        </button>
        <button
          onClick={() => {
            setActiveViewTab("institutions");
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeViewTab === "institutions"
              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Institutions ({institutions.length})
        </button>
      </div>

      {/* View Tab Content: ALL ACCOUNTS */}
      {activeViewTab === "all" && (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <p className="text-xs font-semibold text-slate-400">Liquid Cash & Assets</p>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">
                {formatCurrency({ amount: totalAssets.toFixed(2), currency: "INR" })}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <p className="text-xs font-semibold text-slate-400">Total Account Debt</p>
              <p className="text-2xl font-extrabold text-rose-400 mt-1">
                {formatCurrency({ amount: totalLiabilities.toFixed(2), currency: "INR" })}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <p className="text-xs font-semibold text-slate-400">Active Accounts</p>
              <p className="text-2xl font-extrabold text-slate-100 mt-1">{accounts.length}</p>
            </div>
          </div>

          {/* Account Cards Grid */}
          {accounts.length === 0 ? (
            <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
              <Landmark className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-base font-semibold text-slate-200">No Accounts Linked</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Click "Add Account" above to link a bank account or credit card.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accounts
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((acc: Account) => (
                    <div
                      key={acc.id}
                      className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">{getAccountIcon(acc.type)}</div>
                          <div>
                            <h3 className="font-bold text-base text-slate-100">{acc.name}</h3>
                            <p className="text-xs text-slate-400">
                              {acc.institution?.name || "Manual Account"} • {acc.maskedNumber || acc.type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {acc.status}
                          </span>
                          <button
                            onClick={() => handleDeleteAccount(acc.id, acc.name)}
                            title="Delete Account"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-end justify-between border-t border-slate-800/80 pt-4">
                        <div>
                          <p className="text-xs text-slate-400">Current Balance</p>
                          <p className="text-xl font-bold text-slate-100">{formatCurrency(acc.currentBalance)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <RefreshCw className="w-3 h-3 text-slate-500" />
                          <span>Synced {formatLastSyncedAt(acc.lastSyncedAt || acc.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(accounts.length / pageSize) || 1}
                totalItems={accounts.length}
                pageSize={pageSize}
                onPageChange={(page) => setCurrentPage(page)}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[6, 12, 24]}
              />
            </div>
          )}
        </div>
      )}

      {/* View Tab Content: CREDIT CARDS */}
      {activeViewTab === "credit-cards" && (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <p className="text-xs font-semibold text-slate-400">Total Credit Outstanding</p>
              <p className="text-2xl font-extrabold text-indigo-400 mt-1">
                {formatCurrency({ amount: totalCreditDebt.toFixed(2), currency: "INR" })}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <p className="text-xs font-semibold text-slate-400">Active Credit Cards</p>
              <p className="text-2xl font-extrabold text-slate-100 mt-1">{creditCardAccounts.length}</p>
            </div>
          </div>

          {/* Cards Grid / Empty State */}
          {creditCardAccounts.length === 0 ? (
            <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
              <CreditCard className="w-12 h-12 text-indigo-400/60 mx-auto" />
              <div>
                <h3 className="text-base font-semibold text-slate-200">No Credit Cards Tracked</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Add credit cards to track billing cycles, limits, and outstanding balances.
                </p>
              </div>
              <button
                onClick={() => setCreditCardModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" /> Add Credit Card
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {creditCardAccounts.map((acc: Account) => (
                <div
                  key={acc.id}
                  className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-100">{acc.name}</h3>
                        <p className="text-xs text-slate-400">
                          {acc.institution?.name || "Credit Account"} • {acc.maskedNumber || "••••"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {acc.status}
                      </span>
                      <button
                        onClick={() => handleDeleteAccount(acc.id, acc.name)}
                        title="Delete Credit Card"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-end justify-between border-t border-slate-800/80 pt-4">
                    <div>
                      <p className="text-xs text-slate-400">Current Balance / Outstanding</p>
                      <p className="text-xl font-bold text-indigo-300">{formatCurrency(acc.currentBalance)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <RefreshCw className="w-3 h-3 text-slate-500" />
                      <span>Synced {formatLastSyncedAt(acc.lastSyncedAt || acc.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View Tab Content: INSTITUTIONS */}
      {activeViewTab === "institutions" && (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <p className="text-xs font-semibold text-slate-400">Connected Institutions</p>
              <p className="text-2xl font-extrabold text-cyan-400 mt-1">{institutions.length}</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <p className="text-xs font-semibold text-slate-400">Linked Accounts</p>
              <p className="text-2xl font-extrabold text-slate-100 mt-1">
                {accounts.filter((a) => a.institutionId || a.institution?.id).length}
              </p>
            </div>
          </div>

          {/* Institutions Grid / Empty State */}
          {institutions.length === 0 ? (
            <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
              <Building2 className="w-12 h-12 text-cyan-400/60 mx-auto" />
              <div>
                <h3 className="text-base font-semibold text-slate-200">No Financial Institutions Linked</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Connect or add financial institutions to group bank accounts, cards, and investments.
                </p>
              </div>
              <button
                onClick={() => setInstitutionModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all shadow-lg shadow-cyan-600/20"
              >
                <Plus className="w-4 h-4" /> Add Institution
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {institutions.map((inst: FinancialInstitution) => {
                const linkedAccounts = accounts.filter(
                  (a) => a.institutionId === inst.id || a.institution?.id === inst.id
                );
                return (
                  <div
                    key={inst.id}
                    className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                          {inst.logoUrl ? (
                            <img src={inst.logoUrl} alt={inst.name} className="w-5 h-5 object-contain" />
                          ) : (
                            <Building2 className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-slate-100">{inst.name}</h3>
                          <p className="text-xs text-slate-400">
                            {inst.type || "Financial Provider"} {inst.countryCode ? `• ${inst.countryCode}` : ""}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {linkedAccounts.length} {linkedAccounts.length === 1 ? "Account" : "Accounts"}
                      </span>
                    </div>

                    <div className="border-t border-slate-800/80 pt-3">
                      <p className="text-xs font-semibold text-slate-400 mb-2">Linked Accounts:</p>
                      {linkedAccounts.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No accounts currently attached</p>
                      ) : (
                        <div className="space-y-1.5">
                          {linkedAccounts.map((a) => (
                            <div key={a.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-800/40">
                              <span className="text-slate-200 font-medium">{a.name}</span>
                              <span className="text-slate-400 font-semibold">{formatCurrency(a.currentBalance)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-slate-100">Add New Account</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. HDFC Salary Account"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Financial Institution (Optional)</label>
                <select
                  value={institutionId}
                  onChange={(e) => setInstitutionId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Select Institution (Manual / None) --</option>
                  {institutions.map((inst: FinancialInstitution) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} {inst.type ? `(${inst.type})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Account Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AccountType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none"
                  >
                    <option value="SAVINGS">Savings</option>
                    <option value="CHECKING">Checking</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="INVESTMENT">Investment</option>
                    <option value="LOAN">Loan</option>
                    <option value="WALLET">Wallet</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Currency</label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Initial / Current Balance</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAccountMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm"
                >
                  <Check className="w-4 h-4" /> Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credit Card and Institution Modals */}
      <AddCreditCardModal isOpen={isCreditCardModalOpen} onClose={() => setCreditCardModalOpen(false)} />
      <AddInstitutionModal isOpen={isInstitutionModalOpen} onClose={() => setInstitutionModalOpen(false)} />
    </div>
  );
};
