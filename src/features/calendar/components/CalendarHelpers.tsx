
import {
  Calendar,
  CreditCard,
  Building,
  TrendingUp,
  Zap,
  ShieldCheck,
  Award,
  Sparkles,
  Bell,
} from "lucide-react";
import { FinancialCalendarEventCategory } from "../types";

export const getCategoryStyles = (category: FinancialCalendarEventCategory) => {
  switch (category) {
    case "SALARY":
      return {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
        badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
        label: "Salary",
      };
    case "BILL":
      return {
        bg: "bg-rose-500/10",
        border: "border-rose-500/30",
        text: "text-rose-400",
        badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
        icon: <Zap className="w-5 h-5 text-rose-400" />,
        label: "Bill Due",
      };
    case "EMI":
      return {
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        text: "text-amber-400",
        badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        icon: <Building className="w-5 h-5 text-amber-400" />,
        label: "Loan EMI",
      };
    case "CREDIT_CARD":
      return {
        bg: "bg-purple-500/10",
        border: "border-purple-500/30",
        text: "text-purple-400",
        badge: "bg-purple-500/20 text-purple-300 border-purple-500/40",
        icon: <CreditCard className="w-5 h-5 text-purple-400" />,
        label: "Credit Card",
      };
    case "INVESTMENT":
    case "SIP":
      return {
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/30",
        text: "text-indigo-400",
        badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
        icon: <TrendingUp className="w-5 h-5 text-indigo-400" />,
        label: category === "SIP" ? "Mutual Fund SIP" : "Investment",
      };
    case "FD_MATURITY":
      return {
        bg: "bg-sky-500/10",
        border: "border-sky-500/30",
        text: "text-sky-400",
        badge: "bg-sky-500/20 text-sky-300 border-sky-500/40",
        icon: <Award className="w-5 h-5 text-sky-400" />,
        label: "FD Maturity",
      };
    case "DIVIDEND":
      return {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
        badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
        label: "Dividend",
      };
    case "SUBSCRIPTION":
      return {
        bg: "bg-pink-500/10",
        border: "border-pink-500/30",
        text: "text-pink-400",
        badge: "bg-pink-500/20 text-pink-300 border-pink-500/40",
        icon: <Calendar className="w-5 h-5 text-pink-400" />,
        label: "Subscription",
      };
    case "INSURANCE":
      return {
        bg: "bg-teal-500/10",
        border: "border-teal-500/30",
        text: "text-teal-400",
        badge: "bg-teal-500/20 text-teal-300 border-teal-500/40",
        icon: <ShieldCheck className="w-5 h-5 text-teal-400" />,
        label: "Insurance Renewal",
      };
    case "GOAL":
      return {
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/30",
        text: "text-yellow-400",
        badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
        icon: <Sparkles className="w-5 h-5 text-yellow-400" />,
        label: "Goal Milestone",
      };
    default:
      return {
        bg: "bg-slate-800/40",
        border: "border-slate-700/50",
        text: "text-slate-300",
        badge: "bg-slate-800 text-slate-300 border-slate-700",
        icon: <Bell className="w-5 h-5 text-slate-400" />,
        label: "Notification",
      };
  }
};

export const getSmartCountdown = (dateString: string): string => {
  if (!dateString) return "Approaching";
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eventDate = new Date(dateString);
  eventDate.setHours(0, 0, 0, 0);

  const diffTime = eventDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  if (diffDays === 0) return "Due Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "1 Day Overdue";
  if (diffDays < -1) return `${Math.abs(diffDays)} Days Overdue`;
  if (diffDays <= 7) return `In ${diffDays} Days`;
  if (diffDays <= 14) return `Next Week`;
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} Weeks Left`;

  return eventDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
};
