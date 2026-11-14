import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import toast from "react-hot-toast";
import AdminLayout from "../AdminLayout";
import MainLayout from "@/components/MainLayout";
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

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("AdminLayout & MainLayout landmark integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "admin-1",
        name: "Budi Admin",
        email: "admin@shoes4us.id",
        role: "ADMIN",
      },
      token: "tok",
      isLoading: false,
      isAdmin: true,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn(),
    });
  });

  it("marks active navigation link with aria-current='page' and renders single <main> inside MainLayout", () => {
    render(
      <MemoryRouter initialEntries={["/admin/dashboard?tab=orders"]}>
        <MainLayout>
          <AdminLayout>
            <h1>Halaman Pesanan</h1>
          </AdminLayout>
        </MainLayout>
      </MemoryRouter>
    );

    const mains = document.querySelectorAll("main");
    expect(mains).toHaveLength(1);

    const purchasesLink = screen.getByRole("link", { name: /Purchases/i });
    expect(purchasesLink).toHaveAttribute("aria-current", "page");

    const dashboardLink = screen.getByRole("link", { name: /^Dashboard$/i });
    expect(dashboardLink).not.toHaveAttribute("aria-current");
  });

  it("opens mobile sidebar as accessible dialog and closes on Escape", async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("max-width: 1023px"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <AdminLayout>
          <div>Konten</div>
        </AdminLayout>
      </MemoryRouter>
    );

    const aside = document.getElementById("admin-sidebar-nav");
    expect(aside).toHaveClass("hidden");

    const openBtn = screen.getByRole("button", { name: /Open navigation/i });
    await userEvent.click(openBtn);

    const dialog = screen.getByRole("dialog", { name: /Menu navigasi admin/i });
    expect(dialog).toHaveAttribute("aria-modal", "true");

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("handles logout failure cleanly without locking the logout button", async () => {
    const failingLogout = vi.fn().mockRejectedValue(new Error("Sesi gagal dihapus"));
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "admin-1",
        name: "Budi Admin",
        email: "admin@shoes4us.id",
        role: "ADMIN",
      },
      token: "tok",
      isLoading: false,
      isAdmin: true,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: failingLogout,
      refresh: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <AdminLayout>
          <div>Konten</div>
        </AdminLayout>
      </MemoryRouter>
    );

    const logoutBtn = screen.getByRole("button", { name: /Logout/i });
    await userEvent.click(logoutBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Sesi gagal dihapus");
    });
    expect(logoutBtn).toBeEnabled();
  });
});
