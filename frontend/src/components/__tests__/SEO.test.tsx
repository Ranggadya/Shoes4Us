import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import SEO, { HelmetProvider } from "../SEO";

describe("SEO component", () => {
  beforeEach(() => {
    document.title = "";
    document.head.innerHTML = "";
  });

  it("sets document.title and OpenGraph meta tags dynamically", () => {
    render(
      <HelmetProvider>
        <SEO
          title="Nike Air Jordan 1 Low"
          description="Sepatu basket ikonik dengan material kulit premium"
          image="https://example.com/aj1.jpg"
          url="https://shoes4us.id/product/aj1"
          priceAmount={2199000}
        />
      </HelmetProvider>
    );

    expect(document.title).toBe("Nike Air Jordan 1 Low | Shoes4Us");
    expect(
      document.head
        .querySelector('meta[name="description"]')
        ?.getAttribute("content")
    ).toBe("Sepatu basket ikonik dengan material kulit premium");
    expect(
      document.head
        .querySelector('meta[property="og:title"]')
        ?.getAttribute("content")
    ).toBe("Nike Air Jordan 1 Low | Shoes4Us");
    expect(
      document.head
        .querySelector('meta[property="og:image"]')
        ?.getAttribute("content")
    ).toBe("https://example.com/aj1.jpg");
    expect(
      document.head
        .querySelector('meta[property="product:price:amount"]')
        ?.getAttribute("content")
    ).toBe("2199000");
  });

  it("handles missing optional props gracefully without crashing", () => {
    render(
      <HelmetProvider>
        <SEO title="Beranda" />
      </HelmetProvider>
    );

    expect(document.title).toBe("Beranda | Shoes4Us");
    expect(
      document.head
        .querySelector('meta[property="og:site_name"]')
        ?.getAttribute("content")
    ).toBe("Shoes4Us");
  });
});
