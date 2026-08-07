import React, { useState, useMemo } from "react";
import { useGoals, useDeleteGoal } from "../hooks/useGoalQueries";
import { formatCurrency } from "../../../utils/formatters";
import { ConfirmModal } from "../../../components/common/ConfirmModal";
import { Button } from "../../../components/ui/Button";
import { ActionOverflowMenu } from "../../../components/ui/ActionOverflowMenu";
import {
  Search,
  ArrowUpDown,
  Plus,
  Target,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface GoalListViewProps {
  onOpenCreateWizard: () => void;
  onSelectGoal: (goalId: string) => void;
}

export const GoalListView: React.FC<GoalListViewProps> = ({
  onOpenCreateWizard,
  onSelectGoal,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [riskFilter, setRiskFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"name" | "targetDate" | "progress" | "currentCorpus">("targetDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [deletingGoal, setDeletingGoal] = useState<{ id: string; name: string } | null>(null);

  const { data: goals = [], isLoading, isError, error, refetch } = useGoals();
  const deleteGoalMutation = useDeleteGoal();

  const handleConfirmDelete = () => {
    if (!deletingGoal) return;
    deleteGoalMutation.mutate({ id: deletingGoal.id }, { onSuccess: () => setDeletingGoal(null) });
  };

  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      const matchSearch =
        !searchTerm ||
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.type || g.category || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = typeFilter === "ALL" || (g.type || g.category) === typeFilter;
      const matchStatus = statusFilter === "ALL" || g.status === statusFilter;
      const matchRisk = riskFilter === "ALL" || g.riskLevel === riskFilter;
      const matchPriority = priorityFilter === "ALL" || g.priority === priorityFilter;

      return matchSearch && matchType && matchStatus && matchRisk && matchPriority;
    });
  }, [goals, searchTerm, typeFilter, statusFilter, riskFilter, priorityFilter]);

  const sortedGoals = useMemo(() => {
    return [...filteredGoals].sort((a, b) => {
      let valA: string | number = 0;
      let valB: string | number = 0;

      if (sortBy === "name") {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortBy === "targetDate") {
        valA = a.targetDate || "";
        valB = b.targetDate || "";
      } else if (sortBy === "progress") {
        valA = a.progressPercent || 0;
        valB = b.progressPercent || 0;
      } else if (sortBy === "currentCorpus") {
        valA = parseFloat(a.currentCorpus?.amount || a.currentAmount?.amount || "0");
        valB = parseFloat(b.currentCorpus?.amount || b.currentAmount?.amount || "0");
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredGoals, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedGoals.length / pageSize));
  const paginatedGoals = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedGoals.slice(start, start + pageSize);
  }, [sortedGoals, currentPage]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-slate-900/60 rounded-2xl border border-slate-800" />
        <div className="h-96 bg-slate-900/60 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Failed to Load Goals List</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not fetch active goals."}
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
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">My Financial Goals</h2>
          <p className="text-xs text-slate-400">
            View, filter, sort and manage all registered goal milestones
          </p>
        </div>

        <Button
          variant="primary"
          hierarchy="filled"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={onOpenCreateWizard}
        >
          Create Goal
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl flex flex-col lg:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search goal name or category..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="EMERGENCY">Emergency Fund</option>
            <option value="RETIREMENT">Retirement</option>
            <option value="HOUSE">House</option>
            <option value="VEHICLE">Vehicle</option>
            <option value="EDUCATION">Education</option>
            <option value="VACATION">Vacation</option>
            <option value="BUSINESS">Business</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none"
          >
            <option value="ALL">All Risks</option>
            <option value="ON_TRACK">On Track</option>
            <option value="NEEDS_ATTENTION">Needs Attention</option>
            <option value="BEHIND_SCHEDULE">Behind Schedule</option>
            <option value="CRITICAL">Critical</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {paginatedGoals.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <Target className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">No Goals Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No goals match your current filter settings or search criteria.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4 cursor-pointer" onClick={() => toggleSort("name")}>
                    <div className="flex items-center gap-1">
                      Goal {sortBy === "name" && <ArrowUpDown className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4 cursor-pointer" onClick={() => toggleSort("currentCorpus")}>
                    <div className="flex items-center gap-1">
                      Current Corpus {sortBy === "currentCorpus" && <ArrowUpDown className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Target Amount</th>
                  <th className="py-3.5 px-4 cursor-pointer" onClick={() => toggleSort("progress")}>
                    <div className="flex items-center gap-1">
                      Progress % {sortBy === "progress" && <ArrowUpDown className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer" onClick={() => toggleSort("targetDate")}>
                    <div className="flex items-center gap-1">
                      Target Date {sortBy === "targetDate" && <ArrowUpDown className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Forecast Completion</th>
                  <th className="py-3.5 px-4">Health Score</th>
                  <th className="py-3.5 px-4">Risk Level</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {paginatedGoals.map((g) => (
                  <tr
                    key={g.id}
                    onClick={() => onSelectGoal(g.id)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-100">{g.name}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-medium">
                      <span className="bg-slate-800 px-2 py-0.5 rounded-full text-[10px] font-semibold text-slate-300">
                        {g.type || g.category || "GOAL"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.priority === "CRITICAL"
                            ? "bg-rose-500/20 text-rose-300"
                            : g.priority === "HIGH"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {g.priority || "MEDIUM"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      {formatCurrency(g.currentCorpus || g.currentAmount)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      {formatCurrency(g.targetAmount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${Math.min(g.progressPercent ?? 0, 100)}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-200">{g.progressPercent ?? 0}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{g.targetDate}</td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {g.estimatedCompletionDate || g.forecastCompletionDate || g.targetDate}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-amber-400">
                      {g.goalHealthScore != null ? `${g.goalHealthScore}/100` : "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.riskLevel === "ON_TRACK"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : g.riskLevel === "BEHIND_SCHEDULE"
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-rose-500/15 text-rose-400"
                        }`}
                      >
                        {g.riskLevel || "ON_TRACK"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <ActionOverflowMenu
                        ariaLabel={`Actions for ${g.name}`}
                        items={[
                          {
                            id: "view",
                            label: "View Details",
                            onClick: () => onSelectGoal(g.id),
                          },
                          {
                            id: "delete",
                            label: "Delete Goal",
                            variant: "danger",
                            onClick: () => setDeletingGoal({ id: g.id, name: g.name }),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {paginatedGoals.length} of {sortedGoals.length} goals
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deletingGoal !== null}
        title="Delete Goal"
        message={`Are you sure you want to delete "${deletingGoal?.name}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteGoalMutation.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingGoal(null)}
      />
    </div>
  );
};
