import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import toast from "react-hot-toast";
import LoginPage from "../LoginPage";
import AuthNavbar from "@/components/AuthNavbar";
import { useAuth } from "@/context/AuthContext";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("react-hot-toast", () => {
  const fn = vi.fn();
  return {
    default: Object.assign(fn, {
      success: vi.fn(),
      error: vi.fn(),
      dismiss: vi.fn(),
    }),
  };
});

const mockedUseAuth = vi.mocked(useAuth);

function renderLogin(initialEntry = "/login") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthNavbar />
      <LoginPage />
    </MemoryRouter>
  );
}

describe("LoginPage & AuthNavbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      isAdmin: false,
      error: null,
      login: vi.fn().mockResolvedValue(undefined),
      register: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn().mockResolvedValue(undefined),
    });
  });

  it("renders editorial monochrome login form, store guarantees, and navigation links", () => {
    renderLogin("/login");

    expect(
      screen.getByRole("heading", { name: /Masuk ke Shoes4Us/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toHaveAttribute(
      "autocomplete",
      "email"
    );
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "autocomplete",
      "current-password"
    );
    expect(screen.getByRole("link", { name: /Lupa password\?/i })).toHaveAttribute(
      "href",
      "/forgot-password"
    );
    expect(
      screen.getAllByRole("link", { name: /Kembali ke Toko/i })[0]
    ).toHaveAttribute("href", "/");
    expect(
      screen.getByText(/100% Original · Verifikasi Produk Resmi/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/Stok Real-Time/i)).not.toBeInTheDocument();

    const authNav = screen.getByRole("navigation", {
      name: /Navigasi autentikasi/i,
    });
    expect(authNav.className).toContain("lg:hidden");
  });

  it("toggles password visibility via accessible button", async () => {
    const user = userEvent.setup({ delay: null });
    renderLogin("/login");

    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleButton = screen.getByRole("button", {
      name: /Tampilkan password/i,
    });
    expect(toggleButton).toHaveAttribute("aria-pressed", "false");

    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: /Sembunyikan password/i })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("shows accessible inline validation errors and clears them on input change", async () => {
    const user = userEvent.setup({ delay: null });
    const loginMock = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      isAdmin: false,
      error: "Stale unauthorized profile check",
      login: loginMock,
      register: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn().mockResolvedValue(undefined),
    });

    renderLogin("/login");

    // Stale mount context error should not leak into initial resting state
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText("Password");

    await user.click(screen.getByRole("button", { name: /^Login$/i }));
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Email dan password wajib diisi.");
    expect(emailInput).toHaveAttribute("aria-invalid", "true");
    expect(passwordInput).toHaveAttribute("aria-invalid", "true");
    expect(loginMock).not.toHaveBeenCalled();

    await user.type(emailInput, "email-tanpa-at");
    await user.type(passwordInput, "rahasia123");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Login$/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      /Masukkan alamat email yang valid/i
    );
    expect(emailInput).toHaveAttribute("aria-invalid", "true");
    expect(passwordInput).toHaveAttribute("aria-invalid", "false");
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("renders checkout redirect context, preserves redirect on register links, and submits cleanly", async () => {
    const user = userEvent.setup({ delay: null });
    const loginMock = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      isAdmin: false,
      error: null,
      login: loginMock,
      register: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn().mockResolvedValue(undefined),
    });

    renderLogin("/login?redirect=/payment");

    expect(screen.getByTestId("redirect-context-banner")).toHaveTextContent(
      /Melanjutkan ke Pengiriman & Pembayaran/i
    );
    const registerLinks = screen.getAllByRole("link", {
      name: /Daftar/i,
    });
    expect(registerLinks[0]).toHaveAttribute(
      "href",
      "/register?redirect=%2Fpayment"
    );

    await user.type(screen.getByLabelText(/Email/i), "pembeli@shoes4us.com");
    await user.type(screen.getByLabelText("Password"), "rahasia123");
    await user.click(screen.getByRole("button", { name: /^Login$/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: "pembeli@shoes4us.com",
        password: "rahasia123",
      });
      expect(mockNavigate).toHaveBeenCalledWith("/payment", { replace: true });
    });
  });

  it("sanitizes unsafe external redirects back to root path", async () => {
    const user = userEvent.setup({ delay: null });
    const loginMock = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      isAdmin: false,
      error: null,
      login: loginMock,
      register: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn().mockResolvedValue(undefined),
    });

    renderLogin("/login?redirect=//evil.com");

    expect(
      screen.queryByTestId("redirect-context-banner")
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Daftar/i })[0]
    ).toHaveAttribute("href", "/register");

    await user.type(screen.getByLabelText(/Email/i), "pembeli@shoes4us.com");
    await user.type(screen.getByLabelText("Password"), "rahasia123");
    await user.click(screen.getByRole("button", { name: /^Login$/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });

  it("displays rejected login error and triggers honest Google OAuth info toast", async () => {
    const user = userEvent.setup({ delay: null });
    const loginMock = vi
      .fn()
      .mockRejectedValue(new Error("Email atau password salah."));
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      isAdmin: false,
      error: null,
      login: loginMock,
      register: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn().mockResolvedValue(undefined),
    });

    renderLogin("/login");

    await user.type(screen.getByLabelText(/Email/i), "pembeli@shoes4us.com");
    await user.type(screen.getByLabelText("Password"), "salah123");
    await user.click(screen.getByRole("button", { name: /^Login$/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Email atau password salah."
      );
    });

    await user.click(
      screen.getByRole("button", { name: /Login dengan Google/i })
    );
    expect(toast).toHaveBeenCalledWith(
      "Integrasi Google OAuth belum tersedia.",
      expect.any(Object)
    );
  });

  it("redirects immediately when user is already authenticated", async () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: "usr-1",
        name: "Budi",
        email: "budi@shoes4us.com",
        role: "USER",
      },
      token: "jwt-token",
      isLoading: false,
      isAdmin: false,
      error: null,
      login: vi.fn().mockResolvedValue(undefined),
      register: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn().mockResolvedValue(undefined),
    });

    renderLogin("/login?redirect=/orders");

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/orders", { replace: true });
    });
  });

  it("sanitizes /login?redirect=/register to root path and rejects invalid domain syntax", async () => {
    const user = userEvent.setup({ delay: null });
    const loginMock = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      isAdmin: false,
      error: null,
      login: loginMock,
      register: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn().mockResolvedValue(undefined),
    });

    renderLogin("/login?redirect=/register");

    await user.type(screen.getByLabelText(/Email/i), "user@localhost");
    await user.type(screen.getByLabelText("Password"), "rahasia123");
    await user.click(screen.getByRole("button", { name: /^Login$/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      /Masukkan alamat email yang valid/i
    );
    expect(loginMock).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText(/Email/i));
    await user.type(screen.getByLabelText(/Email/i), "pembeli@shoes4us.com");
    await user.click(screen.getByRole("button", { name: /^Login$/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });

  it("renders session verification screen during initial loading and prevents double submit", async () => {
    mockedUseAuth.mockReturnValueOnce({
      user: null,
      token: "stored-jwt",
      isLoading: true,
      isAdmin: false,
      error: null,
      login: vi.fn().mockResolvedValue(undefined),
      register: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn().mockResolvedValue(undefined),
    });

    const { unmount } = renderLogin("/login");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Memverifikasi sesi Anda..."
    );
    expect(
      screen.queryByRole("button", { name: /^Login$/i })
    ).not.toBeInTheDocument();
    unmount();

    const user = userEvent.setup({ delay: null });
    let resolveLogin!: () => void;
    const pendingLogin = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveLogin = resolve;
        })
    );
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      isAdmin: false,
      error: null,
      login: pendingLogin,
      register: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn().mockResolvedValue(undefined),
    });

    renderLogin("/login");
    await user.type(screen.getByLabelText(/Email/i), "pembeli@shoes4us.com");
    await user.type(screen.getByLabelText("Password"), "rahasia123");

    const submitButton = screen.getByRole("button", { name: /^Login$/i });
    await user.dblClick(submitButton);
    expect(pendingLogin).toHaveBeenCalledTimes(1);

    resolveLogin();
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });
});
