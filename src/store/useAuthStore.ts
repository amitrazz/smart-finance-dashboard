import { create } from 'zustand';
import { clearAppDataOnAuthChange } from '../lib/queryClient';
import {
  api,
  getAccessToken,
  refreshAccessToken,
  setAccessToken,
  setOnUnauthorizedCallback,
} from '../services/api';
import { isTokenValid, parseJwt } from '../utils/jwt';
import { useUIStore } from './useUIStore';

export interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
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
  const name = payload.name || email.split('@')[0];
  const id = payload.sub || 'user';
  return { id, email, name };
};

// Refresh proactively, ahead of the access token's expiry, so an active
// session never has to wait for a 401 to notice the token is stale.
const REFRESH_BUFFER_MS = 60_000;

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

const clearScheduledRefresh = () => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
};

const scheduleTokenRefresh = (token: string) => {
  clearScheduledRefresh();
  const payload = parseJwt(token);
  if (!payload?.exp) return;

  const delay = Math.max(payload.exp * 1000 - Date.now() - REFRESH_BUFFER_MS, 0);
  refreshTimer = setTimeout(async () => {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const user = getUserFromToken(newToken);
      if (user) {
        scheduleTokenRefresh(newToken);
        useAuthStore.setState({ user, isAuthenticated: true });
        return;
      }
    }
    // Refresh failed (refresh token expired/revoked): fall back to the
    // regular unauthorized flow so the user is cleanly signed out.
    setAccessToken(null);
    resetAllState();
    useAuthStore.setState({ user: null, isAuthenticated: false });
  }, delay);
};

export const useAuthStore = create<AuthState>((set) => {
  // Register unauthorized listener to log out automatically on 401
  setOnUnauthorizedCallback(() => {
    clearScheduledRefresh();
    resetAllState();
    set({ user: null, isAuthenticated: false, isLoading: false });
  });

  return {
    user: null,
    isAuthenticated: false,
    // Starts true: resolved by the boot-time silent-refresh check below,
    // which decides the real signed-in/out state before anything renders.
    isLoading: true,

    checkAuth: () => {
      const token = getAccessToken();
      const user = getUserFromToken(token);
      if (!user) {
        clearScheduledRefresh();
        setAccessToken(null);
        resetAllState();
        set({ user: null, isAuthenticated: false });
      } else {
        scheduleTokenRefresh(token as string);
        set({ user, isAuthenticated: true });
      }
    },

    login: async (email, password) => {
      set({ isLoading: true });
      try {
        const res = await api.login({ email, password });
        if (!res.accessToken) {
          throw new Error('No access token returned from API');
        }
        resetAllState();
        setAccessToken(res.accessToken);
        scheduleTokenRefresh(res.accessToken);
        const user = getUserFromToken(res.accessToken) || {
          id: 'user',
          email,
          name: email.split('@')[0],
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
          throw new Error('No access token returned after registration');
        }
        resetAllState();
        setAccessToken(res.accessToken);
        scheduleTokenRefresh(res.accessToken);
        const user = getUserFromToken(res.accessToken) || {
          id: 'user',
          email,
          name: name || email.split('@')[0],
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
      clearScheduledRefresh();
      try {
        await api.logout();
      } catch {
        // ignore network error on logout call
      } finally {
        resetAllState();
        setAccessToken(null);
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    },
  };
});

// Boot-time session check. A stored access token may be missing or expired
// simply because the tab was closed/idle past its 1h lifetime — that no
// longer means the user is signed out, since the httpOnly refresh-token
// cookie (30d) can silently mint a new one. Only fall back to signed-out
// once that also fails.
(async () => {
  const storedToken = getAccessToken();
  const storedUser = getUserFromToken(storedToken);
  if (storedUser) {
    scheduleTokenRefresh(storedToken as string);
    useAuthStore.setState({ user: storedUser, isAuthenticated: true, isLoading: false });
    return;
  }

  setAccessToken(null);
  const refreshedToken = await refreshAccessToken();
  const refreshedUser = getUserFromToken(refreshedToken);
  if (refreshedUser) {
    scheduleTokenRefresh(refreshedToken as string);
    useAuthStore.setState({ user: refreshedUser, isAuthenticated: true, isLoading: false });
    return;
  }

  resetAllState();
  useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
})();
