import React, { useState, useMemo } from "react";
import { DollarSign, Search, Download, RefreshCw, AlertTriangle } from "lucide-react";
import { useCardPayments } from "../hooks/useCreditCardQueries";
import { formatCurrency } from "../../../utils/formatters";
import { Pagination } from "../../../components/common/Pagination";

interface PaymentsTabProps {
  cardId: string;
  onRecordPayment?: () => void;
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({ cardId, onRecordPayment }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: payments = [], isLoading, isError, error, refetch } = useCardPayments(cardId);

  const getVal = (val: unknown): number => {
    if (typeof val === "object" && val !== null) return parseFloat((val as { amount?: string }).amount || "0");
    if (typeof val === "number") return val;
    if (typeof val === "string") return parseFloat(val) || 0;
    return 0;
  };

  const filteredPayments = useMemo(() => {
    return payments.filter((pmt) => {
      const searchLower = (search || "").toLowerCase();
      const matchSearch =
        search === "" ||
        (pmt.paymentDate && pmt.paymentDate.includes(search)) ||
        (pmt.reference && pmt.reference.toLowerCase().includes(searchLower)) ||
        (pmt.method && pmt.method.toLowerCase().includes(searchLower)) ||
        (pmt.paymentAccountName && pmt.paymentAccountName.toLowerCase().includes(searchLower));

      const matchStatus = statusFilter === "all" || pmt.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [payments, search, statusFilter]);

  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  const handleExportCSV = () => {
    if (filteredPayments.length === 0) return;
    const headers = ["Payment Date", "Amount", "Method / Account", "Reference", "Status", "Created By"];
    const rows = filteredPayments.map((p) => [
      p.paymentDate,
      getVal(p.amount),
      p.paymentAccountName || p.method || "Bank Transfer",
      p.reference || "N/A",
      p.status,
      p.createdBy || "User",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `credit_card_payments_${cardId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <h3 className="text-base font-bold text-slate-100">Failed to Load Payment History</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not fetch card payment history."}
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
              placeholder="Search payments & reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="REVERSED">Reversed</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onRecordPayment?.()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
          >
            <DollarSign className="w-4 h-4" /> Record New Payment
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Payment History Table */}
      {filteredPayments.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <DollarSign className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">No Payment History Recorded</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No payments match your current query. Click "Record New Payment" to log a payment towards this credit card.
          </p>
          <button
            onClick={() => onRecordPayment?.()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all"
          >
            <DollarSign className="w-4 h-4" /> Pay Bill Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                  <th className="py-3.5 px-4">Payment Date</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4">Method / Account</th>
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4">Statement Period</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedPayments.map((pmt) => {
                  const amt = getVal(pmt.amount);
                  return (
                    <tr key={pmt.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-100">{pmt.paymentDate}</td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400">
                        {formatCurrency({ amount: amt.toFixed(2), currency: "INR" })}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        {pmt.paymentAccountName || pmt.method || "Bank Transfer"}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{pmt.reference || "N/A"}</td>
                      <td className="py-3.5 px-4 text-slate-400">{pmt.statementPeriod || "Current Cycle"}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            pmt.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : pmt.status === "REVERSED"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {pmt.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{pmt.createdBy || "System / User"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredPayments.length / pageSize) || 1}
            totalItems={filteredPayments.length}
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
    </div>
  );
};
