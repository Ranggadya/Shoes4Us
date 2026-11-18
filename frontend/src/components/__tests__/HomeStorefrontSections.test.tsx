import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import HomeTickerMarquee from "../HomeTickerMarquee";
import HomeVoucherStrip from "../HomeVoucherStrip";
import HomeArchiveSaleBanner from "../HomeArchiveSaleBanner";
import HomeQuickSizeFinder from "../HomeQuickSizeFinder";
import TabbedProductShowcase from "../TabbedProductShowcase";
import HomeBrandGrid from "../HomeBrandGrid";
import RecentlyViewedSection from "../RecentlyViewedSection";
import { api } from "@/services/api";
import { recordRecentlyViewed } from "@/utils/recently-viewed";
import toast from "react-hot-toast";

vi.mock("@/services/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
  }),
}));

vi.mock("@/context/WishlistContext", () => ({
  useWishlist: () => ({
    isWishlisted: () => false,
    toggleProduct: vi.fn(),
  }),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Storefront Promotional, Discovery & Recently Viewed Sections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders HomeTickerMarquee with interactive brand links and aria-hidden duplicate track", () => {
    const { container } = render(
      <MemoryRouter>
        <HomeTickerMarquee />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("link", { name: "Nike" })
    ).toHaveAttribute("href", "/product?brand=Nike");
    expect(
      screen.getAllByText(/Ekstra 10% Kode DISKON10/i).length
    ).toBeGreaterThanOrEqual(1);
    const duplicateTrack = container.querySelector(".shoes4us-marquee-duplicate");
    expect(duplicateTrack).toHaveAttribute("aria-hidden", "true");
  });

  it("renders all 3 active vouchers in HomeVoucherStrip and copies voucher code", async () => {
    const user = userEvent.setup({ delay: null });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(
      <MemoryRouter>
        <HomeVoucherStrip />
      </MemoryRouter>
    );

    expect(screen.getByText("DISKON10")).toBeInTheDocument();
    expect(screen.getByText("HEMAT50RB")).toBeInTheDocument();
    expect(screen.getByText("GRATISONGKIR")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Salin kode HEMAT50RB" }));
    expect(writeText).toHaveBeenCalledWith("HEMAT50RB");
    expect(toast.success).toHaveBeenCalled();
  });

  it("renders HomeArchiveSaleBanner, HomeQuickSizeFinder (39-45), and HomeBrandGrid", () => {
    render(
      <MemoryRouter>
        <HomeArchiveSaleBanner />
        <HomeQuickSizeFinder />
        <HomeBrandGrid />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: /ARCHIVE SALE · HEMAT S\/D 20%/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Belanja Produk Sale/i })
    ).toHaveAttribute("href", "/product?isSale=true");

    expect(
      screen.getByRole("link", { name: /US 8\.5\s*EU 42/i })
    ).toHaveAttribute("href", "/product?size=42");
    expect(
      screen.getByRole("link", { name: /US 11\s*EU 45/i })
    ).toHaveAttribute("href", "/product?size=45");

    expect(
      screen.getByRole("link", { name: "Belanja merek New Balance" })
    ).toHaveAttribute("href", "/product?brand=New%20Balance");
  });

  it("switches TabbedProductShowcase tabs, fetches matching collection queries, and updates CTA href", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(api.get).mockImplementation(async (endpoint: string) => {
      if (endpoint.includes("isSale=true")) {
        return {
          success: true,
          data: {
            items: [
              {
                id: "sale-1",
                name: "Adidas Samba OG Sale",
                price: 1520000,
                isSale: true,
              },
            ],
          },
        };
      }
      if (endpoint.includes("collection=coming-soon")) {
        return { success: true, data: { items: [] } };
      }
      return {
        success: true,
        data: {
          items: [
            {
              id: "new-1",
              name: "Nike Vomero 5 New",
              price: 2499000,
              isSale: false,
            },
          ],
        },
      };
    });

    render(
      <MemoryRouter>
        <TabbedProductShowcase />
      </MemoryRouter>
    );

    expect(await screen.findByText("Nike Vomero 5 New")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith(
      "/products?collection=new-arrivals&limit=8",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );

    await user.click(screen.getByRole("tab", { name: "Sedang Diskon" }));
    expect(await screen.findByText("Adidas Samba OG Sale")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Lihat Semua Produk Sale/i })
    ).toHaveAttribute("href", "/product?isSale=true");

    await user.click(screen.getByRole("tab", { name: "Coming Soon" }));
    expect(
      await screen.findByText(/Nantikan rilisan mendatang kami berikutnya/i)
    ).toBeInTheDocument();
  });

  it("renders RecentlyViewedSection excluding current product and clears history on button click", async () => {
    const user = userEvent.setup({ delay: null });
    recordRecentlyViewed({
      id: "shoe-current",
      name: "Current Shoe",
      price: 2000000,
    });
    recordRecentlyViewed({
      id: "shoe-other",
      name: "Jordan 1 Low",
      price: 1850000,
    });

    render(
      <MemoryRouter>
        <RecentlyViewedSection excludeProductId="shoe-current" />
      </MemoryRouter>
    );

    expect(screen.queryByText("Current Shoe")).not.toBeInTheDocument();
    expect(screen.getByText("Jordan 1 Low")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hapus Riwayat" }));
    await waitFor(() => {
      expect(screen.queryByText("Jordan 1 Low")).not.toBeInTheDocument();
    });
  });
});
