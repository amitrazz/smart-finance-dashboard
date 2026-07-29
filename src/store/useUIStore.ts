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
  showToast: (text: string, type?: "success" | "error" | "info") => void;
  hideToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: "dashboard",
  setActiveTab: (activeTab) => set({ activeTab }),
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
    set({ toastMessage: { id, text, type } });
    setTimeout(() => {
      set((state) => (state.toastMessage?.id === id ? { toastMessage: null } : state));
    }, 4000);
  },
  hideToast: () => set({ toastMessage: null }),
}));
