import { apiPost } from "./apiClient";
import { setAuthToken } from "./apiClient";
import type { AuthResponse } from "@/types";
import { mockStudentUser, mockAdminUser, mockSession } from "@/mocks/data";

const USE_MOCK = true; // Toggle when backend is ready

export const authApi = {
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
    const res = await apiPost<AuthResponse>("/auth/login", { identifier, password });
    setAuthToken(res.token);
    localStorage.setItem("nexus_user", JSON.stringify(res.user));
    return res;
  },

  async activateAccount(token: string, password: string): Promise<AuthResponse> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 800));
      const res: AuthResponse = { token: `mock-token-${Date.now()}`, user: mockStudentUser, session: mockSession };
      setAuthToken(res.token);
      localStorage.setItem("nexus_user", JSON.stringify(res.user));
      return res;
    }
    return apiPost<AuthResponse>("/auth/activate", { token, password });
  },

  async logout(): Promise<void> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      setAuthToken(null);
      localStorage.removeItem("nexus_user");
      return;
    }
    await apiPost("/auth/logout");
    setAuthToken(null);
    localStorage.removeItem("nexus_user");
  },

  async switchDevice(deviceId: string): Promise<{ success: boolean }> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 600));
      return { success: true };
    }
    return apiPost("/auth/switch-device", { deviceId });
  },
};
