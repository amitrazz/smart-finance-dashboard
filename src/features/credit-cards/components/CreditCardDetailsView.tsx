import React, { useState } from "react";
import {
  CreditCard as CreditCardIcon,
  ArrowLeft,
  DollarSign,
  Edit2,
  AlertTriangle,
  RefreshCw,
  Layers,
  FileText,
  Award,
  ShieldCheck,
  Zap,
  Trash2,
} from "lucide-react";
import { useCreditCard, useDeleteCreditCard } from "../hooks/useCreditCardQueries";
import { formatCurrency } from "../../../utils/formatters";
import { OverviewTab } from "./OverviewTab";
import { StatementsTab } from "./StatementsTab";
import { PaymentsTab } from "./PaymentsTab";
import { CardTransactionsTab } from "./CardTransactionsTab";
import { CardEmisTab } from "./CardEmisTab";
import { CardRewardsTab } from "./CardRewardsTab";
import { CardDocumentsTab } from "./CardDocumentsTab";
import { CardSettingsTab } from "./CardSettingsTab";
import { CreditCard } from "../../../types";
import { ConfirmModal } from "../../../components/common/ConfirmModal";
import { NAV_TAB_L2 } from "../../../styles/navTabTokens";

interface CreditCardDetailsViewProps {
  cardId: string;
  onBack: () => void;
  onEditCard: (card: CreditCard) => void;
  onPayCard: (card: CreditCard) => void;
}

type DetailTab = "overview" | "statements" | "payments" | "transactions" | "emis" | "rewards" | "documents" | "settings";

export const CreditCardDetailsView: React.FC<CreditCardDetailsViewProps> = ({
  cardId,
  onBack,
  onEditCard,
  onPayCard,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const { data: card, isLoading, isError, error, refetch } = useCreditCard(cardId);
  const deleteCardMutation = useDeleteCreditCard();

  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = () => {
    if (card) {
      deleteCardMutation.mutate(
        { id: card.id, version: card.version || 1 },
        {
          onSuccess: () => {
            setIsDeleting(false);
            onBack();
          },
        }
      );
    }
  };

  const getVal = (val: unknown): number => {
    if (typeof val === "object" && val !== null) return parseFloat((val as { amount?: string }).amount || "0");
    if (typeof val === "number") return val;
    if (typeof val === "string") return parseFloat(val) || 0;
    return 0;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-2">
        <div className="h-10 bg-slate-800/80 rounded-xl w-1/4" />
        <div className="h-48 bg-slate-900/60 rounded-3xl border border-slate-800" />
        <div className="h-64 bg-slate-900/60 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  if (isError || !card) {
    return (
      <div className="p-10 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Failed to Load Credit Card Details</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not retrieve details for the specified credit card."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Back to List
          </button>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const outstanding = getVal(card?.currentOutstanding);
  const limit = getVal(card?.creditLimit);
  const available = getVal(card?.availableCredit) || Math.max(0, limit - outstanding);
  const statementBal = getVal(card?.statementBalance);
  const minDue = getVal(card?.minimumDue);

  const tabs: Array<{ id: DetailTab; label: string; icon: React.ReactNode }> = [
    { id: "overview", label: "Overview", icon: <CreditCardIcon className="w-4 h-4" /> },
    { id: "statements", label: "Statements", icon: <FileText className="w-4 h-4" /> },
    { id: "payments", label: "Payments", icon: <DollarSign className="w-4 h-4" /> },
    { id: "transactions", label: "Transactions", icon: <Zap className="w-4 h-4" /> },
    { id: "emis", label: "EMIs", icon: <Layers className="w-4 h-4" /> },
    { id: "rewards", label: "Rewards", icon: <Award className="w-4 h-4" /> },
    { id: "documents", label: "Documents", icon: <FileText className="w-4 h-4" /> },
    { id: "settings", label: "Settings", icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Credit Cards
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPayCard(card)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-all shadow-lg shadow-emerald-500/20"
          >
            <DollarSign className="w-4 h-4" /> Pay Bill
          </button>
          <button
            onClick={() => onEditCard(card)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            <Edit2 className="w-4 h-4" /> Edit Card
          </button>
          <button
            onClick={() => setIsDeleting(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition-all"
            title="Delete Credit Card"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* Card Executive Summary Header Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <CreditCardIcon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-100">{card.nickname}</h2>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                    card.status === "ACTIVE"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : card.status === "BLOCKED"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  {card.status || "ACTIVE"}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {card.issuer || "Bank Issuer"} • {`•••• ${card.lastFourDigits || "0000"}`} • {card.network || "VISA"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-400 font-medium">Current Outstanding</p>
              <p className="text-2xl font-extrabold text-slate-100">
                {formatCurrency({ amount: outstanding.toFixed(2), currency: card.currency || "INR" })}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Position Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">Available Credit</span>
            <span className="text-base font-bold text-emerald-400">
              {formatCurrency({ amount: available.toFixed(2), currency: card.currency || "INR" })}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">Credit Limit</span>
            <span className="text-base font-bold text-slate-200">
              {formatCurrency({ amount: limit.toFixed(2), currency: card.currency || "INR" })}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">Statement Balance</span>
            <span className="text-base font-bold text-slate-200">
              {formatCurrency({ amount: statementBal.toFixed(2), currency: card.currency || "INR" })}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">Minimum Due</span>
            <span className="text-base font-bold text-amber-400">
              {formatCurrency({ amount: minDue.toFixed(2), currency: card.currency || "INR" })}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === tab.id
                ? `${NAV_TAB_L2}`
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Tab Render */}
      <div className="space-y-6">
        {activeTab === "overview" && <OverviewTab cardId={cardId} />}
        {activeTab === "statements" && <StatementsTab cardId={cardId} onPayCard={onPayCard} />}
        {activeTab === "payments" && <PaymentsTab cardId={cardId} onRecordPayment={() => onPayCard(card)} />}
        {activeTab === "transactions" && <CardTransactionsTab cardId={cardId} />}
        {activeTab === "emis" && <CardEmisTab cardId={cardId} />}
        {activeTab === "rewards" && <CardRewardsTab cardId={cardId} />}
        {activeTab === "documents" && <CardDocumentsTab cardId={cardId} />}
        {activeTab === "settings" && <CardSettingsTab cardId={cardId} onEditCard={onEditCard} />}
      </div>

      {/* Styled Confirmation Modal for Delete */}
      <ConfirmModal
        isOpen={isDeleting}
        title="Delete Credit Card?"
        message={`Are you sure you want to delete credit card "${card.nickname}"? All associated statements, payments, and limit history will be permanently removed.`}
        confirmText="Delete Credit Card"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteCardMutation.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setIsDeleting(false)}
      />
    </div>
  );
};
