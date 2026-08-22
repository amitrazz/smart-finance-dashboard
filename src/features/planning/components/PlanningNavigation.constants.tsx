import React from "react";
import { LayoutDashboard, Target, Wallet, Lightbulb, FileBarChart, Sparkles, CalendarClock } from "lucide-react";

export type PlanningSection = "overview" | "monthly-plan" | "goals" | "budgets" | "ai-plans" | "insights" | "reports";

export interface SecondaryTab {
  id: string;
  label: string;
}

export interface PrimaryTab {
  id: PlanningSection;
  label: string;
  icon: React.ReactNode;
  defaultSub: string | null;
  secondaryTabs?: SecondaryTab[];
}

export const PLANNING_TABS: PrimaryTab[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-3.5 h-3.5" />, defaultSub: null },
  {
    id: "monthly-plan",
    label: "Monthly Plan",
    icon: <CalendarClock className="w-3.5 h-3.5" />,
    defaultSub: null,
  },
  {
    id: "goals",
    label: "Goals",
    icon: <Target className="w-3.5 h-3.5" />,
    defaultSub: "active",
    secondaryTabs: [
      { id: "active", label: "Active" },
      { id: "analytics", label: "Analytics" },
      { id: "forecast", label: "Forecast" },
      { id: "completed", label: "Completed" },
      { id: "archived", label: "Archived" },
    ],
  },
  {
    id: "budgets",
    label: "Budgets",
    icon: <Wallet className="w-3.5 h-3.5" />,
    defaultSub: "active",
    secondaryTabs: [
      { id: "active", label: "Active" },
      { id: "analytics", label: "Analytics" },
      { id: "categories", label: "Categories" },
      { id: "forecast", label: "Forecast" },
      { id: "history", label: "History" },
    ],
  },
  {
    id: "ai-plans",
    label: "AI Plans",
    icon: <Sparkles className="w-3.5 h-3.5" />,
    defaultSub: null,
  },
  {
    id: "insights",
    label: "Insights",
    icon: <Lightbulb className="w-3.5 h-3.5" />,
    defaultSub: "recommendations",
    secondaryTabs: [
      { id: "recommendations", label: "Recommendations" },
      { id: "risks", label: "Risks" },
      { id: "trends", label: "Trends" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: <FileBarChart className="w-3.5 h-3.5" />,
    defaultSub: "planning-summary",
    secondaryTabs: [
      { id: "monthly-budget-review", label: "Monthly Budget Review" },
      { id: "goal-progress", label: "Goal Progress" },
      { id: "savings", label: "Savings" },
      { id: "planning-summary", label: "Planning Summary" },
    ],
  },
];

export function getPrimaryTab(id: PlanningSection): PrimaryTab {
  return PLANNING_TABS.find((t) => t.id === id) ?? PLANNING_TABS[0];
}
