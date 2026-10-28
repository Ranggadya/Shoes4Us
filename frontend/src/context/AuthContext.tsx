import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { getToken, setToken, removeToken } from "@/services/api";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN" | "USER";
  imageUrl?: string | null;
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
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = getToken();

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setAuthToken(savedToken);
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }
    setIsLoading(false);
  }, []);

  const loadProfile = useCallback(async () => {
    const currentToken = getToken();
    if (!currentToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchJson<{ success: boolean; data: { user: User } }>(
        "/api/auth/me",
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      setUser(result.data.user);
      localStorage.setItem("user", JSON.stringify(result.data.user));
    } catch (err) {
      console.error(err);
      setUser(null);
      setError(err instanceof Error ? err.message : "Gagal memuat profil");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginRequest = useCallback(
    async (payload: { email: string; password: string }) => {
      setError(null);
      setIsLoading(true);
      try {
        const result = await fetchJson<AuthResponse>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        const { user: loggedInUser, token: receivedToken } = result.data;
        setUser(loggedInUser);
        setAuthToken(receivedToken);

        localStorage.setItem("user", JSON.stringify(loggedInUser));
        setToken(receivedToken);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal login");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const registerRequest = useCallback(
    async (payload: { name: string; email: string; password: string }) => {
      setError(null);
      setIsLoading(true);
      try {
        const result = await fetchJson<AuthResponse>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        const { user: registeredUser, token: receivedToken } = result.data;
        setUser(registeredUser);
        setAuthToken(receivedToken);

        localStorage.setItem("user", JSON.stringify(registeredUser));
        setToken(receivedToken);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal registrasi");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logoutRequest = useCallback(async () => {
    setError(null);
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem("user");
    removeToken();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token: authToken,
      isLoading,
      isAdmin: user?.role === "ADMIN",
      error,
      login: loginRequest,
      register: registerRequest,
      logout: logoutRequest,
      refresh: loadProfile,
    }),
    [user, authToken, isLoading, error, loginRequest, registerRequest, logoutRequest, loadProfile]
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
