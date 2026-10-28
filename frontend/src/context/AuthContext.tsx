import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { api, ApiError, getToken, setToken, removeToken } from "@/services/api";
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearAuthStorage = useCallback(() => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem("user");
    removeToken();
  }, []);

  const loadProfile = useCallback(async () => {
    const currentToken = getToken();
    if (!currentToken) {
      clearAuthStorage();
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.get<{ success: boolean; data: { user: User } }>(
        "/auth/me"
      );
      if (result.data?.user) {
        setUser(result.data.user);
        setAuthToken(currentToken);
        localStorage.setItem("user", JSON.stringify(result.data.user));
      }
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        clearAuthStorage();
      }
      setError(err instanceof Error ? err.message : "Gagal memuat profil");
    } finally {
      setIsLoading(false);
    }
  }, [clearAuthStorage]);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = getToken();

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser) as User);
        setAuthToken(savedToken);
        void loadProfile();
        return;
      } catch (e) {
        console.error("Failed to parse saved user", e);
        clearAuthStorage();
      }
    }
    setIsLoading(false);
  }, [clearAuthStorage, loadProfile]);

  const loginRequest = useCallback(
    async (payload: { email: string; password: string }) => {
      setError(null);
      setIsLoading(true);
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
        const result = await api.post<AuthResponse>("/auth/register", payload);

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
    clearAuthStorage();
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
      refresh: loadProfile,
    }),
    [
      user,
      authToken,
      isLoading,
      error,
      loginRequest,
      registerRequest,
      logoutRequest,
      loadProfile,
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
