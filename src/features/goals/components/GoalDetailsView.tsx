import {
  Activity as ActivityIcon,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  DollarSign,
  FileText,
  Flag,
  Link as LinkIcon,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Unlink,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAccounts } from '../../../hooks/useFinanceQueries';
import { GoalContribution, GoalMilestone, Money } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';
import {
  useAddGoalMilestone,
  useDeleteGoal,
  useDeleteGoalContribution,
  useDeleteGoalMilestone,
  useGoal,
  useGoalContributions,
  useGoalForecast,
  useGoalMilestones,
  useRecordGoalContribution,
  useUpdateGoal,
} from '../hooks/useGoalQueries';

interface GoalDetailsViewProps {
  goalId: string;
  onBack: () => void;
}

const milestoneTargetLabel = (m: GoalMilestone, goalTargetAmount?: Money): string => {
  if (m.targetAmount) return formatCurrency(m.targetAmount);
  if (m.thresholdPercent && goalTargetAmount) {
    const computed = (parseFloat(goalTargetAmount.amount) * parseFloat(m.thresholdPercent)) / 100;
    return `${formatCurrency({ amount: computed.toString(), currency: goalTargetAmount.currency })} (${m.thresholdPercent}%)`;
  }
  if (m.thresholdPercent) return `${m.thresholdPercent}% of target corpus`;
  return '—';
};

export type DetailTab =
  | 'overview'
  | 'corpus'
  | 'contributions'
  | 'milestones'
  | 'forecast'
  | 'analytics'
  | 'documents'
  | 'activity';

