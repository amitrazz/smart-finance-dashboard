import React from "react";
import { HeartPulse } from "lucide-react";
import { EmptyState } from "../common/EmptyState";
import { ProgressRing } from "./ProgressRing";

interface GoalHealthCardProps {
  goalName?: string;
  probabilityPercent?: number;
  isBehindSchedule?: boolean;
}

/**
 * There is no per-goal health-score endpoint (GoalHealthData exists as a type
 * but nothing returns it) — this card only renders the one real signal we do
 * have (completionProbability from GoalDashboardData) and otherwise shows an
 * empty state rather than inventing a score.
 */
export const GoalHealthCard: React.FC<GoalHealthCardProps> = ({ goalName, probabilityPercent, isBehindSchedule }) => {
  if (probabilityPercent === undefined) {
    return (
      <EmptyState
        icon={<HeartPulse className="w-10 h-10 text-slate-600 mx-auto" aria-hidden="true" />}
        title="Health Score Unavailable"
        message="The backend doesn't provide a per-goal health score yet. Completion probability will appear here once available."
      />
    );
  }

  const color = probabilityPercent >= 70 ? "#10b981" : probabilityPercent >= 40 ? "#f59e0b" : "#f43f5e";

  return (
    <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center gap-4">
      <ProgressRing percent={probabilityPercent} size={64} strokeWidth={6} color={color} />
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Completion Probability</p>
        {goalName && <p className="text-sm font-semibold text-slate-100 truncate">{goalName}</p>}
        {isBehindSchedule && <p className="text-[11px] text-amber-400 font-semibold mt-1">Currently behind schedule</p>}
      </div>
    </div>
  );
};

export default GoalHealthCard;
