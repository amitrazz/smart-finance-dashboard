const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");
const API_BASE_URL = rawBaseUrl.endsWith("/api/v1") ? rawBaseUrl : `${rawBaseUrl}/api/v1`;

const safeGetStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetStorage = (key: string, val: string): void => {
  try {
    localStorage.setItem(key, val);
  } catch {
    // Ignore storage quota or access errors
  }
};

const safeRemoveStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage access errors
  }
};

let accessToken: string | null = safeGetStorage("pf_access_token");
let onUnauthorizedCallback: (() => void) | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    safeSetStorage("pf_access_token", token);
  } else {
    safeRemoveStorage("pf_access_token");
  }
};

export const getAccessToken = () => accessToken;

export const setOnUnauthorizedCallback = (cb: () => void) => {
  onUnauthorizedCallback = cb;
};

// Endpoints that must never trigger a refresh-and-retry cycle on 401 —
// refresh/register 401s are real auth failures, and retrying login/refresh
// itself would recurse forever.
const NO_REFRESH_RETRY_PATHS = new Set(["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"]);

// Serializes refresh calls across browser tabs of the same origin (when the
// Web Locks API is available). The backend rotates the refresh-token cookie
// on every use and revokes ALL sessions if it sees the same token replayed,
// so two tabs refreshing concurrently must not race — the lock makes the
// second tab's call wait and pick up the cookie the first tab just rotated.
async function withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  const locks =
    typeof navigator !== "undefined"
      ? (navigator as Navigator & { locks?: { request: (name: string, cb: () => Promise<T>) => Promise<T> } }).locks
      : undefined;
  if (locks) {
    return locks.request("pf-token-refresh", fn);
  }
  return fn();
}

let refreshPromise: Promise<string | null> | null = null;

// Exchanges the httpOnly refresh-token cookie for a new access token. Dedupes
// concurrent callers within the same tab (they all await the same in-flight
// request) and serializes across tabs via withRefreshLock.
export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = withRefreshLock(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { accessToken?: string };
      if (!data.accessToken) return null;
      setAccessToken(data.accessToken);
      return data.accessToken;
    } catch {
      return null;
    }
  }).finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export type ErrorCategory =
  | "NETWORK"
  | "AUTH"
  | "VALIDATION"
  | "RATE_LIMIT"
  | "SERVER"
  | "OFFLINE"
  | "CLIENT";

export class ApiError extends Error {
  statusCode: number;
  category: ErrorCategory;
  userMessage: string;
  error?: string;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    category: ErrorCategory = "CLIENT",
    userMessage?: string,
    error?: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.category = category;
    this.error = error;
    this.details = details;
    this.userMessage = userMessage || message;
  }
}

export async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit & { timeoutMs?: number; _isRetry?: boolean } = {}
): Promise<T> {
  if (typeof window !== "undefined" && !navigator.onLine) {
    throw new ApiError(
      "Device is offline",
      0,
      "OFFLINE",
      "You are currently offline. Please check your internet connection."
    );
  }

  const { timeoutMs = 15000, _isRetry = false, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers || {});

  if (!(fetchOptions.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  headers.set("Pragma", "no-cache");
  headers.set("Expires", "0");

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const path = endpoint.startsWith("/api/v1")
    ? endpoint.replace("/api/v1", "")
    : endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;

  const url = `${API_BASE_URL}${path}`;

  // Set up configurable AbortController timeout (default 15s)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Compose timeout signal with any caller-supplied signal (e.g. from React Query)
  // so both can independently abort the request without one overwriting the other.
  const callerSignal = fetchOptions.signal;
  const composedSignal = callerSignal
    ? AbortSignal.any([controller.signal, callerSignal])
    : controller.signal;

  try {
    const res = await fetch(url, {
      cache: "no-store",
      credentials: "include",
      ...fetchOptions,
      signal: composedSignal,
      headers,
    });
    clearTimeout(timeoutId);

    if (res.status === 401) {
      if (!_isRetry && !NO_REFRESH_RETRY_PATHS.has(path)) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          return fetchWithAuth<T>(endpoint, { ...options, _isRetry: true });
        }
      }

      setAccessToken(null);
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }

    if (!res.ok) {
      let errorData: Record<string, unknown> = {};
      try {
        errorData = (await res.json()) as Record<string, unknown>;
      } catch {
        // Response was not JSON
      }

      const rawMsg =
        (errorData.message as string) ||
        (errorData.error as string) ||
        `HTTP Error ${res.status}: ${res.statusText}`;

      let category: ErrorCategory = "CLIENT";
      let userMsg = rawMsg;

      if (res.status === 401) {
        category = "AUTH";
        userMsg = "Your session has expired. Please sign in again.";
      } else if (res.status === 403) {
        category = "AUTH";
        userMsg = "You do not have permission to perform this action.";
      } else if (res.status === 404) {
        category = "CLIENT";
        userMsg = "The requested record was not found.";
      } else if (res.status === 409 || res.status === 422) {
        category = "VALIDATION";
        userMsg = rawMsg || "Validation error encountered.";
      } else if (res.status === 429) {
        category = "RATE_LIMIT";
        userMsg = "Too many requests. Please wait a moment before trying again.";
      } else if (res.status >= 500) {
        category = "SERVER";
        userMsg = "Server error encountered. Please try again shortly.";
      }

      throw new ApiError(
        rawMsg,
        res.status,
        category,
        userMsg,
        errorData.error as string | undefined,
        errorData.details as Record<string, unknown> | undefined
      );
    }

    if (res.status === 204) {
      return {} as T;
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) {
      throw err;
    }

    if (err instanceof Error && err.name === "AbortError") {
      // If our timeout fired, surface a meaningful error to the user.
      // If the caller's signal fired (e.g. React Query cancelling on unmount),
      // re-throw as-is so TanStack Query can suppress it silently.
      if (controller.signal.aborted) {
        throw new ApiError(
          "Request timed out",
          0,
          "NETWORK",
          "The request took too long to complete. Please try again."
        );
      }
      // Caller-initiated cancel — let it propagate as a plain AbortError.
      throw err;
    }

    throw new ApiError(
      (err as Error)?.message || "Network request failed",
      0,
      "NETWORK",
      "Network error encountered. Please check your connection."
    );
  }
}
