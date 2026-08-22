import React, { useEffect, useState } from "react";
import { useUIStore } from "../../store/useUIStore";
import { useIncomeSources, useIncomeRecords } from "../../hooks/useFinanceQueries";
import { formatCurrency } from "../../utils/formatters";
import { SalarySlipList } from "./components/SalarySlipList";
import { SalarySlipUploadWizard } from "./components/SalarySlipUploadWizard";
import { SalarySlipDetail } from "./components/SalarySlipDetail";
import { SalaryHistoryChart } from "./components/SalaryHistoryChart";

type ViewMode = "list" | "upload" | "detail";

export const IncomeView: React.FC = () => {
  const { activeSubTab, setActiveSubTab } = useUIStore();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const { data: sources = [] } = useIncomeSources();
  const { data: records = [] } = useIncomeRecords();

  // Same route-sync convention as CreditCardsView/ImportsView — the detail
  // record id travels in the route so a refresh/deep-link recovers it.
  useEffect(() => {
    if (!activeSubTab) {
      setViewMode("list");
      return;
    }
    const [base, id] = activeSubTab.split("/");
    if (base === "salary-slips" && id) {
      setSelectedRecordId(id);
      setViewMode("detail");
    } else if (base === "import") {
      setViewMode("upload");
    } else {
      setViewMode("list");
    }
  }, [activeSubTab]);

  const goToList = () => {
    setViewMode("list");
    setSelectedRecordId(null);
    setActiveSubTab(null);
  };

  const goToUpload = () => {
    setViewMode("upload");
    setActiveSubTab("import");
  };

  const goToDetail = (id: string) => {
    setSelectedRecordId(id);
    setViewMode("detail");
    setActiveSubTab(`salary-slips/${id}`);
  };

  if (viewMode === "upload") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Income</h1>
          <p className="text-xs text-slate-400">Import a salary slip and review the extraction.</p>
        </div>
        <SalarySlipUploadWizard onConfirmed={goToDetail} onCancel={goToList} />
      </div>
    );
  }

  if (viewMode === "detail" && selectedRecordId) {
    return <SalarySlipDetail incomeRecordId={selectedRecordId} onBack={goToList} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Income</h1>
        <p className="text-xs text-slate-400">
          Salary slips, income sources, and expected income for planning.
        </p>
      </div>

      {sources.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map((source) => (
            <div key={source.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <p className="text-xs text-slate-400">{source.name}</p>
              <p className="text-lg font-bold text-slate-100 mt-1">
                {source.expectedAmount
                  ? formatCurrency({ amount: source.expectedAmount, currency: source.expectedCurrency || "INR" })
                  : "—"}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Expected {source.payFrequency ? source.payFrequency.toLowerCase() : "income"}
              </p>
            </div>
          ))}
        </div>
      )}

      <SalarySlipList onSelectRecord={goToDetail} onImport={goToUpload} />

      <SalaryHistoryChart records={records} />
    </div>
  );
};
