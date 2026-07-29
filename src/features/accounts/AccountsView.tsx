import React, { useState } from "react";
import { useAccounts, useCreateAccount } from "../../hooks/useFinanceQueries";
import { formatCurrency } from "../../utils/formatters";
import { Account, AccountType } from "../../types";
import { Landmark, CreditCard, Wallet, ShieldAlert, Plus, RefreshCw, X, Check, AlertTriangle } from "lucide-react";

export const AccountsView: React.FC = () => {
  const { data: accounts = [], isLoading, isError, error, refetch } = useAccounts();
  const createAccountMutation = useCreateAccount();

  const [isModalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("SAVINGS");
  const [balance, setBalance] = useState("0");
  const [currency, setCurrency] = useState("INR");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAccountMutation.mutate(
      {
        name,
        type,
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
          setBalance("0");
        },
      }
    );
  };

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

  return (
    <div className="space-y-8">
      {/* Header & Quick Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Accounts & Cash Position</h2>
          <p className="text-xs text-slate-400">Real-world connected banks, credit cards, loans, wallets, and cash reserves</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((acc: Account) => (
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
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {acc.status}
                </span>
              </div>

              <div className="flex items-end justify-between border-t border-slate-800/80 pt-4">
                <div>
                  <p className="text-xs text-slate-400">Current Balance</p>
                  <p className="text-xl font-bold text-slate-100">{formatCurrency(acc.currentBalance)}</p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <RefreshCw className="w-3 h-3 text-slate-500" />
                  <span>Synced {acc.updatedAt ? new Date(acc.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "recently"}</span>
                </div>
              </div>
            </div>
          ))}
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
    </div>
  );
};
