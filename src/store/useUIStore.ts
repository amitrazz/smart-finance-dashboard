import { create } from "zustand";

export type NavTab =
  | "dashboard"
  | "onboarding"
  | "accounts"
  | "transactions"
  | "imports"
  | "budgets"
  | "investments"
  | "loans"
  | "goals"
  | "analytics"
  | "insights"
  | "notifications"
  | "settings";

interface UIState {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;
  isAddTransactionOpen: boolean;
  setAddTransactionOpen: (open: boolean) => void;
  isAddAccountOpen: boolean;
  setAddAccountOpen: (open: boolean) => void;
  isImportModalOpen: boolean;
  setImportModalOpen: (open: boolean) => void;
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string | null) => void;
  toastMessage: { id: string; text: string; type: "success" | "error" | "info" } | null;
  showToast: (text: string | Error | unknown, type?: "success" | "error" | "info") => void;
  hideToast: () => void;
  onboardingCurrentStep: number;
  setOnboardingCurrentStep: (step: number) => void;
  completedStepIds: number[];
  markStepCompleted: (step: number) => void;
  setCompletedStepIds: (steps: number[]) => void;
  resetUIState: () => void;
}

export const VALID_TABS: NavTab[] = [
  "dashboard",
  "onboarding",
  "accounts",
  "transactions",
  "imports",
  "budgets",
  "investments",
  "loans",
  "goals",
  "analytics",
  "insights",
  "notifications",
  "settings",
];

const getInitialTab = (): NavTab => {
  try {
    const hash = window.location.hash.replace(/^#\/?/, "");
    if (hash && VALID_TABS.includes(hash as NavTab)) {
      return hash as NavTab;
    }
  } catch {
    // Ignore location errors
  }
  return "dashboard";
};

export const useUIStore = create<UIState>((set) => ({
  activeTab: getInitialTab(),
  setActiveTab: (activeTab) => {
    try {
      if (window.location.hash.replace(/^#\/?/, "") !== activeTab) {
        window.history.pushState(null, "", `#/${activeTab}`);
      }
    } catch {
      // Ignore location errors
    }
    set({ activeTab });
  },
  isSearchOpen: false,
  setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  isAddTransactionOpen: false,
  setAddTransactionOpen: (isAddTransactionOpen) => set({ isAddTransactionOpen }),
  isAddAccountOpen: false,
  setAddAccountOpen: (isAddAccountOpen) => set({ isAddAccountOpen }),
  isImportModalOpen: false,
  setImportModalOpen: (isImportModalOpen) => set({ isImportModalOpen }),
  selectedAccountId: null,
  setSelectedAccountId: (selectedAccountId) => set({ selectedAccountId }),
  toastMessage: null,
  showToast: (text, type = "success") => {
    const id = Math.random().toString(36).substring(7);
    let displayText: string;
    if (text !== null && typeof text === "object" && "userMessage" in text) {
      displayText = String((text as { userMessage: unknown }).userMessage);
    } else if (text !== null && typeof text === "object" && "message" in text) {
      displayText = String((text as { message: unknown }).message);
    } else {
      displayText = String(text);
    }
    set({ toastMessage: { id, text: displayText, type } });
    setTimeout(() => {
      set((state) => (state.toastMessage?.id === id ? { toastMessage: null } : state));
    }, 4000);
  },
  hideToast: () => set({ toastMessage: null }),
  onboardingCurrentStep: 1,
  setOnboardingCurrentStep: (onboardingCurrentStep) => set({ onboardingCurrentStep }),
  completedStepIds: [],
  markStepCompleted: (step) =>
    set((state) => ({
      completedStepIds: state.completedStepIds.includes(step)
        ? state.completedStepIds
        : [...state.completedStepIds, step],
    })),
  setCompletedStepIds: (completedStepIds) => set({ completedStepIds }),
  resetUIState: () =>
    set({
      activeTab: "dashboard",
      isSearchOpen: false,
      isAddTransactionOpen: false,
      isAddAccountOpen: false,
      isImportModalOpen: false,
      selectedAccountId: null,
      onboardingCurrentStep: 1,
      completedStepIds: [],
    }),
}));
