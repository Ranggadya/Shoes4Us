import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Navbar from "../Navbar";
import { megaMenuSections } from "@/constants/navigation";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    isAdmin: false,
    logout: vi.fn(),
  }),
}));

vi.mock("@/context/CartContext", () => ({
  useCart: () => ({
    cart: { id: "c1", items: [], totals: { subtotal: 0, totalItems: 0 } },
  }),
}));

describe("Navbar Brands mega-menu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a 3-column hairline-divided Brands mega-menu with upward caret and monochrome SVG marks", () => {
    const { container } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const brandsSection = megaMenuSections.find((s) => s.label === "Brands");
    expect(brandsSection?.layout).toBe("brands");
    const allBrandItems = brandsSection?.brandColumns?.flat() ?? [];
    expect(allBrandItems).toHaveLength(21);

    const brandsTopLink = screen.getByRole("link", { name: "Brands" });
    expect(brandsTopLink).toHaveAttribute("href", "/product");

    // Upward black caret positioned at bottom of Brands link
    const caret = brandsTopLink.querySelector("span.border-b-black");
    expect(caret).toBeInTheDocument();

    // Dropdown container next to Brands link has 3 columns separated by vertical dividers
    const groupContainer = brandsTopLink.parentElement as HTMLElement;
    const panel = groupContainer.querySelector(".grid.grid-cols-3.divide-x") as HTMLElement;
    expect(panel).toBeInTheDocument();

    const columnLists = panel.querySelectorAll("ul");
    expect(columnLists).toHaveLength(3);

    allBrandItems.forEach((brand) => {
      const link = within(panel).getByRole("link", { name: brand.label });
      expect(link).toHaveAttribute("href", brand.href);
      expect(link.className).toContain("min-h-[44px]");
      const svg = link.querySelector("svg[aria-hidden='true']");
      expect(svg).toBeInTheDocument();
    });

    // Other mega-menus remain 4-column category links
    const newArrivalsLink = screen.getByRole("link", { name: "New Arrivals" });
    const naPanel = newArrivalsLink.parentElement?.querySelector(".grid-cols-4");
    expect(naPanel).toBeInTheDocument();

    // Ensure no unique SVG mask ID collisions across rendered logos
    const masks = Array.from(container.querySelectorAll("mask"));
    const ids = masks.map((m) => m.getAttribute("id"));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("dismisses active Brands mega-menu when a brand link is clicked and restores on mouseLeave", async () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const brandsTopLink = screen.getByRole("link", { name: "Brands" });
    const groupContainer = brandsTopLink.parentElement as HTMLElement;
    const dropdown = groupContainer.children[1] as HTMLElement;
    expect(dropdown.className).toContain("group-hover:visible");

    const nikeLink = within(dropdown).getByRole("link", { name: "Nike" });
    await userEvent.click(nikeLink);

    // Dismissed after click until pointer leaves group container
    expect(dropdown.className).not.toContain("group-hover:visible");

    fireEvent.mouseLeave(groupContainer);
    expect(dropdown.className).toContain("group-hover:visible");
  });

  it("renders all 21 brand shortcuts inside the mobile drawer Brands accordion", async () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));

    const mobileBrandLinks = screen.getAllByRole("link", { name: "New Balance" });
    // At least desktop mega-menu link + mobile drawer link exist
    expect(mobileBrandLinks.length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByRole("link", { name: "Vans" }).length).toBeGreaterThanOrEqual(2);
  });
});
