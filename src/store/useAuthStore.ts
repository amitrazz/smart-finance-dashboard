import { create } from "zustand";
import { api, setAccessToken, getAccessToken, setOnUnauthorizedCallback } from "../services/api";
import { parseJwt, isTokenValid } from "../utils/jwt";
import { clearAppDataOnAuthChange } from "../lib/queryClient";
import { useUIStore } from "./useUIStore";

export interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => void;
}

const resetAllState = () => {
  clearAppDataOnAuthChange();
  useUIStore.getState().resetUIState();
};

const getUserFromToken = (token: string | null): User | null => {
  if (!token || !isTokenValid(token)) return null;
  const payload = parseJwt(token);
  if (!payload || !payload.email) return null;
  
  const email = payload.email;
  const name = payload.name || email.split("@")[0];
  const id = payload.sub || "user";
  return { id, email, name };
};

const initialToken = getAccessToken();
const initialUser = getUserFromToken(initialToken);

if (initialToken && !initialUser) {
  // Token was invalid or expired
  setAccessToken(null);
  resetAllState();
}

export const useAuthStore = create<AuthState>((set) => {
  // Register unauthorized listener to log out automatically on 401
  setOnUnauthorizedCallback(() => {
    resetAllState();
    set({ user: null, isAuthenticated: false });
  });

  return {
    user: initialUser,
    isAuthenticated: !!initialUser,
    isLoading: false,

    checkAuth: () => {
      const token = getAccessToken();
      const user = getUserFromToken(token);
      if (!user) {
        setAccessToken(null);
        resetAllState();
        set({ user: null, isAuthenticated: false });
      } else {
        set({ user, isAuthenticated: true });
      }
    },

    login: async (email, password) => {
      set({ isLoading: true });
      try {
        const res = await api.login({ email, password });
        if (!res.accessToken) {
          throw new Error("No access token returned from API");
        }
        resetAllState();
        setAccessToken(res.accessToken);
        const user = getUserFromToken(res.accessToken) || {
          id: "user",
          email,
          name: email.split("@")[0],
        };

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (err) {
        set({ isLoading: false });
        throw err;
      }
    },

    register: async (email, password, name) => {
      set({ isLoading: true });
      try {
        await api.register({ email, password, name });
        // After successful registration, log in using API credentials
        const res = await api.login({ email, password });
        if (!res.accessToken) {
          throw new Error("No access token returned after registration");
        }
        resetAllState();
        setAccessToken(res.accessToken);
        const user = getUserFromToken(res.accessToken) || {
          id: "user",
          email,
          name: name || email.split("@")[0],
        };

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (err) {
        set({ isLoading: false });
        throw err;
      }
    },

    logout: async () => {
      try {
        await api.logout();
      } catch {
        // ignore network error on logout call
      } finally {
        resetAllState();
        setAccessToken(null);
        set({ user: null, isAuthenticated: false });
      }
    },
  };
});
