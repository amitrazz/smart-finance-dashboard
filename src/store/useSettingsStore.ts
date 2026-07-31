import { create } from "zustand";
import { UserSettings } from "../types";

interface SettingsState {
  settings: UserSettings;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: {
    baseCurrency: "INR",
    locale: "en-IN",
    emergencyFundMonthsTarget: 6,
    theme: "dark",
    notificationPreferences: {
      emailBills: true,
      pushInsights: true,
      smsSecurityAlerts: true,
    },
  },
  theme: "dark",

  // Pure state updates only — DOM class sync is handled by AppShell.tsx useEffect
  setTheme: (theme) =>
    set((state) => ({ theme, settings: { ...state.settings, theme } })),

  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === "dark" ? "light" : "dark";
      return { theme: nextTheme, settings: { ...state.settings, theme: nextTheme } };
    }),

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),
}));

