import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { normalizeUserRole, type User, type Session } from "@/types";
import { authApi } from "@/services/authApi";
import { getAuthToken } from "@/services/apiClient";

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  activate: (token: string, password: string) => Promise<void>;
  switchDevice: (deviceId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null, session: null, isAuthenticated: false, isLoading: true,
  });

  useEffect(() => {
    const token = getAuthToken();
    const savedUser = localStorage.getItem("nexus_user");
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as User;
        const user = {
          ...parsedUser,
          role: normalizeUserRole(parsedUser.role),
        };
        localStorage.setItem("nexus_user", JSON.stringify(user));
        setState({ user, session: null, isAuthenticated: true, isLoading: false });
      } catch {
        setState(s => ({ ...s, isLoading: false }));
      }
    } else {
      setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await authApi.login(identifier, password);
    // session will be undefined from backend, but that's OK - we already fetch user
    setState({ user: res.user, session: res.session || null, isAuthenticated: true, isLoading: false });
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setState({ user: null, session: null, isAuthenticated: false, isLoading: false });
  }, []);

  const activate = useCallback(async (token: string, password: string) => {
    const res = await authApi.activateAccount(token, password);
    setState({ user: res.user, session: res.session || null, isAuthenticated: true, isLoading: false });
  }, []);

  const switchDevice = useCallback(async (deviceId: string) => {
    await authApi.switchDevice(deviceId);
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, activate, switchDevice }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
