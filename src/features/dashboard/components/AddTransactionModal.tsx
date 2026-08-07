import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, PlusCircle, ArrowUpRight, ArrowDownLeft, Wallet, Tag, Calendar, CheckCircle2 } from "lucide-react";
import { useCreateTransaction, useAccounts, useCategories } from "../../../hooks/useFinanceQueries";
import { useUIStore } from "../../../store/useUIStore";
import { AsyncSearchSelect } from "../../../components/common/AsyncSearchSelect";

export const AddTransactionModal: React.FC = () => {
  const { isAddTransactionOpen, setAddTransactionOpen, showToast } = useUIStore();
  const [accountSearch, setAccountSearch] = useState("");
  const { data: accounts = [], isFetching: isAccountsFetching } = useAccounts({
    search: accountSearch || undefined,
    limit: 100,
  });
  const [categorySearch, setCategorySearch] = useState("");
  const { data: categories = [], isFetching: isCategoriesFetching } = useCategories({
    search: categorySearch || undefined,
  });
  const createTxnMutation = useCreateTransaction();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"OUTFLOW" | "INFLOW">("OUTFLOW");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Category options are filtered to match the selected direction (only
  // expense categories for an outflow, only income categories for an inflow).
  const directionCategories = useMemo(
    () => categories.filter((c) => (c.kind ?? c.type) === (direction === "INFLOW" ? "INCOME" : "EXPENSE")),
    [categories, direction]
  );

  useEffect(() => {
    if (!directionCategories.some((c) => c.id === categoryId)) {
      setCategoryId(directionCategories[0]?.id ?? "");
    }
  }, [directionCategories, categoryId]);

  if (!isAddTransactionOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || parseFloat(amount) <= 0) {
      showToast("Please provide a valid description and amount", "error");
      return;
    }

    const selectedAccId = accountId || accounts[0]?.id;
    if (!selectedAccId) {
      showToast("Please select or add an account first", "error");
      return;
    }

    createTxnMutation.mutate(
      {
        accountId: selectedAccId,
        description,
        amount,
        direction: direction === "INFLOW" ? "INFLOW" : "OUTFLOW",
        categoryId: categoryId || undefined,
        transactionDate: date,
      },
      {
        onSuccess: () => {
          showToast("Transaction added successfully!", "success");
          setDescription("");
          setAmount("");
          setAddTransactionOpen(false);
        },
      }
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setAddTransactionOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-10 text-slate-100 space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-sans">Quick Add Transaction</h3>
                <p className="text-xs text-slate-400">Record a new inflow or expense to update live metrics</p>
              </div>
            </div>

            <button
              onClick={() => setAddTransactionOpen(false)}
              aria-label="Close"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Direction Selector */}
            <div className="grid grid-cols-2 gap-3 p-1 rounded-2xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => setDirection("OUTFLOW")}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  direction === "OUTFLOW"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ArrowUpRight className="w-4 h-4" /> Expense (Outflow)
              </button>
              <button
                type="button"
                onClick={() => setDirection("INFLOW")}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  direction === "INFLOW"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" /> Income (Inflow)
              </button>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-base font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Merchant</label>
              <input
                type="text"
                placeholder="e.g. Swiggy, Salary Credit, BESCOM Bill"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Account & Category Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-indigo-400" /> Account
                </label>
                <AsyncSearchSelect
                  value={accountId}
                  valueLabel={(() => {
                    const acc = accounts.find((a) => a.id === accountId);
                    return acc
                      ? `${acc.name} (${acc.currentBalance?.currency || "INR"} ${parseFloat(acc.currentBalance?.amount || "0").toLocaleString("en-IN")})`
                      : undefined;
                  })()}
                  items={accounts}
                  isFetching={isAccountsFetching}
                  onSearch={setAccountSearch}
                  onSelect={(acc) => setAccountId(acc.id)}
                  getOptionKey={(acc) => acc.id}
                  placeholder="Select account"
                  emptyMessage="No matching accounts"
                  renderOption={(acc) => (
                    <span className="truncate">
                      {acc.name} ({acc.currentBalance?.currency || "INR"} {parseFloat(acc.currentBalance?.amount || "0").toLocaleString("en-IN")})
                    </span>
                  )}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" /> Category
                </label>
                <AsyncSearchSelect
                  value={categoryId}
                  valueLabel={directionCategories.find((c) => c.id === categoryId)?.name || "Select Category..."}
                  items={directionCategories}
                  isFetching={isCategoriesFetching}
                  onSearch={setCategorySearch}
                  onSelect={(cat) => setCategoryId(cat.id)}
                  getOptionKey={(cat) => cat.id}
                  placeholder="Select Category..."
                  emptyMessage="No matching categories"
                  renderOption={(cat) => <span className="truncate">{cat.name}</span>}
                />
              </div>
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> Transaction Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={createTxnMutation.isPending}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{createTxnMutation.isPending ? "Recording Transaction..." : "Save Transaction"}</span>
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
