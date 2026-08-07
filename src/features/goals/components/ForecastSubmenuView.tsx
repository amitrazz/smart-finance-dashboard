import React, { useState, useEffect } from "react";
import { useGoalForecast, useGoalProjection, useGoals } from "../hooks/useGoalQueries";
import { formatCurrency } from "../../../utils/formatters";
import { ErrorState } from "../../../components/common/ErrorState";
import { EmptyState } from "../../../components/common/EmptyState";
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Target,
  Calendar,
  Zap,
  BarChart3,
} from "lucide-react";
import { AsyncSearchSelect } from "../../../components/common/AsyncSearchSelect";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

type ForecastSubView = "projection" | "whatif" | "future-value";

// Hypothetical scenario projector for the user-driven "What-If Analysis" and
// "Future Value" tabs only — the backend doesn't (and can't) precompute an
// arbitrary user-adjusted scenario, so this is a legitimate client-side
// calculator, not a stand-in for real backend data.
const buildScenarioCurve = (
  currentCorpus: number,
  monthlyContrib: number,
  returnRate: number,
  months: number
) => {
  const points = [];
  let corpus = currentCorpus;
  const monthlyReturn = returnRate / 100 / 12;
  for (let i = 0; i <= Math.min(months, 60); i += 3) {
    corpus = corpus * Math.pow(1 + monthlyReturn, 3) + monthlyContrib * 3;
    points.push({
      month: `M+${i}`,
      corpus: Math.round(corpus),
    });
  }
  return points;
};

const RiskBadge: React.FC<{ isBehindSchedule: boolean }> = ({ isBehindSchedule }) =>
  isBehindSchedule ? (
    <span className="px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-black uppercase">Behind Schedule</span>
  ) : (
    <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase">On Track</span>
  );

// There is no cross-goal aggregate forecast/projection endpoint on the
// backend — GET /finance/goals/:id/forecast and /:id/projection both require
// a goal id. This view lets the user pick which goal to inspect instead of
// fabricating an "overall" figure.
export const ForecastSubmenuView: React.FC = () => {
  const { data: goals = [], isLoading: isLoadingGoals, isError: isGoalsError, refetch: refetchGoals } = useGoals();
  const [goalSearch, setGoalSearch] = useState("");
  const { data: goalSearchResults = [], isFetching: isGoalSearchFetching } = useGoals(
    goalSearch ? { search: goalSearch } : undefined
  );
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [subView, setSubView] = useState<ForecastSubView>("projection");

  useEffect(() => {
    if (!selectedGoalId && goals.length > 0) {
      setSelectedGoalId(goals.find((g) => g.status === "ACTIVE")?.id ?? goals[0].id);
    }
  }, [goals, selectedGoalId]);

  const { data: forecast, isLoading: isLoadingForecast, isError: isForecastError, refetch: refetchForecast } = useGoalForecast(selectedGoalId);
  const { data: projection, isLoading: isLoadingProjection, isError: isProjectionError, refetch: refetchProjection } = useGoalProjection(selectedGoalId);

  // What-if state
  const [whatIfContrib, setWhatIfContrib] = useState("50000");
  const [whatIfReturn, setWhatIfReturn] = useState("12");
  const [whatIfInflation, setWhatIfInflation] = useState("6");

  if (isLoadingGoals) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-slate-900/60 rounded-3xl border border-slate-800" />)}
        </div>
        <div className="h-72 bg-slate-900/60 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  if (isGoalsError) {
    return <ErrorState title="Failed to Load Goals" message="We couldn't load your goals." onRetry={() => refetchGoals()} />;
  }

  if (goals.length === 0) {
    return <EmptyState icon={<Target className="w-10 h-10 text-slate-600 mx-auto" aria-hidden="true" />} title="No Goals Yet" message="Create a goal to see its forecast here." />;
  }

  const selectedGoal = goals.find((g) => g.id === selectedGoalId);

  return (
    <div className="space-y-6">
      {/* Header + Goal Selector */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            Goal Forecast Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Linear pace projections, scenario analysis, and schedule tracking for a single goal
          </p>
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

      {(isLoadingForecast || isLoadingProjection) ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-slate-900/60 rounded-3xl border border-slate-800" />)}
          </div>
          <div className="h-72 bg-slate-900/60 rounded-3xl border border-slate-800" />
        </div>
      ) : (isForecastError || isProjectionError) ? (
        <ErrorState
          title="Failed to Load Forecast"
          message="We couldn't load this goal's forecast data."
          onRetry={() => {
            if (isForecastError) refetchForecast();
            if (isProjectionError) refetchProjection();
          }}
        />
      ) : (
        <ForecastContent
          forecast={forecast}
          projection={projection}
          goal={selectedGoal}
          subView={subView}
          setSubView={setSubView}
          whatIfContrib={whatIfContrib}
          setWhatIfContrib={setWhatIfContrib}
          whatIfReturn={whatIfReturn}
          setWhatIfReturn={setWhatIfReturn}
          whatIfInflation={whatIfInflation}
          setWhatIfInflation={setWhatIfInflation}
        />
      )}
    </div>
  );
};

