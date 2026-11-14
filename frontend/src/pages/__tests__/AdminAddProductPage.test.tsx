import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import toast from "react-hot-toast";
import AdminAddProductPage from "../AdminAddProductPage";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";

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

vi.mock("@/services/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/api")>();
  return {
    ...actual,
    api: {
      post: vi.fn(),
    },
  };
});

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("AdminAddProductPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "admin-1",
        name: "Admin",
        email: "admin@shoes4us.id",
        role: "ADMIN",
      },
      token: "tok",
      isLoading: false,
      isAdmin: true,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
    });
  });

  it("adapts size presets to selected segment, allows relative URL images, and submits total derived stock", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(api.post).mockResolvedValue({ success: true });

    render(
      <MemoryRouter initialEntries={["/admin/product/add"]}>
        <AdminAddProductPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Nama Produk/i), {
      target: { value: "Shoes4Us Track Jacket" },
    });
    await user.click(
      screen.getByRole("button", { name: /Koleksi fashion & streetwear/i })
    );

    // Switch segment to APPAREL -> displays S, M, L, XL, XXL instead of EU 38..45
    await user.selectOptions(screen.getByLabelText(/Segment/i), "APPAREL");
    expect(screen.getByLabelText("M")).toBeInTheDocument();
    expect(screen.queryByLabelText("EU 42")).not.toBeInTheDocument();

    // Update size M stock and add custom size XS
    fireEvent.change(screen.getByLabelText("M"), { target: { value: "6" } });

    fireEvent.change(screen.getByPlaceholderText(/Ukuran lain/i), {
      target: { value: "XS" },
    });
    await user.click(screen.getByRole("button", { name: /Tambah Ukuran/i }));
    fireEvent.change(screen.getByLabelText("XS"), { target: { value: "4" } });

    // Enter price > 0
    fireEvent.change(screen.getByLabelText(/Harga \(Rp\)/i), {
      target: { value: "750000" },
    });

    // Switch ImageUploadDropzone to URL input mode & type relative asset URL
    await user.click(screen.getByRole("button", { name: /Input URL/i }));
    fireEvent.change(
      screen.getByPlaceholderText(/https:\/\/example\.com\/sepatu\.jpg/i),
      { target: { value: "/jaket1.jpeg" } }
    );

    await user.click(
      screen.getByRole("button", { name: /Simpan Produk/i })
    );

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/products", expect.any(FormData));
    });

    const sent = vi.mocked(api.post).mock.calls[0][1] as FormData;
    expect(sent.get("stock")).toBe("10");
    expect(sent.get("segment")).toBe("APPAREL");
    expect(sent.get("imageUrl")).toBe("/jaket1.jpeg");
    expect(toast.success).toHaveBeenCalledWith("Produk berhasil ditambahkan!");
    expect(mockNavigate).toHaveBeenCalledWith("/admin/product");
  });
});
