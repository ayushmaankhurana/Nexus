import { apiPost } from "./apiClient";
import { setAuthToken, getOrCreateDeviceId, getDeviceId } from "./apiClient";
import type { AuthResponse } from "@/types";

function normalizeAuthResponse(backendResponse: AuthResponse): AuthResponse {
  const user = backendResponse.user;

  const normalizedUser = {
    ...user,
    id: user.id || user.studentId || `user-${Date.now()}`,
    name: user.name || user.studentId || user.email || "User",
    status: user.status || "active",
    studentId: user.studentId || user.id,
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
    session: backendResponse.session,
  };
}

export const authApi = {
  async login(identifier: string, password: string): Promise<AuthResponse> {
    const deviceId = getOrCreateDeviceId();

    const res = await apiPost<AuthResponse>("/auth/login", {
      identifier,
      password,
      deviceId,
    });

    const normalized = normalizeAuthResponse(res);

    setAuthToken(normalized.token!);
    localStorage.setItem("nexus_user", JSON.stringify(normalized.user));

    if (normalized.refreshToken) {
      localStorage.setItem("nexus_refresh_token", normalized.refreshToken);
    }

    return normalized;
  },

  async activateAccount(activationToken: string, password: string): Promise<AuthResponse> {
    const res = await apiPost<AuthResponse>("/auth/activate", {
      activationToken,
      password,
    });

    const normalized = normalizeAuthResponse(res);

    setAuthToken(normalized.token!);
    localStorage.setItem("nexus_user", JSON.stringify(normalized.user));

    if (normalized.refreshToken) {
      localStorage.setItem("nexus_refresh_token", normalized.refreshToken);
    }

    return normalized;
  },

  async forgotPassword(identifier: string): Promise<{ message: string; resetToken?: string }> {
    return apiPost("/auth/password/forgot", { identifier });
  },

  async resetPassword(resetToken: string, newPassword: string): Promise<{ message: string }> {
    return apiPost("/auth/password/reset", {
      resetToken,
      newPassword,
    });
  },

  async logout(): Promise<void> {
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
    localStorage.removeItem("nexus_refresh_token");
  },

  async switchDevice(newDeviceId: string): Promise<{ success: boolean }> {
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

    localStorage.setItem("nexus_device_id", newDeviceId);

    const normalized = normalizeAuthResponse(res);
    setAuthToken(normalized.token!);

    return { success: true };
  },
};