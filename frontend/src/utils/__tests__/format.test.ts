import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatDate,
  getCategoryName,
  resolveProductBrand,
} from "../format";

describe("format utilities", () => {
  it("formats Indonesian Rupiah currency properly", () => {
    const formatted = formatCurrency(1500000);
    expect(formatted).toMatch(/Rp\s*1\.500\.000/);
  });

  it("resolves category name from string, object, or null fallback", () => {
    expect(getCategoryName("Running")).toBe("Running");
    expect(getCategoryName({ id: "1", name: "Sneakers", slug: "sneakers" })).toBe("Sneakers");
    expect(getCategoryName(null, "Footwear")).toBe("Footwear");
  });

  it("formats ISO date strings cleanly and handles invalid dates", () => {
    expect(formatDate("2026-05-15T10:00:00Z")).toContain("2026");
    expect(formatDate("")).toBe("-");
    expect(formatDate("invalid-date")).toBe("-");
  });

  it("resolves product brand from explicit field, known name match, category, or fallback", () => {
    expect(resolveProductBrand("Ultraboost Light", "Adidas")).toBe("Adidas");
    expect(resolveProductBrand("Nike Air Force 1 '07", null)).toBe("Nike");
    expect(resolveProductBrand("Nike Air Jordan 1 Retro High OG", null)).toBe(
      "Nike"
    );
    expect(resolveProductBrand("Air Jordan 1 Low", null)).toBe("Air Jordan");
    expect(resolveProductBrand("New Balance 550", undefined)).toBe("New Balance");
    expect(resolveProductBrand("Custom Runner", null, "Running")).toBe("Running");
    expect(resolveProductBrand("Classic Loafer", null, null, "SHOES4US")).toBe(
      "SHOES4US"
    );
  });
});

