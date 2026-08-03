import React, { useState, useEffect } from "react";
import { LayoutDashboard, CreditCard as CreditCardIcon, Plus } from "lucide-react";
import { useUIStore } from "../../store/useUIStore";
import { CreditCardDashboard } from "./components/CreditCardDashboard";
import { CreditCardList } from "./components/CreditCardList";
import { CreditCardDetailsView } from "./components/CreditCardDetailsView";
import { AddCreditCardWizard } from "./components/AddCreditCardWizard";
import { EditCreditCardModal } from "./components/EditCreditCardModal";
import { RecordPaymentModal } from "./components/RecordPaymentModal";
import { CreditCard } from "../../types";

type ViewMode = "dashboard" | "list" | "detail";

export const CreditCardsView: React.FC = () => {
  const { activeSubTab } = useUIStore();
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Modals state
  const [isAddWizardOpen, setAddWizardOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [payingCard, setPayingCard] = useState<CreditCard | null>(null);

  // Sync activeSubTab into view mode
  useEffect(() => {
    if (activeSubTab) {
      if (activeSubTab === "cards-list") {
        setViewMode("list");
      } else if (["statements", "payments", "emis", "rewards"].includes(activeSubTab)) {
        setViewMode("list");
      }
    }
  }, [activeSubTab]);

  const handleSelectCard = (cardId: string) => {
    setSelectedCardId(cardId);
    setViewMode("detail");
  };

  const handleBackToList = () => {
    setSelectedCardId(null);
    setViewMode("list");
  };

  return (
    <div className="space-y-8">
      {/* Top Header & View Mode Switcher */}
      {viewMode !== "detail" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Credit Card Management</h1>
            <p className="text-xs text-slate-400">
              {activeSubTab
                ? `Section: ${activeSubTab.replace("-", " ").toUpperCase()}`
                : "Track credit limits, billing cycles, utilization ratios, statements, and reward points"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Switcher Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/80 border border-slate-800">
              <button
                onClick={() => {
                  setViewMode("dashboard");
                  setSelectedCardId(null);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  viewMode === "dashboard"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Executive Dashboard</span>
              </button>
              <button
                onClick={() => {
                  setViewMode("list");
                  setSelectedCardId(null);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  viewMode === "list"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <CreditCardIcon className="w-4 h-4" />
                <span>Card List</span>
              </button>
            </div>

            <button
              onClick={() => setAddWizardOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" /> Add Credit Card
            </button>
          </div>
        </div>
      )}

      {/* Main View Area */}
      {viewMode === "dashboard" && (
        <CreditCardDashboard onAddCard={() => setAddWizardOpen(true)} />
      )}

      {viewMode === "list" && (
        <CreditCardList
          onSelectCard={handleSelectCard}
          onAddCard={() => setAddWizardOpen(true)}
          onEditCard={(card) => setEditingCard(card)}
          onPayCard={(card) => setPayingCard(card)}
        />
      )}

      {viewMode === "detail" && selectedCardId && (
        <CreditCardDetailsView
          cardId={selectedCardId}
          onBack={handleBackToList}
          onEditCard={(card) => setEditingCard(card)}
          onPayCard={(card) => setPayingCard(card)}
        />
      )}

      {/* Global Modals */}
      <AddCreditCardWizard isOpen={isAddWizardOpen} onClose={() => setAddWizardOpen(false)} />

      <EditCreditCardModal
        card={editingCard}
        isOpen={Boolean(editingCard)}
        onClose={() => setEditingCard(null)}
      />

      <RecordPaymentModal
        card={payingCard}
        isOpen={Boolean(payingCard)}
        onClose={() => setPayingCard(null)}
      />
    </div>
  );
};
