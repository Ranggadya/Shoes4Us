"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  error: string | null;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchJson<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      body?.error?.message ?? body?.message ?? "Terjadi kesalahan pada server";
    throw new Error(message);
  }

  return body;
}

type AuthResponse = {
  success: boolean;
  data: { user: User; token: string };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Ambil user & token dari localStorage saat load awal
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    setIsLoading(false);
  }, []);

  // 🔹 Load profil dari backend (opsional)
  const loadProfile = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchJson<{ success: boolean; data: { user: User } }>(
        "/api/auth/me",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(result.data.user);
    } catch (err) {
      console.error(err);
      setUser(null);
      setError(err instanceof Error ? err.message : "Gagal memuat profil");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // 🔹 LOGIN
  const loginRequest = useCallback(
    async (payload: { email: string; password: string }) => {
      setError(null);
      setIsLoading(true);
      try {
        const result = await fetchJson<AuthResponse>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        const { user, token } = result.data;
        setUser(user);
        setToken(token);

        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal login");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 🔹 REGISTER
  const registerRequest = useCallback(
    async (payload: { name: string; email: string; password: string }) => {
      setError(null);
      setIsLoading(true);
      try {
        const result = await fetchJson<AuthResponse>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        const { user, token } = result.data;
        setUser(user);
        setToken(token);

        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal registrasi");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 🔹 LOGOUT
  const logoutRequest = useCallback(async () => {
    setError(null);
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAdmin: user?.role === "ADMIN",
      error,
      login: loginRequest,
      register: registerRequest,
      logout: logoutRequest,
      refresh: loadProfile,
    }),
    [user, token, isLoading, error, loginRequest, registerRequest, logoutRequest, loadProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
