import { Money } from "../../types";

export type FinancialCalendarEventCategory =
  | "SALARY"
  | "BILL"
  | "EMI"
  | "CREDIT_CARD"
  | "INVESTMENT"
  | "SIP"
  | "FD_MATURITY"
  | "INSURANCE"
  | "SUBSCRIPTION"
  | "DIVIDEND"
  | "GOAL"
  | "REMINDER"
  | "IMPORT"
  | "SMART_ACTION"
  | "SYSTEM";

export type EventPriority = "HIGH" | "MEDIUM" | "LOW";

export type EventStatus =
  | "DUE_TODAY"
  | "UPCOMING"
  | "OVERDUE"
  | "PAID"
  | "COMPLETED"
  | "DISMISSED"
  | "ARCHIVED";

export interface FinancialCalendarEvent {
  id: string;
  title: string;
  description?: string;
  category: FinancialCalendarEventCategory;
  date: string; // ISO format or YYYY-MM-DD
  amount?: Money;
  direction?: "INCOMING" | "OUTGOING" | "NEUTRAL";
  priority: EventPriority;
  status: EventStatus;
  accountName?: string;
  institutionName?: string;
  linkedEntityId?: string;
  linkedEntityType?: "account" | "loan" | "card" | "goal" | "subscription" | "investment" | "insight";
  deepLink?: string;
  isAutoDebit?: boolean;
  notes?: string;
  explanation?: string;
  createdAt?: string;
  isRead?: boolean;
}

export type CalendarViewMode = "UPCOMING" | "MONTH" | "WEEK" | "DAY";

export type CalendarFilterCategory =
  | "ALL"
  | "BILLS"
  | "EMI"
  | "SALARY"
  | "INVESTMENTS"
  | "GOALS"
  | "INSURANCE"
  | "SUBSCRIPTION"
  | "CREDIT_CARDS"
  | "UNREAD"
  | "COMPLETED";

export type NotificationCenterSubTab = "CALENDAR" | "SMART_ACTIONS" | "SYSTEM_ALERTS" | "ACTIVITY";

export interface FinancialCalendarSummary {
  upcoming30DaysOutgoing: Money;
  upcoming30DaysIncoming: Money;
  netCashFlow: Money;
  counts: {
    bills: number;
    sips: number;
    emis: number;
    salary: number;
    fdMaturity: number;
    creditCards: number;
    subscriptions: number;
    insurance: number;
  };
}

export interface DayCalendarSchedule {
  date: string;
  events: FinancialCalendarEvent[];
  summary: {
    totalIncoming: number;
    totalOutgoing: number;
  };
}
