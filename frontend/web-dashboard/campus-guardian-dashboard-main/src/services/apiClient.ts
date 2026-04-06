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
  const hasBody = body !== undefined;
  const res = await fetch(`${ENV.apiUrl}${path}`, {
    method: "POST",
    headers: {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
    },
    body: hasBody ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const hasBody = body !== undefined;
  const res = await fetch(`${ENV.apiUrl}${path}`, {
    method: "PATCH",
    headers: {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
    },
    body: hasBody ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}
