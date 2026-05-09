import { ENV } from "@/config/env";
import type { ApiError } from "@/types";

const DEVICE_ID_KEY = "nexus_device_id";

let authToken: string | null = localStorage.getItem("nexus_token");
let isRefreshing = false;

export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function getDeviceId(): string | null {
  return localStorage.getItem(DEVICE_ID_KEY);
}

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem("nexus_token", token);
  } else {
    localStorage.removeItem("nexus_token");
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

export class ApiHttpError extends Error {
  status: number;
  code?: string;
  details?: Record<string, string>;

  constructor(error: ApiError, status: number) {
    super(error.message);
    this.name = "ApiHttpError";
    this.status = status;
    this.code = error.code;
    this.details = error.details;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseApiError(body: unknown, status: number, statusText: string): ApiError {
  if (isRecord(body) && isRecord(body.error)) {
    return {
      message:
        typeof body.error.message === "string" && body.error.message.length > 0
          ? body.error.message
          : statusText,
      code: typeof body.error.code === "string" ? body.error.code : undefined,
      details: isRecord(body.error.details) ? (body.error.details as Record<string, string>) : undefined,
      status,
    };
  }

  if (isRecord(body)) {
    return {
      message:
        typeof body.message === "string" && body.message.length > 0
          ? body.message
          : statusText,
      code: typeof body.code === "string" ? body.code : undefined,
      details: isRecord(body.details) ? (body.details as Record<string, string>) : undefined,
      status,
    };
  }

  return { message: statusText, status };
}

async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing) return false;
  const refreshToken = localStorage.getItem("nexus_refresh_token");
  const deviceId = getDeviceId();
  if (!refreshToken || !deviceId) return false;

  isRefreshing = true;
  try {
    const res = await fetch(`${ENV.apiUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken, deviceId }),
    });
    if (!res.ok) return false;
    const data = await res.json() as { accessToken?: string; refreshToken?: string };
    if (data.accessToken) {
      setAuthToken(data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem("nexus_refresh_token", data.refreshToken);
      }
      return true;
    }
    return false;
  } catch {
    return false;
  } finally {
    isRefreshing = false;
  }
}

function clearAuthAndRedirect() {
  setAuthToken(null);
  localStorage.removeItem("nexus_user");
  localStorage.removeItem("nexus_refresh_token");
  window.location.href = "/login";
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorBody: ApiError;
    try {
      const rawBody = await response.json();
      errorBody = parseApiError(rawBody, response.status, response.statusText);
    } catch {
      errorBody = { message: response.statusText, status: response.status };
    }
    if (response.status === 401) {
      // Only attempt refresh if this is not already a refresh call
      const refreshed = await tryRefreshToken();
      if (!refreshed) {
        clearAuthAndRedirect();
      }
      // If refreshed, caller should retry — throw so caller can catch and retry
    }
    throw new ApiHttpError(errorBody, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${ENV.apiUrl}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const makeRequest = () =>
    fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    });
  try {
    return await handleResponse<T>(await makeRequest());
  } catch (err) {
    if (err instanceof ApiHttpError && err.status === 401 && authToken) {
      // Token was refreshed in handleResponse; retry once with new token
      return await handleResponse<T>(await makeRequest());
    }
    throw err;
  }
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const hasBody = body !== undefined;
  const makeRequest = () =>
    fetch(`${ENV.apiUrl}${path}`, {
      method: "POST",
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
      },
      body: hasBody ? JSON.stringify(body) : undefined,
    });
  try {
    return await handleResponse<T>(await makeRequest());
  } catch (err) {
    if (err instanceof ApiHttpError && err.status === 401 && authToken) {
      return await handleResponse<T>(await makeRequest());
    }
    throw err;
  }
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const hasBody = body !== undefined;
  const makeRequest = () =>
    fetch(`${ENV.apiUrl}${path}`, {
      method: "PATCH",
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
      },
      body: hasBody ? JSON.stringify(body) : undefined,
    });
  try {
    return await handleResponse<T>(await makeRequest());
  } catch (err) {
    if (err instanceof ApiHttpError && err.status === 401 && authToken) {
      return await handleResponse<T>(await makeRequest());
    }
    throw err;
  }
}
