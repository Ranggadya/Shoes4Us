import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import WhatsAppSupportButton, {
  buildWhatsAppSupportUrl,
} from "../WhatsAppSupportButton";

describe("WhatsAppSupportButton", () => {
  beforeEach(() => {
    document.title = "Shoes4Us - E-Commerce Sepatu Stylish";
  });

  it("uses the official Shoes4Us WhatsApp number (6281574577583)", () => {
    const url = buildWhatsAppSupportUrl();
    expect(url).toMatch(/^https:\/\/wa\.me\/6281574577583\?text=/);
    expect(url).not.toContain("6281234567890");
  });

  it("includes product context and optional page URL in WhatsApp pre-filled message", () => {
    const url = buildWhatsAppSupportUrl(
      "Nike Dunk Low",
      "https://shoes4us.id/product/1"
    );
    expect(url).toContain(encodeURIComponent("Nike Dunk Low"));
    expect(url).toContain(encodeURIComponent("https://shoes4us.id/product/1"));
  });

  it("renders accessible retail button with inline WhatsApp SVG, z-30, print:hidden, and >=44px target", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <WhatsAppSupportButton />
      </MemoryRouter>
    );

    const link = screen.getByRole("link", {
      name: /WhatsApp.*buka di tab baru/i,
    });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link.className).toContain("z-30");
    expect(link.className).toContain("print:hidden");
    expect(link.className).toContain("min-h-[44px]");
    expect(link.className).toContain("min-w-[44px]");
    expect(link.className).not.toContain("rounded-full");
    expect(link.className).not.toMatch(/\bgroup\b/);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
    // No fake online status dot
    expect(container.querySelector(".bg-\\[\\#22c55e\\]")).toBeNull();
  });

  it("enriches WhatsApp message automatically with product title on product detail routes", () => {
    document.title = "Adidas Samba OG - ADIDAS | Shoes4Us";
    render(
      <MemoryRouter initialEntries={["/product/samba-og"]}>
        <WhatsAppSupportButton />
      </MemoryRouter>
    );

    const link = screen.getByRole("link", {
      name: /WhatsApp.*buka di tab baru/i,
    });
    expect(link.getAttribute("href")).toContain(
      encodeURIComponent("Adidas Samba OG - ADIDAS")
    );
  });

  it("updates WhatsApp link reactively when document title updates asynchronously on product page", async () => {
    render(
      <MemoryRouter initialEntries={["/product/aj1-low"]}>
        <WhatsAppSupportButton />
      </MemoryRouter>
    );

    await act(async () => {
      document.title = "Air Jordan 1 Low - NIKE | Shoes4Us";
      await Promise.resolve();
    });

    const link = screen.getByRole("link", {
      name: /WhatsApp.*buka di tab baru/i,
    });
    expect(link.getAttribute("href")).toContain(
      encodeURIComponent("Air Jordan 1 Low - NIKE")
    );
  });
});
