import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../services/api/endpoints";
import { useAuthStore } from "../../../store/useAuthStore";
import { useUIStore } from "../../../store/useUIStore";
import { CalendarEventItem } from "../../../types";
import {
  FinancialCalendarEvent,
  FinancialCalendarSummary,
  CalendarFilterCategory,
  FinancialCalendarEventCategory,
} from "../types";

// Calendar events are a derived read model recomputed from live loan/card/SIP/
// subscription/goal data on every fetch — there's no backend record to mark
// "dismissed". Dismiss/Snooze/Archive persist here instead, keyed by the
// event's deterministic id, so the toast claiming the reminder is hidden is
// actually true on the next render/refetch rather than the event reappearing.
const DISMISSED_EVENTS_KEY = "financialCalendar.dismissedEvents";

interface DismissedEventRecord {
  until?: string; // ISO date; snoozed events reappear once today >= until
}

function readDismissedEvents(): Record<string, DismissedEventRecord> {
  try {
    const raw = localStorage.getItem(DISMISSED_EVENTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeDismissedEvents(map: Record<string, DismissedEventRecord>) {
  try {
    localStorage.setItem(DISMISSED_EVENTS_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage failures (e.g. private browsing quota) — worst case the
    // reminder reappears on next load instead of crashing the app.
  }
}

export function dismissCalendarEventLocally(id: string, action: "DISMISS" | "SNOOZE" | "ARCHIVE") {
  const map = readDismissedEvents();
  if (action === "SNOOZE") {
    const until = new Date();
    until.setDate(until.getDate() + 1);
    map[id] = { until: until.toISOString().split("T")[0] };
  } else {
    map[id] = {};
  }
  writeDismissedEvents(map);
}

function filterLocallyDismissed(events: FinancialCalendarEvent[]): FinancialCalendarEvent[] {
  const map = readDismissedEvents();
  if (Object.keys(map).length === 0) return events;
  const todayStr = new Date().toISOString().split("T")[0];
  return events.filter((evt) => {
    const record = map[evt.id];
    if (!record) return true;
    if (record.until) return todayStr >= record.until;
    return false;
  });
}

export function mapCalendarItemToEvent(item: CalendarEventItem): FinancialCalendarEvent {
  const todayStr = new Date().toISOString().split("T")[0];

  let category: FinancialCalendarEventCategory = "REMINDER";
  let direction: "INCOMING" | "OUTGOING" | "NEUTRAL" = "OUTGOING";
  let priority: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
  let linkedEntityType: "account" | "loan" | "card" | "goal" | "subscription" | "investment" = "account";
  let deepLink = "accounts";

  switch (item.type) {
    case "EMI_DUE":
      category = "EMI";
      direction = "OUTGOING";
      priority = "HIGH";
      linkedEntityType = "loan";
      deepLink = "loans";
      break;
    case "CREDIT_CARD_DUE":
      category = "CREDIT_CARD";
      direction = "OUTGOING";
      priority = "HIGH";
      linkedEntityType = "card";
      deepLink = "accounts";
      break;
    case "SIP_DUE":
      category = "SIP";
      direction = "OUTGOING";
      priority = "MEDIUM";
      linkedEntityType = "investment";
      deepLink = "investments";
      break;
    case "SUBSCRIPTION_RENEWAL":
      category = "SUBSCRIPTION";
      direction = "OUTGOING";
      priority = "LOW";
      linkedEntityType = "subscription";
      deepLink = "budgets";
      break;
    case "GOAL_TARGET_DATE":
      category = "GOAL";
      direction = "NEUTRAL";
      priority = "MEDIUM";
      linkedEntityType = "goal";
      deepLink = "goals";
      break;
    default:
      if (item.sourceEntityType === "CreditCardStatement") {
        category = "CREDIT_CARD";
        linkedEntityType = "card";
        deepLink = "accounts";
      } else if (item.sourceEntityType === "EmiSchedule") {
        category = "EMI";
        linkedEntityType = "loan";
        deepLink = "loans";
      } else if (item.sourceEntityType === "SipPlan") {
        category = "SIP";
        linkedEntityType = "investment";
        deepLink = "investments";
      } else if (item.sourceEntityType === "Subscription") {
        category = "SUBSCRIPTION";
        linkedEntityType = "subscription";
        deepLink = "budgets";
      } else if (item.sourceEntityType === "Goal") {
        category = "GOAL";
        linkedEntityType = "goal";
        deepLink = "goals";
      }
      break;
  }

  let status: "DUE_TODAY" | "UPCOMING" | "OVERDUE" = "UPCOMING";
  if (item.date === todayStr) {
    status = "DUE_TODAY";
  } else if (item.date < todayStr) {
    status = "OVERDUE";
  }

  const isAutoDebit = item.type === "EMI_DUE" || item.type === "SIP_DUE" || item.type === "SUBSCRIPTION_RENEWAL";

  return {
    id: `${item.sourceEntityType}-${item.sourceEntityId}-${item.date}`,
    title: item.title,
    category,
    date: item.date,
    amount: item.amount ? { amount: item.amount, currency: "INR" } : undefined,
    direction,
    priority,
    status,
    linkedEntityId: item.sourceEntityId,
    linkedEntityType,
    deepLink,
    notes: isAutoDebit
      ? "This will be auto-debited from your linked account on the due date."
      : "Manual payment required — pay before the due date to avoid penalties.",
    isAutoDebit,
  };
}

export function useFinancialCalendar(params?: {
  from?: string;
  to?: string;
  filter?: CalendarFilterCategory;
  search?: string;
}) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ["financialCalendar", params?.from, params?.to, params?.filter, params?.search],
    queryFn: async (): Promise<FinancialCalendarEvent[]> => {
      try {
        const rawItems = await api.getCalendar({
          from: params?.from,
          to: params?.to,
        });

        let mapped: FinancialCalendarEvent[] = [];

        if (Array.isArray(rawItems)) {
          mapped = rawItems.map(mapCalendarItemToEvent);
        }

        let filtered = [...mapped];

        // Client-side filtering by category/type as specified in Migration 11
        if (params?.filter && params.filter !== "ALL") {
          switch (params.filter) {
            case "BILLS":
            case "CREDIT_CARDS":
              filtered = filtered.filter((e) => e.category === "CREDIT_CARD");
              break;
            case "EMI":
              filtered = filtered.filter((e) => e.category === "EMI");
              break;
            case "INVESTMENTS":
              filtered = filtered.filter((e) => e.category === "SIP" || e.category === "INVESTMENT");
              break;
            case "GOALS":
              filtered = filtered.filter((e) => e.category === "GOAL");
              break;
            case "SUBSCRIPTION":
              filtered = filtered.filter((e) => e.category === "SUBSCRIPTION");
              break;
            case "UNREAD":
              filtered = filtered.filter((e) => e.status === "DUE_TODAY" || e.status === "OVERDUE");
              break;
            case "COMPLETED":
              filtered = filtered.filter((e) => e.status === "PAID" || e.status === "COMPLETED");
              break;
          }
        }

        if (params?.search) {
          const q = params.search.toLowerCase();
          filtered = filtered.filter(
            (e) =>
              e.title.toLowerCase().includes(q) ||
              (e.description && e.description.toLowerCase().includes(q)) ||
              (e.notes && e.notes.toLowerCase().includes(q))
          );
        }

        // Sort ascending by date
        filtered.sort((a, b) => a.date.localeCompare(b.date));

        return filterLocallyDismissed(filtered);
      } catch {
        return [];
      }
    },
    enabled: isAuthenticated,
  });
}

export function useUpcomingEvents(
  limitOrParams?: number | { limit?: number; from?: string; to?: string } | string,
  toParam?: string
) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  let limit: number | undefined;
  let from: string | undefined;
  let to: string | undefined;

  if (typeof limitOrParams === "number") {
    limit = limitOrParams;
  } else if (typeof limitOrParams === "string") {
    from = limitOrParams;
    to = toParam;
  } else if (limitOrParams && typeof limitOrParams === "object") {
    limit = limitOrParams.limit;
    from = typeof limitOrParams.from === "string" ? limitOrParams.from : undefined;
    to = typeof limitOrParams.to === "string" ? limitOrParams.to : undefined;
  }

  return useQuery({
    queryKey: ["upcomingEvents", limit, from, to],
    queryFn: async (): Promise<FinancialCalendarEvent[]> => {
      try {
        const rawItems = await api.getCalendar({ from, to });
        if (Array.isArray(rawItems)) {
          const mapped = filterLocallyDismissed(rawItems.map(mapCalendarItemToEvent));
          return limit ? mapped.slice(0, limit) : mapped;
        }
        return [];
      } catch {
        return [];
      }
    },
    enabled: isAuthenticated,
  });
}

