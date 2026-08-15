import React, { useEffect, useState } from "react";
import { X, PiggyBank, ReceiptText, Pencil, Lock, RotateCcw, Wallet } from "lucide-react";
import { RetirementAccount, RetirementAccountStatus } from "../../../types";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { Money as MoneyDisplay } from "../../../components/common/Money";
import { PRODUCT_TYPE_CONFIG, STATUS_LABELS, TRANSACTION_TYPE_LABELS } from "../constants/productTypes";
import { TransactionTypeBadge } from "./TransactionTypeBadge";
import { ConfirmModal } from "../../../components/common/ConfirmModal";
import { EmptyState } from "../../../components/common/EmptyState";
import { useAccounts, useInstitution } from "../../../hooks/useFinanceQueries";
import { AsyncSearchSelect } from "../../../components/common/AsyncSearchSelect";
import { InstitutionPicker } from "../../../components/common/InstitutionPicker";
import {
  useCloseRetirementAccount,
  useRetirementAccount,
  useRetirementTransactions,
  useReverseRetirementTransaction,
  useUpdateRetirementAccount,
} from "../hooks/useRetirementQueries";

interface RetirementAccountDetailDrawerProps {
  account: RetirementAccount | null;
  onClose: () => void;
  onRecordTransaction: (account: RetirementAccount) => void;
}

const CLOSE_STATUS_OPTIONS: { value: Extract<RetirementAccountStatus, "MATURED" | "CLOSED" | "TRANSFERRED_OUT">; label: string }[] = [
  { value: "MATURED", label: "Matured" },
  { value: "CLOSED", label: "Closed" },
  { value: "TRANSFERRED_OUT", label: "Transferred Out" },
];

