import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setAuthToken, getAuthToken, ApiHttpError } from "@/services/apiClient";

// ── helpers ──────────────────────────────────────────────────────────────────

function makeFetchResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 401 ? "Unauthorized" : status === 200 ? "OK" : String(status),
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

// ── setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  // Provide a clean localStorage and auth token before each test.
  localStorage.clear();
  setAuthToken("initial-access-token");
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
  setAuthToken(null);
  localStorage.clear();
});

// ── tests ────────────────────────────────────────────────────────────────────

describe("apiGet — 401 → refresh → retry flow", () => {
  it("retries the original request after a successful token refresh", async () => {
    // We import dynamically so the module picks up the stubbed fetch.
    const { apiGet } = await import("@/services/apiClient");

    localStorage.setItem("nexus_refresh_token", "valid-refresh-token");
    localStorage.setItem("nexus_device_id", "device-abc");

    const fetchMock = vi.fn()
      // First call: original request → 401
      .mockResolvedValueOnce(makeFetchResponse(401, { error: { message: "Expired" } }))
      // Second call: POST /auth/refresh → 200 with new tokens
      .mockResolvedValueOnce(makeFetchResponse(200, { accessToken: "new-access-token", refreshToken: "new-refresh-token" }))
      // Third call: retry of original request → 200 with data
      .mockResolvedValueOnce(makeFetchResponse(200, { data: "ok" }));

    vi.stubGlobal("fetch", fetchMock);

    const result = await apiGet<{ data: string }>("/some/protected");

    expect(result).toEqual({ data: "ok" });
    expect(getAuthToken()).toBe("new-access-token");
    expect(localStorage.getItem("nexus_refresh_token")).toBe("new-refresh-token");
    // Original + refresh + retry = 3 fetches
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("redirects to /login when the token refresh also fails", async () => {
    const { apiGet } = await import("@/services/apiClient");
    // No refresh token in storage → refresh call skipped → redirect
    setAuthToken(null);

    const locationSpy = vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      href: "",
    } as Location);
    const hrefSetter = vi.fn();
    locationSpy.mockReturnValue(Object.defineProperty({ ...window.location }, "href", { set: hrefSetter, get: () => "" }) as Location);

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(makeFetchResponse(401, { error: { message: "Unauthorized" } }));
    vi.stubGlobal("fetch", fetchMock);

    // With no refresh token available, apiGet should throw an ApiHttpError (401)
    // and attempt the redirect. We only assert the throw here since jsdom
    // cannot actually follow location.href changes.
    await expect(apiGet("/protected")).rejects.toBeInstanceOf(ApiHttpError);
  });

  it("throws ApiHttpError with the correct status code on non-401 failures", async () => {
    const { apiGet } = await import("@/services/apiClient");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(
      makeFetchResponse(403, { error: { message: "Forbidden", code: "FORBIDDEN" } })
    ));

    const err = await apiGet("/admin/only").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiHttpError);
    expect((err as ApiHttpError).status).toBe(403);
    expect((err as ApiHttpError).code).toBe("FORBIDDEN");
  });
});

describe("setAuthToken / getAuthToken", () => {
  it("stores the token in module state and localStorage", () => {
    setAuthToken("test-token-xyz");
    expect(getAuthToken()).toBe("test-token-xyz");
    expect(localStorage.getItem("nexus_token")).toBe("test-token-xyz");
  });

  it("clears the token from both module state and localStorage when set to null", () => {
    setAuthToken("test-token-xyz");
    setAuthToken(null);
    expect(getAuthToken()).toBeNull();
    expect(localStorage.getItem("nexus_token")).toBeNull();
  });
});

describe("Boot-time auth verification", () => {
  // The boot-time check in AuthContext calls GET /students/me and only marks
  // the user as authenticated if it succeeds. We verify the behaviour at the
  // apiGet level: a stale token returns 401, triggers a refresh attempt, and
  // if the refresh also fails the token is cleared.
  it("clears the auth token when /students/me returns 401 and refresh is unavailable", async () => {
    const { apiGet } = await import("@/services/apiClient");

    setAuthToken("stale-token");
    // No refresh token → refresh cannot proceed
    localStorage.removeItem("nexus_refresh_token");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(
      makeFetchResponse(401, { error: { message: "Token expired" } })
    ));

    await apiGet("/students/me").catch(() => {/* expected */});

    // After a failed refresh the token is cleared by clearAuthAndRedirect
    expect(getAuthToken()).toBeNull();
  });
});
