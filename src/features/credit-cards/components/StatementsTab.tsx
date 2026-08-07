import React, { useState, useMemo } from "react";
import {
  FileText,
  Search,
  Download,
  Upload,
  Eye,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useCardStatements } from "../hooks/useCreditCardQueries";
import { CreditCard, CreditCardStatement } from "../../../types";
import { formatCurrency } from "../../../utils/formatters";
import { StatementDetailsModal } from "./StatementDetailsModal";
import { Pagination } from "../../../components/common/Pagination";
import { useUIStore } from "../../../store/useUIStore";

interface StatementsTabProps {
  cardId: string;
  onPayCard?: (card: CreditCard) => void;
}

export const StatementsTab: React.FC<StatementsTabProps> = ({ cardId }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStatement, setSelectedStatement] = useState<CreditCardStatement | null>(null);
  const [isDetailsOpen, setDetailsOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: statements = [], isLoading, isError, error, refetch } = useCardStatements(cardId);
  const { setActiveTab, setImportModalOpen } = useUIStore();

  const getVal = (val: unknown): number => {
    if (typeof val === "object" && val !== null) return parseFloat((val as { amount?: string }).amount || "0");
    if (typeof val === "number") return val;
    if (typeof val === "string") return parseFloat(val) || 0;
    return 0;
  };

  const filteredStatements = useMemo(() => {
    return statements.filter((stmt) => {
      const searchLower = (search || "").toLowerCase();
      const matchSearch =
        search === "" ||
        (stmt.statementDate && stmt.statementDate.includes(search)) ||
        (stmt.dueDate && stmt.dueDate.includes(search)) ||
        (stmt.status && stmt.status.toLowerCase().includes(searchLower));

      const matchStatus = statusFilter === "all" || stmt.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [statements, search, statusFilter]);

  const paginatedStatements = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStatements.slice(start, start + pageSize);
  }, [filteredStatements, currentPage, pageSize]);

  const handleExportCSV = () => {
    if (filteredStatements.length === 0) return;
    const headers = ["Statement Date", "Due Date", "Opening Balance", "Closing Balance", "Minimum Due", "Interest", "Fees", "Status"];
    const rows = filteredStatements.map((s) => [
      s.statementDate,
      s.dueDate,
      getVal(s.openingBalance),
      getVal(s.statementBalance || s.closingBalance),
      getVal(s.minimumDue),
      getVal(s.interest),
      getVal(s.fees),
      s.status,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `credit_card_statements_${cardId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportPDF = () => {
    setImportModalOpen(true);
    setActiveTab("imports");
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-slate-800/80 rounded-xl w-full max-w-sm" />
        <div className="h-64 bg-slate-900/60 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-100">Failed to Load Statements</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not fetch card statements."}
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
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search statements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleImportPDF}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 border border-purple-500/20 text-xs font-semibold transition-all"
          >
            <Upload className="w-4 h-4" /> Import PDF Statement
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Statements Table */}
      {filteredStatements.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">No Statements Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No credit card statements found matching your filters. You can import PDF or CSV statements anytime.
          </p>
          <button
            onClick={handleImportPDF}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-lg shadow-purple-600/20"
          >
            <Upload className="w-4 h-4" /> Upload PDF Statement
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                  <th className="py-3.5 px-4">Statement Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4 text-right">Opening Balance</th>
                  <th className="py-3.5 px-4 text-right">Closing Balance</th>
                  <th className="py-3.5 px-4 text-right">Statement Due</th>
                  <th className="py-3.5 px-4 text-right">Minimum Due</th>
                  <th className="py-3.5 px-4 text-right">Interest / Fees</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedStatements.map((stmt) => {
                  const closingBal = getVal(stmt.statementBalance || stmt.closingBalance);
                  const minDue = getVal(stmt.minimumDue);
                  const interest = getVal(stmt.interest);
                  const fees = getVal(stmt.fees);

                  return (
                    <tr key={stmt.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-100">{stmt.statementDate}</td>
                      <td className="py-3.5 px-4 font-medium text-cyan-400">{stmt.dueDate}</td>
                      <td className="py-3.5 px-4 text-right">{formatCurrency({ amount: getVal(stmt.openingBalance).toFixed(2), currency: "INR" })}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-100">
                        {formatCurrency({ amount: closingBal.toFixed(2), currency: "INR" })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-purple-300">
                        {formatCurrency({ amount: closingBal.toFixed(2), currency: "INR" })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-amber-400">
                        {formatCurrency({ amount: minDue.toFixed(2), currency: "INR" })}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400">
                        {interest + fees > 0 ? (
                          <span className="text-rose-400 font-semibold">
                            {formatCurrency({ amount: (interest + fees).toFixed(2), currency: "INR" })}
                          </span>
                        ) : (
                          "₹0"
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            stmt.status === "PAID"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : stmt.status === "OVERDUE"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {stmt.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedStatement(stmt);
                            setDetailsOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="View Statement Details"
                          aria-label="View Statement Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredStatements.length / pageSize) || 1}
            totalItems={filteredStatements.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            pageSizeOptions={[10, 20, 50]}
          />
        </div>
      )}

      {/* Statement Details Modal */}
      <StatementDetailsModal
        cardId={cardId}
        statement={selectedStatement}
        isOpen={isDetailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedStatement(null);
        }}
      />
    </div>
  );
};