interface ForecastContentProps {
  forecast?: ReturnType<typeof useGoalForecast>["data"];
  projection?: ReturnType<typeof useGoalProjection>["data"];
  goal?: ReturnType<typeof useGoals>["data"] extends (infer T)[] | undefined ? T : never;
  subView: ForecastSubView;
  setSubView: (v: ForecastSubView) => void;
  whatIfContrib: string;
  setWhatIfContrib: (v: string) => void;
  whatIfReturn: string;
  setWhatIfReturn: (v: string) => void;
  whatIfInflation: string;
  setWhatIfInflation: (v: string) => void;
}

const ForecastContent: React.FC<ForecastContentProps> = ({
  forecast, projection, goal, subView, setSubView,
  whatIfContrib, setWhatIfContrib, whatIfReturn, setWhatIfReturn, whatIfInflation, setWhatIfInflation,
}) => {
  const monthlyRequired = forecast?.monthlyRequiredContribution || { amount: "0", currency: "INR" };
  const isBehindSchedule = forecast?.isBehindSchedule ?? false;
  const fundingGap = forecast?.fundingGap || { amount: "0", currency: "INR" };
  const monthsRemaining = forecast?.monthsRemaining ?? null;
  const expectedCompletion = forecast?.expectedCompletionDate ?? "—";
  const monthlyPace = forecast?.monthlyContributionRate || { amount: "0", currency: "INR" };

  const currentCorpusNum = parseFloat(goal?.currentCorpus?.amount || goal?.currentAmount?.amount || "0") || 0;
  const targetCorpusNum = parseFloat(goal?.targetAmount?.amount || "0") || 0;

  // What-If scenario data — a user-driven hypothetical calculator (slider inputs
  // below), not a substitute for backend-provided data.
  const whatIfData = buildScenarioCurve(
    currentCorpusNum,
    parseFloat(whatIfContrib) || 50000,
    parseFloat(whatIfReturn) || 12,
    36
  );

  const computeFutureValue = (months: number) => {
    const r = parseFloat(whatIfReturn) / 100 / 12;
    const n = months;
    const pmt = parseFloat(whatIfContrib) || 50000;
    const pv = currentCorpusNum;
    if (r === 0) return pv + pmt * n;
    return pv * Math.pow(1 + r, n) + pmt * ((Math.pow(1 + r, n) - 1) / r);
  };

  const fv5y = computeFutureValue(60);
  const fv10y = computeFutureValue(120);
  const fv15y = computeFutureValue(180);
  const fv20y = computeFutureValue(240);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <RiskBadge isBehindSchedule={isBehindSchedule} />
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Months Remaining",
            value: monthsRemaining != null ? `${monthsRemaining}` : "—",
            color: isBehindSchedule ? "text-rose-400" : "text-emerald-400",
            bg: isBehindSchedule ? "from-rose-500/10 to-pink-500/10 border-rose-500/20" : "from-emerald-500/10 to-teal-500/10 border-emerald-500/20",
            icon: <ShieldCheck className="w-5 h-5" />,
          },
          {
            label: "Monthly Required",
            value: formatCurrency(monthlyRequired),
            color: "text-indigo-300",
            bg: "from-indigo-500/10 to-purple-500/10 border-indigo-500/20",
            icon: <Zap className="w-5 h-5" />,
          },
          {
            label: "Funding Gap",
            value: formatCurrency(fundingGap),
            color: "text-rose-400",
            bg: "from-rose-500/10 to-pink-500/10 border-rose-500/20",
            icon: <AlertTriangle className="w-5 h-5" />,
          },
          {
            label: "Current Monthly Pace",
            value: formatCurrency(monthlyPace),
            color: "text-amber-400",
            bg: "from-amber-500/10 to-orange-500/10 border-amber-500/20",
            icon: <Calendar className="w-5 h-5" />,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={`p-5 rounded-2xl bg-gradient-to-br ${kpi.bg} border space-y-2`}
          >
            <div className={kpi.color}>{kpi.icon}</div>
            <p className={`text-2xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Completion Date */}
      <div className="grid grid-cols-1 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Target className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Expected Completion</p>
            <p className="text-lg font-extrabold text-emerald-400">{expectedCompletion}</p>
            <p className="text-[10px] text-slate-400">At current contribution pace</p>
          </div>
        </div>
      </div>

      {/* Sub-View Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {([
          { id: "projection", label: "Progress vs Expected", icon: <TrendingUp className="w-3.5 h-3.5" /> },
          { id: "whatif", label: "What-If Analysis", icon: <Sparkles className="w-3.5 h-3.5" /> },
          { id: "future-value", label: "Future Value", icon: <BarChart3 className="w-3.5 h-3.5" /> },
        ] as Array<{ id: ForecastSubView; label: string; icon: React.ReactNode }>).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubView(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subView === tab.id
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-View: Progress vs Expected (backend's real risk classification) */}
      {subView === "projection" && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-5">
          <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            Actual vs Expected Progress
          </h3>
          {projection ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">Expected Progress</span>
                    <span className="text-slate-400">{projection.expectedProgressPercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden">
                    <div className="h-full rounded-full bg-slate-600" style={{ width: `${Math.min(100, Math.max(0, projection.expectedProgressPercent))}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">Actual Progress</span>
                    <span className="text-slate-400">{projection.actualProgressPercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, Math.max(0, projection.actualProgressPercent))}%` }} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Risk Level</p>
                  <p className="text-sm font-extrabold text-slate-100">{projection.riskLevel.replace(/_/g, " ")}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Contribution Trend</p>
                  <p className="text-sm font-extrabold text-slate-100">{projection.contributionTrend}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Delay</p>
                  <p className="text-sm font-extrabold text-slate-100">{projection.delayMonths != null ? `${projection.delayMonths} mo` : "—"}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">No projection data available for this goal.</div>
          )}
        </div>
      )}

      {/* Sub-View: What-If Analysis */}
      {subView === "whatif" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scenario Inputs */}
          <div className="p-5 rounded-3xl bg-slate-900/60 border border-indigo-500/20 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Scenario Inputs
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Monthly Contribution (₹)</label>
                <input
                  type="number"
                  value={whatIfContrib}
                  onChange={(e) => setWhatIfContrib(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors font-bold"
                />
                <input
                  type="range"
                  min="10000"
                  max="200000"
                  step="5000"
                  value={whatIfContrib}
                  onChange={(e) => setWhatIfContrib(e.target.value)}
                  className="w-full mt-2 accent-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Expected Return Rate (%)</label>
                <input
                  type="number"
                  value={whatIfReturn}
                  onChange={(e) => setWhatIfReturn(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors font-bold"
                />
                <input
                  type="range"
                  min="4"
                  max="20"
                  step="0.5"
                  value={whatIfReturn}
                  onChange={(e) => setWhatIfReturn(e.target.value)}
                  className="w-full mt-2 accent-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Inflation Rate (%)</label>
                <input
                  type="number"
                  value={whatIfInflation}
                  onChange={(e) => setWhatIfInflation(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors font-bold"
                />
                <input
                  type="range"
                  min="2"
                  max="12"
                  step="0.5"
                  value={whatIfInflation}
                  onChange={(e) => setWhatIfInflation(e.target.value)}
                  className="w-full mt-2 accent-indigo-500"
                />
              </div>
            </div>

            {/* Scenario Result Summary */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/20 space-y-2">
              <p className="text-[10px] font-black text-indigo-400 uppercase">Scenario 3-Year Corpus</p>
              <p className="text-2xl font-extrabold text-slate-100">
                ₹{(whatIfData[whatIfData.length - 1]?.corpus || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400">
                Real return (inflation-adjusted): {Math.max(0, parseFloat(whatIfReturn) - parseFloat(whatIfInflation)).toFixed(1)}% p.a.
              </p>
            </div>
          </div>

          {/* Scenario Chart */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-100">Scenario vs Target</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={whatIfData}>
                  <defs>
                    <linearGradient id="whatIfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: 12 }}
                    formatter={(val) => [`₹${Number(val || 0).toLocaleString()}`, "Scenario Corpus"]}
                  />
                  <ReferenceLine y={targetCorpusNum} stroke="#10b981" strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="corpus" stroke="#a855f7" fill="url(#whatIfGrad)" strokeWidth={2.5} dot={false} name="Scenario" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Sub-View: Future Value Table */}
      {subView === "future-value" && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-5">
          <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Compound Future Value Projections
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "5 Years", months: 60, value: fv5y },
              { label: "10 Years", months: 120, value: fv10y },
              { label: "15 Years", months: 180, value: fv15y },
              { label: "20 Years", months: 240, value: fv20y },
            ].map((row) => (
              <div key={row.label} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase">{row.label}</p>
                <p className="text-xl font-extrabold text-emerald-400">
                  ₹{(row.value / 100000).toFixed(1)}L
                </p>
                <p className="text-[10px] text-slate-400">
                  {row.value >= targetCorpusNum ? "✅ Goal Met" : "⚠ Below Target"}
                </p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-xs text-slate-400 space-y-1">
            <p className="font-bold text-indigo-300">Assumptions</p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-400">
              <li>Monthly contribution: ₹{Number(whatIfContrib).toLocaleString()}</li>
              <li>Expected annual return: {whatIfReturn}% (compounded monthly)</li>
              <li>Inflation rate: {whatIfInflation}%</li>
              <li>Current corpus: ₹{currentCorpusNum.toLocaleString()}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForecastSubmenuView;
