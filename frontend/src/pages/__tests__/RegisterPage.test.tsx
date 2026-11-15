import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import toast from "react-hot-toast";
import RegisterPage from "../RegisterPage";
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

function renderRegister(initialEntry = "/register") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthNavbar />
      <RegisterPage />
    </MemoryRouter>
  );
}

describe("RegisterPage & Monochrome PasswordStrengthMeter", () => {
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

  it("renders editorial monochrome registration form, rail guarantees, and navigation links", () => {
    renderRegister("/register");

    expect(
      screen.getByRole("heading", { name: /Buat Akun Shoes4Us/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Nama Lengkap/i)).toHaveAttribute(
      "autocomplete",
      "name"
    );
    expect(screen.getByLabelText(/Email/i)).toHaveAttribute(
      "autocomplete",
      "email"
    );
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "autocomplete",
      "new-password"
    );
    expect(
      screen.getAllByRole("link", { name: /Kembali ke Toko/i })[0]
    ).toHaveAttribute("href", "/");
    expect(
      screen.getByText(/100% Original · Verifikasi Produk Resmi/i)
    ).toBeInTheDocument();

    const authNav = screen.getByRole("navigation", {
      name: /Navigasi autentikasi/i,
    });
    expect(authNav.className).toContain("lg:hidden");
  });

  it("toggles password visibility via accessible button", async () => {
    const user = userEvent.setup({ delay: null });
    renderRegister("/register");

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

  it("renders live password strength meter cleanly while preserving minimum 8-char hint", async () => {
    const user = userEvent.setup({ delay: null });
    renderRegister("/register");

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getByText("Wajib minimal 8 karakter.")).toBeInTheDocument();

    const passwordInput = screen.getByLabelText("Password");
    await user.type(passwordInput, "abc");
    expect(
      screen.getByRole("progressbar", { name: /Kekuatan password/i })
    ).toHaveAttribute("aria-valuenow", "25");
    expect(screen.getByText("Lemah")).toBeInTheDocument();
    expect(screen.getByText("Wajib minimal 8 karakter.")).toBeInTheDocument();

    await user.clear(passwordInput);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    await user.type(passwordInput, "Shoes4Us!2026");
    expect(
      screen.getByRole("progressbar", { name: /Kekuatan password/i })
    ).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByText("Sangat Kuat")).toBeInTheDocument();
  });

  it("prevents stale context errors, validates all fields together inline, and clears errors per field", async () => {
    const user = userEvent.setup({ delay: null });
    const registerMock = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      isAdmin: false,
      error: "Stale unauthorized check",
      login: vi.fn().mockResolvedValue(undefined),
      register: registerMock,
      logout: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn().mockResolvedValue(undefined),
    });

    renderRegister("/register");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Nama Lengkap/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText("Password");

    await user.click(screen.getByRole("button", { name: /^Daftar$/i }));
    const alerts = screen.getAllByRole("alert");
    expect(alerts).toHaveLength(3);
    expect(alerts[0]).toHaveTextContent("Nama lengkap wajib diisi.");
    expect(alerts[1]).toHaveTextContent(/Masukkan alamat email yang valid/i);
    expect(alerts[2]).toHaveTextContent("Password wajib diisi.");
    expect(nameInput).toHaveAttribute("aria-invalid", "true");
    expect(emailInput).toHaveAttribute("aria-invalid", "true");
    expect(passwordInput).toHaveAttribute("aria-invalid", "true");
    expect(registerMock).not.toHaveBeenCalled();

    // Typing only in Name clears Name's error without prematurely wiping Email/Password errors
    await user.type(nameInput, "A");
    expect(nameInput).toHaveAttribute("aria-invalid", "false");
    expect(emailInput).toHaveAttribute("aria-invalid", "true");
    expect(passwordInput).toHaveAttribute("aria-invalid", "true");

    await user.type(emailInput, "invalid-email");
    await user.type(passwordInput, "1234567");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Daftar$/i }));
    const refinedAlerts = screen.getAllByRole("alert");
    expect(refinedAlerts).toHaveLength(3);
    expect(refinedAlerts[0]).toHaveTextContent("Nama lengkap minimal 2 karakter.");
    expect(refinedAlerts[1]).toHaveTextContent(
      /Masukkan alamat email yang valid/i
    );
    expect(refinedAlerts[2]).toHaveTextContent("Password minimal 8 karakter.");
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("renders checkout redirect context, preserves redirect on login links, and submits trimmed fields", async () => {
    const user = userEvent.setup({ delay: null });
    const registerMock = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      isAdmin: false,
      error: null,
      login: vi.fn().mockResolvedValue(undefined),
      register: registerMock,
      logout: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn().mockResolvedValue(undefined),
    });

    renderRegister("/register?redirect=/payment");

    expect(screen.getByTestId("redirect-context-banner")).toHaveTextContent(
      /Melanjutkan ke Pengiriman & Pembayaran/i
    );
    const loginLinks = screen.getAllByRole("link", { name: /Login/i });
    expect(loginLinks[0]).toHaveAttribute("href", "/login?redirect=%2Fpayment");

    await user.type(screen.getByLabelText(/Nama Lengkap/i), "  Budi Santoso  ");
    await user.type(
      screen.getByLabelText(/Email/i),
      "  budi@shoes4us.com  "
    );
    await user.type(screen.getByLabelText("Password"), "Rahasia123!");
    await user.click(screen.getByRole("button", { name: /^Daftar$/i }));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        name: "Budi Santoso",
        email: "budi@shoes4us.com",
        password: "Rahasia123!",
      });
      expect(mockNavigate).toHaveBeenCalledWith("/payment", { replace: true });
    });
  });

  it("sanitizes unsafe external redirects back to root path", async () => {
    const user = userEvent.setup({ delay: null });
    const registerMock = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      isAdmin: false,
      error: null,
      login: vi.fn().mockResolvedValue(undefined),
      register: registerMock,
      logout: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn().mockResolvedValue(undefined),
    });

    renderRegister("/register?redirect=//evil.com");

    expect(
      screen.queryByTestId("redirect-context-banner")
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Login/i })[0]).toHaveAttribute(
      "href",
      "/login"
    );

    await user.type(screen.getByLabelText(/Nama Lengkap/i), "Budi");
    await user.type(screen.getByLabelText(/Email/i), "budi@shoes4us.com");
    await user.type(screen.getByLabelText("Password"), "rahasia123");
    await user.click(screen.getByRole("button", { name: /^Daftar$/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });

  it("maps duplicate email errors directly below Email and triggers honest Google OAuth toast", async () => {
    const user = userEvent.setup({ delay: null });
    const registerMock = vi
      .fn()
      .mockRejectedValue(new Error("User dengan email ini sudah terdaftar"));
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      isAdmin: false,
      error: null,
      login: vi.fn().mockResolvedValue(undefined),
      register: registerMock,
      logout: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn().mockResolvedValue(undefined),
    });

    renderRegister("/register");

    await user.type(screen.getByLabelText(/Nama Lengkap/i), "Budi Santoso");
    await user.type(screen.getByLabelText(/Email/i), "budi@shoes4us.com");
    await user.type(screen.getByLabelText("Password"), "rahasia123");
    await user.click(screen.getByRole("button", { name: /^Daftar$/i }));

    await waitFor(() => {
      const emailInput = screen.getByLabelText(/Email/i);
      expect(emailInput).toHaveAttribute("aria-invalid", "true");
      expect(emailInput).toHaveAttribute(
        "aria-describedby",
        "register-email-error"
      );
      expect(screen.getByRole("alert")).toHaveTextContent(
        "User dengan email ini sudah terdaftar"
      );
      expect(screen.getByLabelText("Password")).toHaveAttribute(
        "aria-invalid",
        "false"
      );
    });

    await user.click(
      screen.getByRole("button", { name: /Daftar dengan Google/i })
    );
    expect(toast).toHaveBeenCalledWith(
      "Integrasi Google OAuth belum tersedia.",
      expect.objectContaining({
        icon: expect.anything(),
      })
    );
  });

  it("displays unmapped server errors inside register-form-error alert", async () => {
    const user = userEvent.setup({ delay: null });
    const registerMock = vi
      .fn()
      .mockRejectedValue(new Error("Server sedang sibuk."));
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      isAdmin: false,
      error: null,
      login: vi.fn().mockResolvedValue(undefined),
      register: registerMock,
      logout: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn().mockResolvedValue(undefined),
    });

    renderRegister("/register");

    await user.type(screen.getByLabelText(/Nama Lengkap/i), "Budi Santoso");
    await user.type(screen.getByLabelText(/Email/i), "budi@shoes4us.com");
    await user.type(screen.getByLabelText("Password"), "rahasia123");
    await user.click(screen.getByRole("button", { name: /^Daftar$/i }));

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("id", "register-form-error");
      expect(alert).toHaveTextContent("Server sedang sibuk.");
    });
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

    renderRegister("/register?redirect=/orders");

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/orders", { replace: true });
    });
  });

  it("blocks passwords over 72 UTF-8 bytes and prevents double submit", async () => {
    const user = userEvent.setup({ delay: null });
    let resolveRegister!: () => void;
    const registerMock = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRegister = resolve;
        })
    );
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      isAdmin: false,
      error: null,
      login: vi.fn().mockResolvedValue(undefined),
      register: registerMock,
      logout: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn().mockResolvedValue(undefined),
    });

    renderRegister("/register");

    await user.type(screen.getByLabelText(/Nama Lengkap/i), "Budi Santoso");
    await user.type(screen.getByLabelText(/Email/i), "budi@shoes4us.com");
    await user.type(screen.getByLabelText("Password"), "é".repeat(37));
    await user.click(screen.getByRole("button", { name: /^Daftar$/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Password maksimal 72 byte."
    );
    expect(registerMock).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText("Password"));
    await user.type(screen.getByLabelText("Password"), "Rahasia123!");
    await user.dblClick(screen.getByRole("button", { name: /^Daftar$/i }));

    expect(registerMock).toHaveBeenCalledTimes(1);
    resolveRegister();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });

  it("renders session verification screen while auth status is loading", () => {
    mockedUseAuth.mockReturnValue({
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

    renderRegister("/register");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Memverifikasi sesi Anda..."
    );
    expect(
      screen.queryByRole("button", { name: /^Daftar$/i })
    ).not.toBeInTheDocument();
  });
});