export function useFinancialCalendarSummary() {
  const { data: events = [] } = useFinancialCalendar();

  let outgoingTotal = 0;
  let incomingTotal = 0;

  let sipsCount = 0;
  let emisCount = 0;
  let creditCardsCount = 0;
  let subscriptionsCount = 0;

  events.forEach((evt) => {
    const val = parseFloat(evt.amount?.amount || "0");
    if (evt.direction === "OUTGOING") {
      outgoingTotal += val;
    } else if (evt.direction === "INCOMING") {
      incomingTotal += val;
    }

    switch (evt.category) {
      case "SIP":
        sipsCount++;
        break;
      case "EMI":
        emisCount++;
        break;
      case "CREDIT_CARD":
        creditCardsCount++;
        break;
      case "SUBSCRIPTION":
        subscriptionsCount++;
        break;
      case "GOAL":
        break;
    }
  });

  const summary: FinancialCalendarSummary = {
    upcoming30DaysOutgoing: { amount: outgoingTotal.toFixed(2), currency: "INR" },
    upcoming30DaysIncoming: { amount: incomingTotal.toFixed(2), currency: "INR" },
    netCashFlow: { amount: (incomingTotal - outgoingTotal).toFixed(2), currency: "INR" },
    counts: {
      bills: creditCardsCount,
      sips: sipsCount,
      emis: emisCount,
      salary: 0,
      fdMaturity: 0,
      creditCards: creditCardsCount,
      subscriptions: subscriptionsCount,
      insurance: 0,
    },
  };

  return summary;
}

