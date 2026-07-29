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

  setTheme: (theme) => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    set((state) => ({ theme, settings: { ...state.settings, theme } }));
  },

  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === "dark" ? "light" : "dark";
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return { theme: nextTheme, settings: { ...state.settings, theme: nextTheme } };
    });
  },

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),
}));
