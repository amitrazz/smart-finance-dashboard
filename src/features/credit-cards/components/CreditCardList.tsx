import React, { useState, useMemo } from "react";
import {
  CreditCard as CreditCardIcon,
  Search,
  Plus,
  RefreshCw,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Eye,
  Edit2,
  DollarSign,
  Trash2,
} from "lucide-react";
import { useCreditCards, useDeleteCreditCard } from "../hooks/useCreditCardQueries";
import { CreditCard } from "../../../types";
import { formatCurrency } from "../../../utils/formatters";
import { Pagination } from "../../../components/common/Pagination";
import { ConfirmModal } from "../../../components/common/ConfirmModal";

interface CreditCardListProps {
  onSelectCard: (id: string) => void;
  onAddCard: () => void;
  onEditCard: (card: CreditCard) => void;
  onPayCard: (card: CreditCard) => void;
}

type SortField = "name" | "outstanding" | "availableCredit" | "creditLimit" | "nextDueDate";
type SortOrder = "asc" | "desc";

export const CreditCardList: React.FC<CreditCardListProps> = ({
  onSelectCard,
  onAddCard,
  onEditCard,
  onPayCard,
}) => {
  const { data: cards = [], isLoading, isError, error, refetch } = useCreditCards();
  const deleteCardMutation = useDeleteCreditCard();

  const [deletingCard, setDeletingCard] = useState<{ id: string; name: string; version?: number } | null>(null);

  const handleConfirmDelete = () => {
    if (deletingCard) {
      deleteCardMutation.mutate({ id: deletingCard.id, version: deletingCard.version || 1 }, {
        onSuccess: () => setDeletingCard(null)
      });
    }
  };

  // Filter state
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterIssuer, setFilterIssuer] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Extract unique issuers for dropdown
  const issuers = useMemo(() => {
    const set = new Set<string>();
    cards.forEach((c) => {
      if (c.issuer) set.add(c.issuer);
    });
    return Array.from(set);
  }, [cards]);

  // Filtered Cards
  const filteredCards = useMemo(() => {
    const searchLower = (search || "").toLowerCase();
    return cards.filter((card) => {
      if (!card) return false;
      const cardName = (card.name || card.nickname || card.issuer || "Credit Card").toLowerCase();
      const cardIssuer = (card.issuer || "").toLowerCase();

      const matchesSearch =
        search === "" ||
        cardName.includes(searchLower) ||
        cardIssuer.includes(searchLower) ||
        (card.maskedNumber && String(card.maskedNumber).includes(search)) ||
        (card.last4Digits && String(card.last4Digits).includes(search));

      const matchesType = filterType === "ALL" || card.cardType === filterType;
      const matchesIssuer = filterIssuer === "ALL" || card.issuer === filterIssuer;
      const matchesStatus = filterStatus === "ALL" || card.status === filterStatus;

      return matchesSearch && matchesType && matchesIssuer && matchesStatus;
    });
  }, [cards, search, filterType, filterIssuer, filterStatus]);

  // Sorted Cards
  const sortedCards = useMemo(() => {
    return [...filteredCards].sort((a, b) => {
      let aVal: string | number = 0;
      let bVal: string | number = 0;

      switch (sortField) {
        case "name":
          aVal = (a?.name || a?.nickname || a?.issuer || "").toLowerCase();
          bVal = (b?.name || b?.nickname || b?.issuer || "").toLowerCase();
          break;
        case "outstanding":
          aVal = parseFloat(
            typeof a?.currentOutstanding === "object"
              ? a?.currentOutstanding?.amount || "0"
              : String(a?.currentOutstanding || a?.outstandingBalance || "0")
          );
          bVal = parseFloat(
            typeof b?.currentOutstanding === "object"
              ? b?.currentOutstanding?.amount || "0"
              : String(b?.currentOutstanding || b?.outstandingBalance || "0")
          );
          break;
        case "availableCredit":
          aVal = parseFloat(
            typeof a?.availableCredit === "object"
              ? a?.availableCredit?.amount || "0"
              : String(a?.availableCredit || "0")
          );
          bVal = parseFloat(
            typeof b?.availableCredit === "object"
              ? b?.availableCredit?.amount || "0"
              : String(b?.availableCredit || "0")
          );
          break;
        case "creditLimit":
          aVal = parseFloat(
            typeof a?.creditLimit === "object"
              ? a?.creditLimit?.amount || "0"
              : String(a?.creditLimit || "0")
          );
          bVal = parseFloat(
            typeof b?.creditLimit === "object"
              ? b?.creditLimit?.amount || "0"
              : String(b?.creditLimit || "0")
          );
          break;
        case "nextDueDate":
          aVal = a?.nextDueDate ? new Date(a.nextDueDate).getTime() : 0;
          bVal = b?.nextDueDate ? new Date(b.nextDueDate).getTime() : 0;
          break;
        default:
          aVal = 0;
          bVal = 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredCards, sortField, sortOrder]);

  const paginatedCards = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCards.slice(start, start + pageSize);
  }, [sortedCards, currentPage, pageSize]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse p-2">
        <div className="h-10 bg-slate-800/80 rounded-xl w-full max-w-sm" />
        <div className="h-96 bg-slate-900/60 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-100">Failed to Load Credit Cards</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not retrieve credit cards list from backend APIs."}
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
      {/* Header Controls & Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search card name, issuer, last 4 digits..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={onAddCard}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Credit Card
        </button>
      </div>

      {/* Filter Options Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
        <span className="font-semibold text-slate-400">Filters:</span>

        {/* Filter Card Type */}
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
        >
          <option value="ALL">All Card Types</option>
          <option value="PERSONAL">Personal</option>
          <option value="BUSINESS">Business</option>
          <option value="PREMIUM">Premium / Metal</option>
        </select>

        {/* Filter Issuer */}
        <select
          value={filterIssuer}
          onChange={(e) => {
            setFilterIssuer(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
        >
          <option value="ALL">All Issuers</option>
          {issuers.map((iss) => (
            <option key={iss} value={iss}>
              {iss}
            </option>
          ))}
        </select>

        {/* Filter Status */}
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="BLOCKED">Blocked</option>
          <option value="CLOSED">Closed</option>
        </select>

        {(search || filterType !== "ALL" || filterIssuer !== "ALL" || filterStatus !== "ALL") && (
          <button
            onClick={() => {
              setSearch("");
              setFilterType("ALL");
              setFilterIssuer("ALL");
              setFilterStatus("ALL");
              setCurrentPage(1);
            }}
            className="text-indigo-400 hover:text-indigo-300 font-semibold ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Main Cards List Table */}
      {paginatedCards.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <CreditCardIcon className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">No Credit Cards Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {search || filterType !== "ALL" || filterIssuer !== "ALL"
              ? "No credit cards match the current search filters."
              : "Click 'Add Credit Card' above to set up your first card position."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider">
                  <th
                    onClick={() => toggleSort("name")}
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Card & Issuer</span>
                      {sortField === "name" && (sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Last 4</th>
                  <th
                    onClick={() => toggleSort("outstanding")}
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Outstanding</span>
                      {sortField === "outstanding" && (sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("availableCredit")}
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Available Credit</span>
                      {sortField === "availableCredit" && (sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("creditLimit")}
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Total Limit</span>
                      {sortField === "creditLimit" && (sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right">Utilization</th>
                  <th className="py-3.5 px-4 text-right">Min Due</th>
                  <th
                    onClick={() => toggleSort("nextDueDate")}
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Next Due</span>
                      {sortField === "nextDueDate" && (sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedCards.map((card) => {
                  if (!card) return null;
                  const outAmt = parseFloat(
                    typeof card.currentOutstanding === "object"
                      ? card.currentOutstanding?.amount || "0"
                      : String(card.currentOutstanding || card.outstandingBalance || "0")
                  );
                  const availAmt = parseFloat(
                    typeof card.availableCredit === "object"
                      ? card.availableCredit?.amount || "0"
                      : String(card.availableCredit || "0")
                  );
                  const limitAmt = parseFloat(
                    typeof card.creditLimit === "object"
                      ? card.creditLimit?.amount || "0"
                      : String(card.creditLimit || "0")
                  );
                  const minDue = parseFloat(
                    typeof card.minimumDue === "object"
                      ? card.minimumDue?.amount || "0"
                      : String(card.minimumDue || "0")
                  );

                  const utilization =
                    typeof card.creditUtilizationPercent === "number"
                      ? card.creditUtilizationPercent
                      : limitAmt > 0
                      ? (outAmt / limitAmt) * 100
                      : 0;

                  return (
                    <tr
                      key={card.id}
                      onClick={() => onSelectCard(card.id)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-indigo-400 group-hover:border-indigo-500/50 transition-colors">
                            <CreditCardIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                              {card.name || card.nickname || card.issuer || "Credit Card"}
                            </p>
                            <p className="text-[11px] text-slate-400">{card.issuer || "Card Issuer"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {card.maskedNumber ? `•••• ${card.maskedNumber}` : `•••• ${card.last4Digits || "0000"}`}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-100">
                        {formatCurrency({ amount: outAmt.toFixed(2), currency: card.currency || "INR" })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                        {formatCurrency({ amount: availAmt.toFixed(2), currency: card.currency || "INR" })}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400 font-semibold">
                        {formatCurrency({ amount: limitAmt.toFixed(2), currency: card.currency || "INR" })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-bold text-[11px] px-2 py-0.5 rounded-full ${
                            utilization > 50
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : utilization > 30
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {utilization.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-amber-400">
                        {formatCurrency({ amount: minDue.toFixed(2), currency: card.currency || "INR" })}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium whitespace-nowrap">
                        {card.nextDueDate ? card.nextDueDate : `Day ${card.paymentDueDay || card.dueDay || "-"}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            card.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : card.status === "BLOCKED"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {card.status || "ACTIVE"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onPayCard(card)}
                            title="Record Payment"
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectCard(card.id)}
                            title="View Details"
                            className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditCard(card)}
                            title="Card Settings & Edit"
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingCard({ id: card.id, name: card.name || card.nickname || "Credit Card", version: card.version || 1 })}
                            title="Delete Credit Card"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(sortedCards.length / pageSize) || 1}
            totalItems={sortedCards.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Styled Delete Card Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingCard)}
        title="Delete Credit Card?"
        message={`Are you sure you want to delete credit card "${deletingCard?.name}"? All associated statements, payments, and limit history will be permanently removed.`}
        confirmText="Delete Credit Card"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteCardMutation.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingCard(null)}
      />
    </div>
  );
};
