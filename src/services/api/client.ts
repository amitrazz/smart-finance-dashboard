const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const API_BASE_URL = rawBaseUrl.endsWith("/api/v1") ? rawBaseUrl : `${rawBaseUrl}/api/v1`;

let accessToken: string | null = localStorage.getItem("pf_access_token");

let onUnauthorizedCallback: (() => void) | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem("pf_access_token", token);
  } else {
    localStorage.removeItem("pf_access_token");
  }
};

export const getAccessToken = () => accessToken;

export const setOnUnauthorizedCallback = (cb: () => void) => {
  onUnauthorizedCallback = cb;
};

export class ApiError extends Error {
  statusCode: number;
  error?: string;
  details?: Record<string, unknown>;

  constructor(message: string, statusCode: number, error?: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.error = error;
    this.details = details;
  }
}

export async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const path = endpoint.startsWith("/api/v1")
    ? endpoint.replace("/api/v1", "")
    : endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  const url = `${API_BASE_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 401) {
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
      // response wasn't json
    }
    const message = (errorData.message as string) || (errorData.error as string) || `HTTP Error ${res.status}: ${res.statusText}`;
    throw new ApiError(message, res.status, errorData.error as string | undefined, errorData.details as Record<string, unknown> | undefined);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return {} as T;
  }

  return (await res.json()) as T;
}
