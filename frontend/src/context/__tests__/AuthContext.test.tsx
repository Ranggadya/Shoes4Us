import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "../AuthContext";
import { api, ApiError, removeToken, setToken } from "@/services/api";

function AuthHarness() {
  const { user, token, isLoading, login, logout, refresh } = useAuth();
  return (
    <div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="user-email">{user?.email ?? "none"}</div>
      <div data-testid="token">{token ?? "none"}</div>
      <button
        type="button"
        onClick={() => void login({ email: "budi@shoes4us.com", password: "password123" })}
      >
        Trigger Login
      </button>
      <button type="button" onClick={() => void refresh()}>
        Refresh
      </button>
      <button type="button" onClick={() => void logout()}>
        Logout
      </button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    removeToken();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    removeToken();
  });

  it("hydrates from /auth/me even when saved user JSON is missing and clears 404 session", async () => {
    setToken("stale-token");
    const getSpy = vi
      .spyOn(api, "get")
      .mockRejectedValueOnce(new ApiError("User tidak ditemukan", 404));

    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(getSpy).toHaveBeenCalledWith("/auth/me", { cache: "no-store" });
    expect(screen.getByTestId("user-email")).toHaveTextContent("none");
    expect(screen.getByTestId("token")).toHaveTextContent("none");
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("does not flip isLoading during refresh and revokes cookie via POST /auth/logout", async () => {
    setToken("valid-jwt");
    localStorage.setItem(
      "user",
      JSON.stringify({ id: "u1", name: "Budi", email: "budi@shoes4us.com", role: "USER" })
    );

    vi.spyOn(api, "get").mockResolvedValue({
      success: true,
      data: { id: "u1", user: { id: "u1", name: "Budi Updated", email: "budi@shoes4us.com", role: "USER" } },
    });
    const postSpy = vi.spyOn(api, "post").mockResolvedValue({ success: true });

    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    await userEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(screen.getByTestId("loading")).toHaveTextContent("false");

    await userEvent.click(screen.getByRole("button", { name: "Logout" }));
    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith("/auth/logout");
      expect(screen.getByTestId("user-email")).toHaveTextContent("none");
      expect(localStorage.getItem("token")).toBeNull();
    });
  });
});
