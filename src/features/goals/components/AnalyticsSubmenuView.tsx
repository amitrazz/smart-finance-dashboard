import React, { useState, useEffect } from "react";
import { useGoalAnalytics, useGoals } from "../hooks/useGoalQueries";
import { formatCurrency } from "../../../utils/formatters";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState } from "../../../components/common/ErrorState";
import { BarChart3, TrendingUp, ShieldCheck, AlertTriangle, Target } from "lucide-react";
import { AsyncSearchSelect } from "../../../components/common/AsyncSearchSelect";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type AnalyticsSubView = "growth" | "trends" | "health" | "risk";

const HealthGauge: React.FC<{ score: number; band: string }> = ({ score, band }) => {
  const getColor = (b: string) => {
    if (b === "EXCELLENT") return { stroke: "#10b981", text: "text-emerald-400" };
    if (b === "GOOD") return { stroke: "#f59e0b", text: "text-amber-400" };
    if (b === "FAIR") return { stroke: "#f97316", text: "text-orange-400" };
    return { stroke: "#f43f5e", text: "text-rose-400" };
  };

  const { stroke, text } = getColor(band);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - score / 100);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#1e293b" strokeWidth="12" />
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-black ${text}`}>{score}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase">/ 100</span>
        </div>
      </div>
      <div className="text-center">
        <p className={`text-lg font-extrabold ${text}`}>{band}</p>
        <p className="text-xs text-slate-400">Overall Goal Health Score</p>
      </div>
    </div>
  );
};

// There is no cross-goal aggregate analytics endpoint on the backend — GET
// /finance/goals/:id/analytics requires a goal id. This view lets the user
// pick which goal to inspect instead of fabricating an "overall" figure.
export const AnalyticsSubmenuView: React.FC = () => {
  const { data: goals = [], isLoading: isLoadingGoals, isError: isGoalsError, refetch: refetchGoals } = useGoals();
  const [goalSearch, setGoalSearch] = useState("");
  const { data: goalSearchResults = [], isFetching: isGoalSearchFetching } = useGoals(
    goalSearch ? { search: goalSearch } : undefined
  );
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [subView, setSubView] = useState<AnalyticsSubView>("growth");

  useEffect(() => {
    if (!selectedGoalId && goals.length > 0) {
      setSelectedGoalId(goals.find((g) => g.status === "ACTIVE")?.id ?? goals[0].id);
    }
  }, [goals, selectedGoalId]);

  const { data: analytics, isLoading, isError, refetch } = useGoalAnalytics(selectedGoalId);

  if (isLoadingGoals) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-slate-900/60 rounded-3xl border border-slate-800" />)}
        </div>
        <div className="h-72 bg-slate-900/60 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  if (isGoalsError) {
    return <ErrorState title="Failed to Load Goals" message="We couldn't load your goals." onRetry={() => refetchGoals()} />;
  }

  if (goals.length === 0) {
    return <EmptyState icon={<Target className="w-10 h-10 text-slate-600 mx-auto" aria-hidden="true" />} title="No Goals Yet" message="Create a goal to see its analytics here." />;
  }

  return (
    <div className="space-y-6">
      {/* Header + Goal Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Goal Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-1">Corpus, contribution, and health analytics for a single goal</p>
        </div>
        <div className="w-48">
          <AsyncSearchSelect
            value={selectedGoalId}
            valueLabel={goals.find((g) => g.id === selectedGoalId)?.name}
            items={goalSearchResults}
            isFetching={isGoalSearchFetching}
            onSearch={setGoalSearch}
            onSelect={(g) => setSelectedGoalId(g.id)}
            getOptionKey={(g) => g.id}
            placeholder="Select goal"
            emptyMessage="No matching goals"
            renderOption={(g) => <span className="truncate">{g.name}</span>}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-slate-900/60 rounded-3xl border border-slate-800" />)}
          </div>
          <div className="h-72 bg-slate-900/60 rounded-3xl border border-slate-800" />
        </div>
      ) : isError ? (
        <ErrorState title="Failed to Load Goal Analytics" message="We couldn't load this goal's analytics data." onRetry={() => refetch()} />
      ) : !analytics ? (
        <EmptyState title="No Analytics Available" message="This goal doesn't have analytics data yet." />
      ) : (
        <AnalyticsContent analytics={analytics} subView={subView} setSubView={setSubView} />
      )}
    </div>
  );
};

interface AnalyticsContentProps {
  analytics: NonNullable<ReturnType<typeof useGoalAnalytics>["data"]>;
  subView: AnalyticsSubView;
  setSubView: (v: AnalyticsSubView) => void;
}

const AnalyticsContent: React.FC<AnalyticsContentProps> = ({ analytics, subView, setSubView }) => {
  const corpusGrowth = analytics.corpusGrowth.map((p) => ({ date: p.date, corpus: parseFloat(p.corpusValue.amount) || 0 }));
  const contributionTrend = analytics.contributionTrend.map((p) => ({ month: p.month, amount: parseFloat(p.amount.amount) || 0 }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Corpus Value", value: formatCurrency(analytics.corpus.corpusValue), color: "text-emerald-400", icon: <TrendingUp className="w-5 h-5" /> },
          { label: "From Contributions", value: formatCurrency(analytics.corpus.contributionValue), color: "text-teal-300", icon: <BarChart3 className="w-5 h-5" /> },
          { label: "From Investments", value: formatCurrency(analytics.corpus.investmentValue), color: "text-indigo-300", icon: <Target className="w-5 h-5" /> },
          { label: "Milestones", value: `${analytics.milestoneProgress.achieved} / ${analytics.milestoneProgress.total}`, color: "text-purple-400", icon: <ShieldCheck className="w-5 h-5" /> },
        ].map((kpi) => (
          <div key={kpi.label} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className={`${kpi.color}`}>{kpi.icon}</div>
            <p className={`text-xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Sub-View Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {([
          { id: "growth", label: "Growth", icon: <TrendingUp className="w-3.5 h-3.5" /> },
          { id: "trends", label: "Trends", icon: <BarChart3 className="w-3.5 h-3.5" /> },
          { id: "health", label: "Goal Health", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
          { id: "risk", label: "Risk", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
        ] as Array<{ id: AnalyticsSubView; label: string; icon: React.ReactNode }>).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubView(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              subView === tab.id
                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-View: Growth */}
      {subView === "growth" && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Corpus Growth History
          </h3>
          <div className="h-72 w-full">
            {corpusGrowth.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No growth history data from backend.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={corpusGrowth}>
                  <defs>
                    <linearGradient id="corpusGradAnal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: 11 }} />
                  <Area type="monotone" dataKey="corpus" stroke="#10b981" fill="url(#corpusGradAnal)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Sub-View: Trends */}
      {subView === "trends" && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" /> Contribution Trend
          </h3>
          <div className="h-72 w-full">
            {contributionTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No contribution trend data from backend.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contributionTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: 11 }}
                    formatter={(val) => [`₹${Number(val || 0).toLocaleString()}`, "Monthly Contribution"]}
                  />
                  <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Sub-View: Health Score */}
      {subView === "health" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex items-center justify-center">
            <HealthGauge score={analytics.health.score} band={analytics.health.band} />
          </div>
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Health Breakdown</h3>
            {[
              { label: "Contribution Consistency", value: analytics.health.contributionConsistency },
              { label: "Progress Alignment", value: analytics.health.progressAlignment },
              { label: "Funding Gap Score", value: analytics.health.fundingGap },
            ].map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">{item.label}</span>
                  <span className="text-slate-400">{item.value.toFixed(0)}/100</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.value >= 80 ? "bg-gradient-to-r from-emerald-500 to-teal-500" :
                      item.value >= 60 ? "bg-gradient-to-r from-amber-500 to-orange-500" :
                      "bg-gradient-to-r from-rose-500 to-red-500"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-View: Risk */}
      {subView === "risk" && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Risk Assessment
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Risk Level</p>
              <p className="text-sm font-extrabold text-slate-100">{analytics.projection.riskLevel.replace(/_/g, " ")}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Contribution Trend</p>
              <p className="text-sm font-extrabold text-slate-100">{analytics.projection.contributionTrend}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Delay</p>
              <p className="text-sm font-extrabold text-slate-100">{analytics.projection.delayMonths != null ? `${analytics.projection.delayMonths} mo` : "—"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsSubmenuView;
