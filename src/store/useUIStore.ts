import { create } from "zustand";

const MONEY_VISIBILITY_KEY = "finance.moneyVisibility";

const getInitialMoneyVisible = (): boolean => {
  try {
    return localStorage.getItem(MONEY_VISIBILITY_KEY) === "visible";
  } catch {
    return false;
  }
};

export type NavTab =
  | "dashboard"
  | "onboarding"
  | "accounts"
  | "credit-cards"
  | "transactions"
  | "imports"
  | "planning"
  | "investments"
  | "loans"
  | "analytics"
  | "insights"
  | "notifications"
  | "settings";

interface UIState {
  activeTab: NavTab;
  activeSubTab: string | null;
  setActiveTab: (tab: NavTab, subTab?: string | null) => void;
  setActiveSubTab: (subTab: string | null) => void;
  navigateToRoute: (tab: NavTab, subTab?: string | null) => void;

  // Privacy Mode
  moneyVisible: boolean;
  toggleMoneyVisibility: () => void;
  setMoneyVisible: (visible: boolean) => void;

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
  resetUIState: () => void;
}

export const VALID_TABS: NavTab[] = [
  "dashboard",
  "onboarding",
  "accounts",
  "credit-cards",
  "transactions",
  "imports",
  "planning",
  "investments",
  "loans",
  "analytics",
  "insights",
  "notifications",
  "settings",
];

// Goals and Budgets were merged into the unified "planning" tab. Old
// bookmarked/shared #/goals/... and #/budgets/... hashes are redirected here
// instead of silently falling back to the dashboard.
const LEGACY_TAB_REDIRECTS: Record<string, string> = {
  goals: "goals",
  budgets: "budgets",
};

export const parseHashRoute = (): { tab: NavTab; subTab: string | null } => {
  try {
    const raw = window.location.hash.replace(/^#\/?/, "");
    const parts = raw.split("/");
    const mainTab = parts[0];
    const rest = parts.slice(1).join("/") || null;

    if (mainTab && mainTab in LEGACY_TAB_REDIRECTS) {
      const section = LEGACY_TAB_REDIRECTS[mainTab];
      return { tab: "planning", subTab: rest ? `${section}/${rest}` : section };
    }

    if (mainTab && VALID_TABS.includes(mainTab as NavTab)) {
      return { tab: mainTab as NavTab, subTab: rest };
    }
  } catch {
    // Ignore location errors
  }
  return { tab: "dashboard", subTab: null };
};

const initialRoute = parseHashRoute();

export const useUIStore = create<UIState>((set, get) => ({
  activeTab: initialRoute.tab,
  activeSubTab: initialRoute.subTab,

  // Privacy Mode — hidden by default, persisted to localStorage
  moneyVisible: getInitialMoneyVisible(),
  toggleMoneyVisibility: () =>
    set((state) => {
      const next = !state.moneyVisible;
      try {
        localStorage.setItem(MONEY_VISIBILITY_KEY, next ? "visible" : "hidden");
      } catch { /* ignore */ }
      return { moneyVisible: next };
    }),
  setMoneyVisible: (visible: boolean) => {
    try {
      localStorage.setItem(MONEY_VISIBILITY_KEY, visible ? "visible" : "hidden");
    } catch { /* ignore */ }
    set({ moneyVisible: visible });
  },

  setActiveTab: (activeTab, subTab = null) => {
    try {
      const targetHash = subTab ? `#/${activeTab}/${subTab}` : `#/${activeTab}`;
      if (window.location.hash !== targetHash) {
        window.history.pushState(null, "", targetHash);
      }
    } catch {
      // Ignore location errors
    }
    set({ activeTab, activeSubTab: subTab });
  },

  setActiveSubTab: (activeSubTab) => {
    const { activeTab } = get();
    try {
      const targetHash = activeSubTab ? `#/${activeTab}/${activeSubTab}` : `#/${activeTab}`;
      if (window.location.hash !== targetHash) {
        window.history.pushState(null, "", targetHash);
      }
    } catch {
      // Ignore location errors
    }
    set({ activeSubTab });
  },

  navigateToRoute: (tab, subTab = null) => {
    try {
      const targetHash = subTab ? `#/${tab}/${subTab}` : `#/${tab}`;
      if (window.location.hash !== targetHash) {
        window.history.pushState(null, "", targetHash);
      }
    } catch {
      // Ignore location errors
    }
    set({ activeTab: tab, activeSubTab: subTab });
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
  resetUIState: () =>
    set({
      activeTab: "dashboard",
      activeSubTab: null,
      isSearchOpen: false,
      isAddTransactionOpen: false,
      isAddAccountOpen: false,
      isImportModalOpen: false,
      selectedAccountId: null,
      onboardingCurrentStep: 1,
    }),
}));