// Calendar events are derived read models (not persisted records), so the
// only action here with a real, no-extra-input backend endpoint is
// confirming a subscription renewal. EMI/credit-card payments need an
// amount/account the compact action buttons don't collect, so those stay
// honest about not recording a payment. DISMISS/SNOOZE/ARCHIVE persist to
// localStorage (see dismissCalendarEventLocally) so "hidden" is actually true
// on the next render instead of the event reappearing after refetch.
export function useMarkEventAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "PAY" | "DISMISS" | "COMPLETE" | "SNOOZE" | "ARCHIVE" }) => {
      const segments = id.split("-");
      const sourceEntityType = segments[0];
      const sourceEntityId = segments.slice(1, -1).join("-");

      if (sourceEntityType === "Subscription" && (action === "PAY" || action === "COMPLETE") && sourceEntityId) {
        await api.confirmSubscription(sourceEntityId);
        return { id, action, persisted: true };
      }

      if (action === "DISMISS" || action === "SNOOZE" || action === "ARCHIVE") {
        dismissCalendarEventLocally(id, action);
      } else if (action === "PAY" || action === "COMPLETE") {
        // Not a real payment record, but the toast tells the user the
        // reminder itself is hidden — make that true for this instance too.
        dismissCalendarEventLocally(id, "ARCHIVE");
      }

      return { id, action, persisted: false };
    },
    onSuccess: (result, { action }) => {
      if (result.persisted) {
        useUIStore.getState().showToast(
          action === "PAY" ? "Subscription payment confirmed" : "Subscription marked complete",
          "success",
        );
        queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      } else if (action === "PAY" || action === "COMPLETE") {
        useUIStore.getState().showToast(
          "Reminder hidden here — open the related module to record the actual payment.",
          "info",
        );
      } else if (action === "SNOOZE") {
        useUIStore.getState().showToast("Reminder snoozed until tomorrow", "info");
      } else {
        useUIStore.getState().showToast("Reminder hidden", "info");
      }
      queryClient.invalidateQueries({ queryKey: ["financialCalendar"] });
    },
    onError: (err) => {
      const message = (err as { message?: string })?.message || "Action failed. Please try again.";
      useUIStore.getState().showToast(message, "error");
    },
  });
}