export const RetirementAccountDetailDrawer: React.FC<RetirementAccountDetailDrawerProps> = ({
  account,
  onClose,
  onRecordTransaction,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editInstitutionId, setEditInstitutionId] = useState<string | undefined>(undefined);
  const [editInstitutionName, setEditInstitutionName] = useState<string | undefined>(undefined);
  const [editAccountNumber, setEditAccountNumber] = useState("");
  const [editOpenedDate, setEditOpenedDate] = useState("");
  const [editMaturityDate, setEditMaturityDate] = useState("");
  const [editInterestRate, setEditInterestRate] = useState("");
  const [editEmployerName, setEditEmployerName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editLinkedAccountId, setEditLinkedAccountId] = useState("");
  const [linkedAccountSearch, setLinkedAccountSearch] = useState("");

  const [closeStatus, setCloseStatus] = useState<(typeof CLOSE_STATUS_OPTIONS)[number]["value"]>("MATURED");
  const [isCloseConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [pendingReverseId, setPendingReverseId] = useState<string | null>(null);
  const [version, setVersion] = useState<number | undefined>(undefined);

  const updateMutation = useUpdateRetirementAccount();
  const closeMutation = useCloseRetirementAccount();
  const reverseMutation = useReverseRetirementTransaction();

  const { data: fetchedAccount } = useRetirementAccount(account?.id || "");

  const { data: transactionsPage, isLoading: isTransactionsLoading } = useRetirementTransactions(
    account ? { retirementAccountId: account.id, limit: 25 } : undefined,
  );
  const { data: linkedAccountResults = [], isFetching: isLinkedAccountFetching } = useAccounts({
    search: linkedAccountSearch || undefined,
    limit: 20,
  });
  const { data: institution } = useInstitution(account?.institutionId || "");

  useEffect(() => {
    if (account) {
      setEditName(account.name);
      setEditInstitutionId(account.institutionId || undefined);
      setEditInstitutionName(undefined);
      setEditAccountNumber(account.accountNumber ?? "");
      setEditOpenedDate(account.openedDate ?? "");
      setEditMaturityDate(account.maturityDate ?? "");
      setEditInterestRate(account.interestRate ?? "");
      setEditEmployerName(account.employerName ?? "");
      setEditNotes(account.notes ?? "");
      setEditLinkedAccountId(account.linkedAccountId ?? "");
      setIsEditing(false);
      setVersion(account.version);
    }
  }, [account]);

  useEffect(() => {
    if (fetchedAccount) {
      setVersion(fetchedAccount.version);
    }
  }, [fetchedAccount]);

  if (!account) return null;

  const config = PRODUCT_TYPE_CONFIG[account.productType];
  const isClosed = account.status !== "ACTIVE";
  const transactions = transactionsPage?.data ?? [];
  const selectedLinkedAccount = linkedAccountResults.find((a) => a.id === editLinkedAccountId);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(
      {
        id: account.id,
        data: {
          name: editName,
          institutionId: editInstitutionId || undefined,
          accountNumber: editAccountNumber || undefined,
          openedDate: editOpenedDate || undefined,
          maturityDate: editMaturityDate || undefined,
          interestRate: editInterestRate || undefined,
          employerName: config.allowsEmployerContribution ? editEmployerName || undefined : undefined,
          notes: editNotes || undefined,
          linkedAccountId: editLinkedAccountId || undefined,
        },
        version: version ?? account.version ?? 1,
      },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  const handleConfirmClose = () => {
    closeMutation.mutate(
      { id: account.id, data: { status: closeStatus }, version: version ?? account.version ?? 1 },
      { onSuccess: () => setCloseConfirmOpen(false) },
    );
  };

  const handleConfirmReverse = () => {
    if (!pendingReverseId) return;
    const tx = transactions.find((t) => t.id === pendingReverseId);
    reverseMutation.mutate(
      { id: pendingReverseId, version: tx?.version ?? 1, retirementAccountId: account.id },
      { onSuccess: () => setPendingReverseId(null) },
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end">
      <div className="relative w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-bold border"
                style={{
                  backgroundColor: `${config.color}1a`,
                  borderColor: `${config.color}40`,
                  color: config.color,
                }}
              >
                {config.shortLabel}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  account.status === "ACTIVE"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-slate-800 text-slate-300 border-slate-700"
                }`}
              >
                {STATUS_LABELS[account.status]}
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-100">{account.name}</h3>
            {account.employerName && <p className="text-xs text-slate-400">{account.employerName}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Balance Hero */}
          <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
            <div>
              <span className="text-xs text-slate-400 font-semibold block">Current Value</span>
              <span className="text-3xl font-extrabold text-slate-100 font-mono">
                <MoneyDisplay value={account.currentBalance} />
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-800">
              <div>
                <span className="text-slate-400 block">Contributions</span>
                <span className="font-bold text-slate-200">
                  <MoneyDisplay value={account.totalContributions} fractionDigits={0} />
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Interest</span>
                <span className="font-bold text-emerald-400">
                  <MoneyDisplay value={account.totalInterestEarned} fractionDigits={0} />
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Withdrawals</span>
                <span className="font-bold text-rose-400">
                  <MoneyDisplay value={account.totalWithdrawals} fractionDigits={0} />
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500">As of {formatDate(account.lastValuedAt)}</p>
          </div>

          {/* Actions */}
          {!isClosed && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onRecordTransaction(account)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs"
              >
                <ReceiptText className="w-4 h-4" /> Record Transaction
              </button>
              <button
                onClick={() => setIsEditing((v) => !v)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                <Pencil className="w-4 h-4" /> {isEditing ? "Cancel Edit" : "Edit Details"}
              </button>
              <button
                onClick={() => setCloseConfirmOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 font-bold text-xs ml-auto"
              >
                <Lock className="w-4 h-4" /> Close Account
              </button>
            </div>
          )}

          {/* Edit form */}
          {isEditing && (
            <form
              onSubmit={handleSaveEdit}
              className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4"
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Edit Metadata</h4>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label htmlFor="edit-retirement-institution" className="block text-xs font-semibold text-slate-300 mb-1.5">Institution</label>
                  <InstitutionPicker
                    id="edit-retirement-institution"
                    value={editInstitutionId}
                    valueLabel={editInstitutionName || institution?.name || undefined}
                    onChange={(id, inst) => {
                      setEditInstitutionId(id);
                      setEditInstitutionName(inst?.name);
                    }}
                    placeholder="e.g. EPFO, ICICI Bank, HDFC Bank…"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Account Number</label>
                  <input
                    type="text"
                    placeholder="e.g. UAN / PRAN / PPF No"
                    value={editAccountNumber}
                    onChange={(e) => setEditAccountNumber(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editInterestRate}
                    onChange={(e) => setEditInterestRate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Opened Date</label>
                  <input
                    type="date"
                    value={editOpenedDate}
                    onChange={(e) => setEditOpenedDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Maturity Date</label>
                  <input
                    type="date"
                    value={editMaturityDate}
                    onChange={(e) => setEditMaturityDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              {config.allowsEmployerContribution && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Employer Name</label>
                  <input
                    type="text"
                    value={editEmployerName}
                    onChange={(e) => setEditEmployerName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Linked Bank Account</label>
                <AsyncSearchSelect
                  value={editLinkedAccountId}
                  valueLabel={selectedLinkedAccount ? selectedLinkedAccount.name : undefined}
                  items={linkedAccountResults}
                  isFetching={isLinkedAccountFetching}
                  onSearch={setLinkedAccountSearch}
                  onSelect={(acc) => setEditLinkedAccountId(acc.id)}
                  onClear={() => setEditLinkedAccountId("")}
                  getOptionKey={(acc) => acc.id}
                  icon={<Wallet className="w-4 h-4 text-slate-500 shrink-0" />}
                  placeholder="Select an account…"
                  emptyMessage="No matching accounts"
                  renderOption={(acc) => <span className="truncate">{acc.name}</span>}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold disabled:opacity-50"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 col-span-2">
              <span className="text-slate-400 block">Institution</span>
              <span className="font-semibold text-slate-200 flex items-center gap-2 mt-0.5">
                {institution?.logoUrl && (
                  <img src={institution.logoUrl} alt="" className="w-5 h-5 rounded object-contain shrink-0" />
                )}
                {account.institutionId ? (institution?.name || "Loading...") : "Independent / Cash"}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block">Account Number</span>
              <span className="font-semibold text-slate-200">{account.accountNumber || "—"}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block">Interest Rate</span>
              <span className="font-semibold text-slate-200">
                {account.interestRate ? `${account.interestRate}%` : "—"}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block">Opened</span>
              <span className="font-semibold text-slate-200">
                {account.openedDate ? formatDate(account.openedDate) : "—"}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block">Maturity</span>
              <span className="font-semibold text-slate-200">
                {account.maturityDate ? formatDate(account.maturityDate) : "—"}
              </span>
            </div>
          </div>
          {account.notes && (
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400 block mb-1">Notes</span>
              <span className="text-slate-300">{account.notes}</span>
            </div>
          )}

          {/* Transactions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <PiggyBank className="w-4 h-4" /> Transactions
            </h4>

            {isTransactionsLoading ? (
              <div className="space-y-2 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-2xl bg-slate-950 border border-slate-800" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <EmptyState
                title="No transactions yet"
                message="Record a contribution, interest credit, or withdrawal to see it here."
              />
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <TransactionTypeBadge type={tx.type} />
                      <p className="text-[11px] text-slate-500">{formatDate(tx.transactionDate)}</p>
                      {tx.notes && <p className="text-[11px] text-slate-500 truncate">{tx.notes}</p>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-sm text-slate-100">{formatCurrency(tx.amount)}</span>
                      <button
                        onClick={() => setPendingReverseId(tx.id)}
                        title="Reverse Transaction"
                        aria-label={`Reverse ${TRANSACTION_TYPE_LABELS[tx.type].label} transaction`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isCloseConfirmOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="close-retirement-account-title"
        >
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <h3 id="close-retirement-account-title" className="font-bold text-lg text-slate-100">
              Close {account.name}?
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Choose the reason this account is being closed. Its current balance and transaction history are kept
              for your records — closed accounts just stop accepting new transactions.
            </p>
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
              Current balance: <span className="font-semibold">{formatCurrency(account.currentBalance)}</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Reason</label>
              <div className="flex items-center gap-2 flex-wrap">
                {CLOSE_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCloseStatus(opt.value)}
                    aria-pressed={closeStatus === opt.value}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      closeStatus === opt.value
                        ? "bg-rose-500/15 border-rose-500/40 text-rose-300"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCloseConfirmOpen(false)}
                disabled={closeMutation.isPending}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                disabled={closeMutation.isPending}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs disabled:opacity-50"
              >
                {closeMutation.isPending ? "Closing..." : "Close Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={pendingReverseId !== null}
        title="Reverse Transaction?"
        message="This action will reverse the financial effect of this transaction. The original transaction will remain in the audit history."
        impactDetails="Account balance, any bridged bank transaction, and this account's summary will be recomputed."
        confirmText="Reverse Transaction"
        variant="warning"
        isLoading={reverseMutation.isPending}
        onConfirm={handleConfirmReverse}
        onClose={() => setPendingReverseId(null)}
      />
    </div>
  );
};
