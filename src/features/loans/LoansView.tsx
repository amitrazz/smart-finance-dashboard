import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  List,
  AlertTriangle,
  RefreshCw,
  Eye,
} from "lucide-react";
import { useUIStore } from "../../store/useUIStore";
import { useLoans } from "./hooks/useLoanQueries";
import { LoanDashboard } from "./components/LoanDashboard";
import { LoanListTable } from "./components/LoanListTable";
import { LoanDetailsView } from "./components/LoanDetailsView";
import { CreateLoanWizardModal } from "./components/CreateLoanWizardModal";
import { EditLoanModal } from "./components/EditLoanModal";
import { RecordPaymentModal } from "./components/RecordPaymentModal";
import { ChangeInterestRateModal } from "./components/ChangeInterestRateModal";
import { Loan } from "../../types";
import { NAV_TAB_L2 } from "../../styles/navTabTokens";

export const LoansView: React.FC = () => {
  const { activeSubTab } = useUIStore();
  const { data: loans = [], isLoading, isError, error, refetch } = useLoans();

  const [activeTab, setActiveTab] = useState<"dashboard" | "list" | "details">("dashboard");
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  // Sync activeSubTab into view state
  useEffect(() => {
    if (activeSubTab) {
      if (["all-loans", "debt-accounts"].includes(activeSubTab)) {
        setActiveTab("list");
      } else if (["payment-history", "schedule"].includes(activeSubTab)) {
        if (loans.length > 0) {
          if (!selectedLoanId) {
            setSelectedLoanId(loans[0].id);
          }
          setActiveTab("details");
        } else {
          setActiveTab("list");
        }
      }
    }
  }, [activeSubTab, loans, selectedLoanId]);

  // Modals state
  const [isCreateWizardOpen, setIsCreateWizardOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [paymentLoanId, setPaymentLoanId] = useState<string | undefined>(undefined);
  const [paymentScheduleId, setPaymentScheduleId] = useState<string | undefined>(undefined);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);

  const [isInterestRateModalOpen, setIsInterestRateModalOpen] = useState(false);
  const [interestRateLoan, setInterestRateLoan] = useState<Loan | null>(null);

  const handleSelectLoan = (id: string) => {
    setSelectedLoanId(id);
    setActiveTab("details");
  };

  const handleOpenRecordPayment = (loanId?: string, scheduleId?: string) => {
    setPaymentLoanId(loanId);
    setPaymentScheduleId(scheduleId);
    setIsRecordPaymentOpen(true);
  };

  const handleOpenEditModal = (loan: Loan) => {
    setEditingLoan(loan);
    setIsEditModalOpen(true);
  };

  const handleOpenInterestRateModal = (loan: Loan) => {
    setInterestRateLoan(loan);
    setIsInterestRateModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-900/60 rounded-3xl border border-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/80 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Failed to Load Loans</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not retrieve loan data from the pFOS backend API."}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full pb-16">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 font-sans tracking-tight">Loan & Mortgage Management</h1>
          <p className="text-xs text-slate-400">
            {activeSubTab
              ? `Filtered View: ${activeSubTab.replace("-", " ").toUpperCase()}`
              : "pFOS Current Position Model • Amortization, EMIs & Debt Reduction Analytics"}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "dashboard"
                ? `${NAV_TAB_L2}`
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "list"
                ? `${NAV_TAB_L2}`
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>All Loans ({loans.length})</span>
          </button>

          {selectedLoanId && (
            <button
              onClick={() => setActiveTab("details")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "details"
                  ? `${NAV_TAB_L2}`
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Selected Loan</span>
            </button>
          )}
        </div>
      </div>

      {/* Main View Switching */}
      {activeTab === "dashboard" && (
        <LoanDashboard
          onOpenCreateWizard={() => setIsCreateWizardOpen(true)}
          onOpenRecordPayment={handleOpenRecordPayment}
          onSelectLoan={handleSelectLoan}
          onSwitchToTab={setActiveTab}
        />
      )}

      {activeTab === "list" && (
        <LoanListTable
          loans={loans}
          onSelectLoan={handleSelectLoan}
          onOpenRecordPayment={handleOpenRecordPayment}
          onOpenCreateWizard={() => setIsCreateWizardOpen(true)}
        />
      )}

      {activeTab === "details" && selectedLoanId && (
        <LoanDetailsView
          loanId={selectedLoanId}
          onBack={() => setActiveTab("list")}
          onOpenRecordPayment={handleOpenRecordPayment}
          onOpenEditModal={handleOpenEditModal}
          onOpenInterestRateModal={handleOpenInterestRateModal}
        />
      )}

      {/* Modals */}
      <CreateLoanWizardModal
        isOpen={isCreateWizardOpen}
        onClose={() => setIsCreateWizardOpen(false)}
      />

      <RecordPaymentModal
        loans={loans}
        initialLoanId={paymentLoanId}
        initialScheduleId={paymentScheduleId}
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
      />

      <EditLoanModal
        loan={editingLoan}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      <ChangeInterestRateModal
        loan={interestRateLoan}
        isOpen={isInterestRateModalOpen}
        onClose={() => setIsInterestRateModalOpen(false)}
      />
    </div>
  );
};
