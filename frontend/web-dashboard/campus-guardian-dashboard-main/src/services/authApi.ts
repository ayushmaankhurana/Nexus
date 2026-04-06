import { apiPost } from "./apiClient";
import { setAuthToken, getOrCreateDeviceId, getDeviceId } from "./apiClient";
import { normalizeUserRole, type AuthResponse } from "@/types";
import { mockStudentUser, mockAdminUser, mockSession } from "@/mocks/data";

const USE_MOCK = false; // Toggle when backend is ready

/**
 * Normalize backend AuthResponse to frontend AuthResponse shape.
 * Backend returns: { accessToken, refreshToken, expiresIn, tokenType, user: { id, rollNumber, email, role } }
 * Frontend expects: user with name, status, and other required fields.
 */
function normalizeAuthResponse(backendResponse: AuthResponse): AuthResponse {
  const user = backendResponse.user;
  
  // Normalize user shape: backend may not return name, so construct it safely
  const normalizedUser = {
    ...user,
    // Backend returns id as studentId, frontend expects id
    id: user.id || user.studentId || `user-${Date.now()}`,
    // Backend doesn't return name; construct from rollNumber, email, or use default
    name: user.name || user.rollNumber || user.studentId || user.email || "User",
    // Backend may not return status; default to 'active'
    status: user.status || "active",
    role: normalizeUserRole(user.role),
    // Ensure studentId is set
    studentId: user.studentId || user.id,
    // Provide defaults for optional fields
    department: user.department || undefined,
    avatarUrl: user.avatarUrl || undefined,
    phone: user.phone || undefined,
    createdAt: user.createdAt || new Date().toISOString(),
    lastLogin: user.lastLogin || new Date().toISOString(),
  };

  return {
    token: backendResponse.accessToken || backendResponse.token,
    accessToken: backendResponse.accessToken,
    refreshToken: backendResponse.refreshToken,
    expiresIn: backendResponse.expiresIn,
    tokenType: backendResponse.tokenType,
    user: normalizedUser,
    session: backendResponse.session, // Backend doesn't return this, will be undefined
  };
}

export const authApi = {
  async resetDemoData(): Promise<{ success: boolean; message: string; resetAt: string }> {
    const response = await apiPost<{ success: boolean; message: string; resetAt: string }>("/dev/demo/reset");
    setAuthToken(null);
    localStorage.removeItem("nexus_user");
    localStorage.removeItem("nexus_device_id");
    return response;
  },

  async login(identifier: string, password: string): Promise<AuthResponse> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 800));
      if (password !== "password") throw { message: "Invalid credentials", status: 401 };
      const isAdmin = identifier.includes("admin") || identifier.includes("osei");
      const user = isAdmin ? mockAdminUser : mockStudentUser;
      const token = `mock-token-${user.role}-${Date.now()}`;
      setAuthToken(token);
      localStorage.setItem("nexus_user", JSON.stringify(user));
      return { token, user, session: { ...mockSession, userId: user.id } };
    }

    // REAL BACKEND: Backend requires { identifier, password, deviceId }
    const deviceId = getOrCreateDeviceId();
    const res = await apiPost<AuthResponse>("/auth/login", {
      identifier,
      password,
      deviceId, // Required by backend
    });

    // Normalize response and persist
    const normalized = normalizeAuthResponse(res);
    setAuthToken(normalized.token!);
    localStorage.setItem("nexus_user", JSON.stringify(normalized.user));
    return normalized;
  },

  async activateAccount(activationToken: string, password: string): Promise<AuthResponse> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 800));
      const res: AuthResponse = { token: `mock-token-${Date.now()}`, user: mockStudentUser, session: mockSession };
      setAuthToken(res.token!);
      localStorage.setItem("nexus_user", JSON.stringify(res.user));
      return res;
    }

    // REAL BACKEND: Backend expects { activationToken, password } (not { token, password })
    const res = await apiPost<AuthResponse>("/auth/activate", {
      activationToken, // Field name matches backend schema
      password,
    });

    const normalized = normalizeAuthResponse(res);
    setAuthToken(normalized.token!);
    localStorage.setItem("nexus_user", JSON.stringify(normalized.user));
    return normalized;
  },

  async logout(): Promise<void> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      setAuthToken(null);
      localStorage.removeItem("nexus_user");
      return;
    }

    // REAL BACKEND: Backend requires { studentId, deviceId } in request body
    const user = localStorage.getItem("nexus_user");
    const deviceId = getDeviceId();

    if (user && deviceId) {
      try {
        const parsedUser = JSON.parse(user);
        await apiPost("/auth/logout", {
          studentId: parsedUser.id,
          deviceId,
        });
      } catch (err) {
        console.error("Logout request failed:", err);
      }
    }

    setAuthToken(null);
    localStorage.removeItem("nexus_user");
  },

  async switchDevice(newDeviceId: string): Promise<{ success: boolean }> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 600));
      return { success: true };
    }

    // REAL BACKEND: Route is /auth/device/switch (not /auth/switch-device)
    // Backend expects { studentId, oldDeviceId, newDeviceId }
    const user = localStorage.getItem("nexus_user");
    const oldDeviceId = getDeviceId();

    if (!user || !oldDeviceId) {
      throw new Error("Cannot switch device: missing user or device ID");
    }

    const parsedUser = JSON.parse(user);
    const res = await apiPost<AuthResponse>("/auth/device/switch", {
      studentId: parsedUser.id,
      oldDeviceId,
      newDeviceId,
    });

    // Save new device ID
    localStorage.setItem("nexus_device_id", newDeviceId);
    const normalized = normalizeAuthResponse(res);
    setAuthToken(normalized.token!);
    return { success: true };
  },
};
