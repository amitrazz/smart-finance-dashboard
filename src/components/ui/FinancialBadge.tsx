import React from "react";
import {
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  LineChart,
  Landmark,
  CreditCard,
  Target,
  PiggyBank,
  Banknote,
  HelpCircle,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type FinancialCategory =
  | "income"
  | "expense"
  | "transfer"
  | "investment"
  | "loan"
  | "credit"
  | "goal"
  | "savings"
  | "cash"
  | "unknown";

export interface FinancialBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  category: FinancialCategory | string;
  label?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  variant?: "solid" | "subtle" | "outline";
}

const financialConfig: Record<
  FinancialCategory,
  { label: string; bg: string; text: string; border: string; icon: React.FC<{ className?: string }> }
> = {
  income: {
    label: "Income",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    icon: TrendingUp,
  },
  expense: {
    label: "Expense",
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/20",
    icon: TrendingDown,
  },
  transfer: {
    label: "Transfer",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
    icon: ArrowLeftRight,
  },
  investment: {
    label: "Investment",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/20",
    icon: LineChart,
  },
  loan: {
    label: "Loan",
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/20",
    icon: Landmark,
  },
  credit: {
    label: "Credit Card",
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    border: "border-indigo-500/20",
    icon: CreditCard,
  },
  goal: {
    label: "Goal",
    bg: "bg-teal-500/10",
    text: "text-teal-400",
    border: "border-teal-500/20",
    icon: Target,
  },
  savings: {
    label: "Savings",
    bg: "bg-emerald-600/10",
    text: "text-emerald-300",
    border: "border-emerald-600/20",
    icon: PiggyBank,
  },
  cash: {
    label: "Cash",
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/20",
    icon: Banknote,
  },
  unknown: {
    label: "Uncategorized",
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/20",
    icon: HelpCircle,
  },
};

export const FinancialBadge: React.FC<FinancialBadgeProps> = ({
  category,
  label,
  size = "md",
  showIcon = true,
  variant = "subtle",
  className,
  ...props
}) => {
  const normalizedKey = (category.toString().toLowerCase().replace(/[\s-]/g, "_")) as FinancialCategory;
  const config = financialConfig[normalizedKey] || {
    label: label || category,
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/20",
    icon: HelpCircle,
  };

  const displayLabel = label || config.label;
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1 rounded-md",
    md: "px-2.5 py-1 text-xs gap-1.5 rounded-lg",
    lg: "px-3 py-1.5 text-xs font-semibold gap-2 rounded-xl",
  };

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center font-medium border shrink-0 transition-colors",
          variant === "subtle" && `${config.bg} ${config.text} ${config.border}`,
          variant === "outline" && `bg-transparent ${config.text} ${config.border}`,
          sizeClasses[size],
          className
        )
      )}
      {...props}
    >
      {showIcon && <IconComponent className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />}
      <span>{displayLabel}</span>
    </span>
  );
};

export default FinancialBadge;
