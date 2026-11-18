import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ProductFilters from "../ProductFilters";
import { api } from "@/services/api";

vi.mock("@/services/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

describe("ProductFilters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockResolvedValue({
      success: true,
      data: [{ id: "cat-1", name: "Running", slug: "running" }],
    });
  });

  it("omits 'Hanya Stok Tersedia' switch and 'Stok Tersedia' tag while rendering collection filters", async () => {
    render(<ProductFilters onFilterChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Koleksi & Promo")).toBeInTheDocument();
    });

    expect(screen.queryByText(/Hanya Stok Tersedia/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Stok Tersedia/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sedang Diskon/i })).toBeInTheDocument();
  });
});
