import { ENV } from "@/config/env";
import type { ApiError } from "@/types";

const DEVICE_ID_KEY = "nexus_device_id";

let authToken: string | null = localStorage.getItem("nexus_token");

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

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorBody: ApiError;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = { message: response.statusText, status: response.status };
    }
    if (response.status === 401) {
      setAuthToken(null);
      localStorage.removeItem("nexus_user");
      window.location.href = "/login";
    }
    throw new ApiHttpError(errorBody, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${ENV.apiUrl}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  });
  return handleResponse<T>(res);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${ENV.apiUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${ENV.apiUrl}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}
