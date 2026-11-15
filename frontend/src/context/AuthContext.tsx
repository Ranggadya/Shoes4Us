import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from "react";
import {
  api,
  clearApiCache,
  getToken,
  setToken,
  removeToken,
  setUnauthorizedHandler,
} from "@/services/api";
import { UserRole } from "@/types";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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

type AuthResponse = {
  success: boolean;
  data: { user: User; token: string };
};

function safeGetToken(): string | null {
  try {
    return getToken();
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(() =>
    safeGetToken()
  );
  const [isLoading, setIsLoading] = useState<boolean>(() =>
    Boolean(safeGetToken())
  );
  const [error, setError] = useState<string | null>(null);

  const clearAuthStorage = useCallback(() => {
    setUser(null);
    setAuthToken(null);
    try {
      localStorage.removeItem("user");
    } catch {
      // ignore storage errors
    }
    removeToken();
    if (typeof clearApiCache === "function") {
      clearApiCache();
    }
  }, []);

  const fetchProfile = useCallback(
    async (options: { showLoading?: boolean } = {}) => {
      const showLoading = options.showLoading ?? false;
      const currentToken = safeGetToken();
      if (!currentToken) {
        clearAuthStorage();
        if (showLoading) {
          setIsLoading(false);
        }
        return;
      }
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const result = await api.get<{
          success: boolean;
          data: { user: User };
        }>("/auth/me", { cache: "no-store" });
        if (result.data?.user) {
          setUser(result.data.user);
          setAuthToken(currentToken);
          try {
            localStorage.setItem("user", JSON.stringify(result.data.user));
          } catch {
            // ignore storage errors
          }
        }
      } catch (err) {
        const status = (err as { status?: unknown })?.status;
        if (status === 401 || status === 403 || status === 404) {
          clearAuthStorage();
        }
        setError(err instanceof Error ? err.message : "Gagal memuat profil");
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    },
    [clearAuthStorage]
  );

  const refreshProfile = useCallback(async () => {
    await fetchProfile({ showLoading: false });
  }, [fetchProfile]);

  useEffect(() => {
    if (typeof setUnauthorizedHandler !== "function") return;
    setUnauthorizedHandler(() => {
      clearAuthStorage();
    });
    return () => {
      setUnauthorizedHandler(null);
    };
  }, [clearAuthStorage]);

  useEffect(() => {
    const savedToken = safeGetToken();
    if (!savedToken) {
      try {
        localStorage.removeItem("user");
      } catch {
        // ignore storage errors
      }
      setUser(null);
      setAuthToken(null);
      setIsLoading(false);
      return;
    }

    let savedUser: string | null = null;
    try {
      savedUser = localStorage.getItem("user");
    } catch {
      savedUser = null;
    }

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser) as User);
      } catch {
        try {
          localStorage.removeItem("user");
        } catch {
          // ignore storage errors
        }
      }
    }

    setAuthToken(savedToken);
    void fetchProfile({ showLoading: true });
  }, [fetchProfile]);

  const loginRequest = useCallback(
    async (payload: { email: string; password: string }) => {
      setError(null);
      try {
        const result = await api.post<AuthResponse>("/auth/login", payload);

        const { user: loggedInUser, token: receivedToken } = result.data;
        setUser(loggedInUser);
        setAuthToken(receivedToken);

        localStorage.setItem("user", JSON.stringify(loggedInUser));
        setToken(receivedToken);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal login");
        throw err;
      }
    },
    []
  );

  const registerRequest = useCallback(
    async (payload: { name: string; email: string; password: string }) => {
      setError(null);
      try {
        const result = await api.post<AuthResponse>("/auth/register", payload);

        const { user: registeredUser, token: receivedToken } = result.data;
        setUser(registeredUser);
        setAuthToken(receivedToken);

        localStorage.setItem("user", JSON.stringify(registeredUser));
        setToken(receivedToken);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal registrasi");
        throw err;
      }
    },
    []
  );

  const logoutRequest = useCallback(async () => {
    setError(null);
    try {
      await api.post("/auth/logout");
    } catch {
      // Still clear client storage even if backend cookie revoke call fails
    } finally {
      clearAuthStorage();
    }
  }, [clearAuthStorage]);

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
      refresh: refreshProfile,
    }),
    [
      user,
      authToken,
      isLoading,
      error,
      loginRequest,
      registerRequest,
      logoutRequest,
      refreshProfile,
    ]
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
