import React from "react";
import { CheckCircle2, Circle, Flag } from "lucide-react";
import { GoalMilestone } from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { EmptyState } from "../common/EmptyState";

interface MilestoneTimelineProps {
  milestones: GoalMilestone[];
  onAddMilestone?: () => void;
}

export const MilestoneTimeline: React.FC<MilestoneTimelineProps> = ({ milestones, onAddMilestone }) => {
  if (!milestones || milestones.length === 0) {
    return (
      <EmptyState
        icon={<Flag className="w-10 h-10 text-slate-600 mx-auto" aria-hidden="true" />}
        title="No Milestones Yet"
        message="Add milestones to track meaningful checkpoints along the way to this goal."
        actionLabel={onAddMilestone ? "Add Milestone" : undefined}
        onAction={onAddMilestone}
      />
    );
  }

  return (
    <div className="space-y-0">
      {milestones.map((m, i) => (
        <div key={m.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            {m.status === "ACHIEVED" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            ) : (
              <Circle className="w-5 h-5 text-slate-600" aria-hidden="true" />
            )}
            {i < milestones.length - 1 && <div className="w-px flex-1 bg-slate-800 my-1" />}
          </div>
          <div className="pb-5 min-w-0">
            <p className="text-sm font-bold text-slate-100">{m.name}</p>
            <p className="text-xs text-slate-500">
              {m.targetAmount ? formatCurrency(m.targetAmount) : ""}
              {m.targetDate ? ` · ${formatDate(m.targetDate)}` : ""}
            </p>
            {m.status === "ACHIEVED" && m.achievedDate && (
              <p className="text-[11px] text-emerald-400 mt-0.5">Achieved {formatDate(m.achievedDate)}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MilestoneTimeline;