export const GoalDetailsView: React.FC<GoalDetailsViewProps> = ({ goalId, onBack }) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [isContributionModalOpen, setContributionModalOpen] = useState(false);
  const [contribAmount, setContribAmount] = useState('');
  const [contribNotes, setContribNotes] = useState('');

  const [isMilestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [milestoneName, setMilestoneName] = useState('');
  const [milestoneAmount, setMilestoneAmount] = useState('');
  const [milestoneDate, setMilestoneDate] = useState('');

  const [isLinkAssetModalOpen, setLinkAssetModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  const { data: goal, isLoading, isError, error } = useGoal(goalId);
  const { data: contributions = [] } = useGoalContributions(goalId);
  const { data: milestones = [] } = useGoalMilestones(goalId);
  const { data: forecast } = useGoalForecast(goalId);
  const { data: accounts = [] } = useAccounts();

  const recordContribMutation = useRecordGoalContribution();
  const deleteContribMutation = useDeleteGoalContribution();
  const addMilestoneMutation = useAddGoalMilestone();
  const deleteMilestoneMutation = useDeleteGoalMilestone();
  const updateGoalMutation = useUpdateGoal();
  const deleteGoalMutation = useDeleteGoal();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse" aria-label="Loading goal details">
        <div className="h-10 w-48 bg-slate-900/60 rounded-xl" />
        <div className="h-44 bg-slate-900/60 rounded-3xl border border-slate-800" />
        <div className="h-96 bg-slate-900/60 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  if (isError || !goal) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Failed to load Goal Details</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || 'The requested goal could not be found.'}
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Goals
        </button>
      </div>
    );
  }

  const handleRecordContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contribAmount) return;
    recordContribMutation.mutate(
      {
        goalId: goal.id,
        data: { amount: contribAmount, notes: contribNotes },
      },
      {
        onSuccess: () => {
          setContributionModalOpen(false);
          setContribAmount('');
          setContribNotes('');
        },
      },
    );
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneName || !milestoneAmount || !milestoneDate) return;
    addMilestoneMutation.mutate(
      {
        goalId: goal.id,
        data: {
          name: milestoneName,
          targetAmount: milestoneAmount,
          targetDate: milestoneDate,
        },
      },
      {
        onSuccess: () => {
          setMilestoneModalOpen(false);
          setMilestoneName('');
          setMilestoneAmount('');
          setMilestoneDate('');
        },
      },
    );
  };

  // There's no dedicated link-asset endpoint on the backend — linked
  // accounts are just an array of IDs on the goal itself, edited via the
  // regular goal update endpoint.
  const handleLinkAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) return;
    const nextIds = Array.from(new Set([...(goal.linkedAccountIds ?? []), selectedAccountId]));
    updateGoalMutation.mutate(
      { id: goal.id, data: { linkedAccountIds: nextIds }, version: goal.version },
      { onSuccess: () => setLinkAssetModalOpen(false) },
    );
  };

  const handleUnlinkAccount = (accountId: string) => {
    const nextIds = (goal.linkedAccountIds ?? []).filter((id) => id !== accountId);
    updateGoalMutation.mutate({ id: goal.id, data: { linkedAccountIds: nextIds }, version: goal.version });
  };

  const currentCorpus = goal.currentCorpus ||
    goal.currentAmount || { amount: '0', currency: 'INR' };
  const remainingCorpus = goal.remainingCorpus || { amount: '0', currency: 'INR' };

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Goals
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setContributionModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" /> Log Contribution
          </button>
          <button
            onClick={() => {
              if (confirm(`Are you sure you want to delete goal "${goal.name}"?`)) {
                deleteGoalMutation.mutate({ id: goal.id }, { onSuccess: () => onBack() });
              }
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Goal Summary Card Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 space-y-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Target className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  {goal.type || goal.category || 'GOAL'}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  Priority: {goal.priority || 'MEDIUM'}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-100 mt-1">{goal.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {goal.goalHealthScore != null && (
              <div className="px-4 py-2 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                <p className="text-[10px] text-slate-400 font-medium uppercase">Goal Health</p>
                <p className="text-base font-extrabold text-amber-400">{goal.goalHealthScore}/100</p>
              </div>
            )}
            <div className="px-4 py-2 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
              <p className="text-[10px] text-slate-400 font-medium uppercase">Risk Profile</p>
              <p className="text-base font-extrabold text-emerald-400">
                {goal.riskProfile || 'BALANCED'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar & Corpus Figures */}
        <div className="space-y-2">
          <div className="flex justify-between items-end text-xs font-semibold">
            <div>
              <span className="text-slate-400">Current Corpus: </span>
              <span className="text-emerald-400 font-extrabold text-sm">
                {formatCurrency(currentCorpus)}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Target Corpus: </span>
              <span className="text-slate-100 font-bold text-sm">
                {formatCurrency(goal.targetAmount)}
              </span>
            </div>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 transition-all duration-500"
              style={{ width: `${Math.min(goal.progressPercent ?? 0, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>{goal.progressPercent ?? 0}% Completed</span>
            <span>Remaining Gap: {formatCurrency(remainingCorpus)}</span>
          </div>
        </div>

        {/* Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-4 border-t border-slate-800/80 text-xs">
          <div>
            <p className="text-slate-400">Target Date</p>
            <p className="font-bold text-slate-200">{goal.targetDate}</p>
          </div>
          <div>
            <p className="text-slate-400">Est. Completion</p>
            <p className="font-bold text-indigo-300">
              {goal.estimatedCompletionDate || goal.forecastCompletionDate || goal.targetDate}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Monthly Contribution</p>
            <p className="font-bold text-emerald-400">{formatCurrency(goal.monthlyContribution)}</p>
          </div>
          <div>
            <p className="text-slate-400">Expected Return</p>
            <p className="font-bold text-teal-300">{goal.expectedReturnRate.toFixed(2)}% p.a.</p>
          </div>
          <div>
            <p className="text-slate-400">Inflation Rate</p>
            <p className="font-bold text-slate-300">{goal.inflationRate ?? 6}%</p>
          </div>
          <div>
            <p className="text-slate-400">Status</p>
            <p className="font-bold text-emerald-400">{goal.status || 'ACTIVE'}</p>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="overflow-x-auto scrollbar-none pb-1">
        <nav className="flex items-center gap-1.5 p-1.5 bg-slate-900/80 border border-slate-800 rounded-2xl min-w-max">
          {[
            { id: 'overview', label: 'Overview', icon: <Target className="w-4 h-4" /> },
            { id: 'corpus', label: 'Corpus', icon: <LinkIcon className="w-4 h-4" /> },
            {
              id: 'contributions',
              label: 'Contributions',
              icon: <DollarSign className="w-4 h-4" />,
            },
            { id: 'milestones', label: 'Milestones', icon: <Flag className="w-4 h-4" /> },
            { id: 'forecast', label: 'Forecast', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
            { id: 'activity', label: 'Activity', icon: <ActivityIcon className="w-4 h-4" /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DetailTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Contributions Card */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" /> Recent Contributions
                </h3>
                <button
                  onClick={() => setContributionModalOpen(true)}
                  className="text-xs text-emerald-400 font-semibold hover:underline"
                >
                  + Add Contribution
                </button>
              </div>

              {contributions.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-950/40 text-center text-xs text-slate-400">
                  No contributions recorded yet. Log your first deposit above!
                </div>
              ) : (
                <div className="space-y-2">
                  {contributions.slice(0, 5).map((c: GoalContribution) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-200">{c.notes || 'Goal Contribution'}</p>
                        <p className="text-[11px] text-slate-400">{c.date}</p>
                      </div>
                      <span className="font-extrabold text-emerald-400">
                        {formatCurrency(c.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Forecast Banner */}
            {forecast && (
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Backend Forecast Insights
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <p className="text-slate-400">Expected Completion</p>
                    <p className="font-bold text-emerald-400 text-sm mt-0.5">
                      {forecast.expectedCompletionDate || '—'}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <p className="text-slate-400">On Schedule</p>
                    <p
                      className={`font-bold text-sm mt-0.5 ${forecast.isBehindSchedule ? 'text-rose-400' : 'text-emerald-400'}`}
                    >
                      {forecast.isBehindSchedule ? 'Behind Schedule' : 'On Track'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Milestones Widget */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Flag className="w-4 h-4 text-indigo-400" /> Key Milestones
                </h3>
                <button
                  onClick={() => setMilestoneModalOpen(true)}
                  className="text-xs text-indigo-400 font-semibold hover:underline"
                >
                  + Add
                </button>
              </div>

              {milestones.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No milestones set.</div>
              ) : (
                <div className="space-y-3">
                  {milestones.map((m: GoalMilestone) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">{m.name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            m.status === 'ACHIEVED'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {m.status === 'ACHIEVED' ? 'Achieved' : 'Pending'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Target: {milestoneTargetLabel(m, goal.targetAmount)}</span>
                        <span>Date: {m.targetDate || '—'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Linked Assets Summary */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-teal-400" /> Linked Assets
                </h3>
                <button
                  onClick={() => setLinkAssetModalOpen(true)}
                  className="text-xs text-teal-400 font-semibold hover:underline"
                >
                  + Link Asset
                </button>
              </div>

              {goal.linkedAccountIds && goal.linkedAccountIds.length > 0 ? (
                <div className="space-y-2">
                  {goal.linkedAccountIds.map((accountId) => {
                    const account = accounts.find((a) => a.id === accountId);
                    return (
                      <div
                        key={accountId}
                        className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <p className="font-bold text-slate-200">{account?.name ?? accountId}</p>
                        {account && (
                          <span className="font-bold text-emerald-400">
                            {formatCurrency(account.currentBalance)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  No account linked to this goal yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'contributions' && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100">Contribution Ledger</h3>
            <button
              onClick={() => setContributionModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
            >
              <Plus className="w-4 h-4" /> Log Contribution
            </button>
          </div>

          {contributions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No contributions logged.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {contributions.map((c: GoalContribution) => (
                    <tr key={c.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4">{c.date}</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">
                        {formatCurrency(c.amount)}
                      </td>
                      <td className="py-3 px-4">{c.type || 'MANUAL'}</td>
                      <td className="py-3 px-4 text-slate-400">{c.notes || '—'}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() =>
                            deleteContribMutation.mutate({ goalId: goal.id, contributionId: c.id, version: c.version })
                          }
                          className="p-1 rounded text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'milestones' && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100">Milestone Timeline</h3>
            <button
              onClick={() => setMilestoneModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs"
            >
              <Plus className="w-4 h-4" /> Add Milestone
            </button>
          </div>

          {milestones.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No milestones set.</div>
          ) : (
            <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800 pl-8">
              {milestones.map((m: GoalMilestone) => (
                <div
                  key={m.id}
                  className="relative p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2"
                >
                  <div className="absolute -left-6 top-5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-100">{m.name}</span>
                    <button
                      onClick={() =>
                        deleteMilestoneMutation.mutate({ goalId: goal.id, milestoneId: m.id, version: m.version })
                      }
                      className="text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>
                      Target Amount:{' '}
                      <strong className="text-emerald-400">{milestoneTargetLabel(m, goal.targetAmount)}</strong>
                    </span>
                    <span>
                      Target Date: <strong className="text-slate-200">{m.targetDate || '—'}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'forecast' && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-slate-100">
            Forecast Analytics & Recommendations
          </h3>
          {forecast ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <p className="text-slate-400">Monthly Required</p>
                  <p className="text-lg font-extrabold text-emerald-400">
                    {formatCurrency(forecast.monthlyRequiredContribution)}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <p className="text-slate-400">Funding Gap</p>
                  <p className="text-lg font-extrabold text-rose-400">
                    {formatCurrency(forecast.fundingGap)}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <p className="text-slate-400">Months Remaining</p>
                  <p
                    className={`text-lg font-extrabold ${forecast.isBehindSchedule ? 'text-rose-400' : 'text-amber-400'}`}
                  >
                    {forecast.monthsRemaining ?? '—'}
                    {forecast.isBehindSchedule && (
                      <span className="block text-[10px] font-bold text-rose-400 mt-0.5">
                        Behind Schedule
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Calculating forecast model...
            </div>
          )}
        </div>
      )}

      {activeTab === 'corpus' && (
        <div className="space-y-6">
          {/* Corpus Summary Cards */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">Goal Corpus Aggregate</h3>
                <p className="text-xs text-slate-400">
                  Current corpus value, todays market value, gain/loss, and linked portfolios
                </p>
              </div>
              <button
                onClick={() => setLinkAssetModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
              >
                <Plus className="w-4 h-4" /> Link Asset
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-medium">Current Corpus</span>
                <p className="text-xl font-extrabold text-slate-100">
                  {formatCurrency(goal.currentCorpus || goal.currentAmount)}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-medium">Target Corpus</span>
                <p className="text-xl font-extrabold text-slate-100">
                  {formatCurrency(goal.targetAmount)}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400">Corpus Allocation Status</span>
                <span className="text-emerald-400 font-mono">{goal.progressPercent ?? 0}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.min(goal.progressPercent ?? 0, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Linked Accounts List — the backend only tracks linked *account*
              IDs on the goal (no per-asset allocation percentage or resolved
              market value), so this reflects real account balances only. */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Linked Accounts</h3>
            {goal.linkedAccountIds && goal.linkedAccountIds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goal.linkedAccountIds.map((accountId) => {
                  const account = accounts.find((a) => a.id === accountId);
                  return (
                    <div
                      key={accountId}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                    >
                      <p className="font-bold text-sm text-slate-100">{account?.name ?? accountId}</p>
                      <div className="flex items-center gap-3">
                        {account && (
                          <span className="font-extrabold text-emerald-400 text-sm">
                            {formatCurrency(account.currentBalance)}
                          </span>
                        )}
                        <button
                          onClick={() => handleUnlinkAccount(accountId)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                          title="Unlink Account"
                        >
                          <Unlink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No accounts linked to this goal. Link a bank account to help track progress.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Record Contribution Modal */}
      {isContributionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-100">Log Goal Contribution</h3>
            <form onSubmit={handleRecordContribution} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  value={contribAmount}
                  onChange={(e) => setContribAmount(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes / Source
                </label>
                <input
                  type="text"
                  value={contribNotes}
                  onChange={(e) => setContribNotes(e.target.value)}
                  placeholder="e.g. Monthly SIP Transfer"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setContributionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordContribMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                >
                  Save Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      {isMilestoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-100">Add Custom Milestone</h3>
            <form onSubmit={handleAddMilestone} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Milestone Name
                </label>
                <input
                  type="text"
                  required
                  value={milestoneName}
                  onChange={(e) => setMilestoneName(e.target.value)}
                  placeholder="e.g. 50% Corpus Milestone"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={milestoneAmount}
                    onChange={(e) => setMilestoneAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    required
                    value={milestoneDate}
                    onChange={(e) => setMilestoneDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMilestoneModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMilestoneMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs"
                >
                  Add Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Asset Modal */}
      {isLinkAssetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-100">Link Bank Account or Asset</h3>
            <form onSubmit={handleLinkAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Account
                </label>
                <select
                  required
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none"
                >
                  <option value="">Select an account...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatCurrency(acc.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLinkAssetModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateGoalMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs"
                >
                  Link Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
