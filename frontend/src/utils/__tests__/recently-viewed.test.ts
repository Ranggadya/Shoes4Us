import { describe, it, expect, beforeEach } from "vitest";
import {
  RECENTLY_VIEWED_STORAGE_KEY,
  clearRecentlyViewed,
  loadRecentlyViewed,
  recordRecentlyViewed,
} from "../recently-viewed";

describe("recently-viewed storage utility", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("records unique products in most-recent-first order, strips stock fields, and caps at 6", () => {
    for (let i = 1; i <= 7; i += 1) {
      recordRecentlyViewed({
        id: `shoe-${i}`,
        name: `Shoe Model ${i}`,
        price: 1500000 + i * 10000,
        imageUrl: `/sepatu${i}.jpeg`,
        brand: "Nike",
        isSale: i % 2 === 0,
      });
    }

    // Viewing shoe-2 again moves it to the top without duplicating
    const updated = recordRecentlyViewed({
      id: "shoe-2",
      name: "Shoe Model 2",
      price: 1520000,
    });

    expect(updated).toHaveLength(6);
    expect(updated[0].id).toBe("shoe-2");
    expect(updated[1].id).toBe("shoe-7");
    expect(loadRecentlyViewed("shoe-2")).toHaveLength(5);

    const raw = localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY) || "";
    expect(raw).not.toContain('"stock"');
  });

  it("handles corrupt storage gracefully and clears history", () => {
    localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, "{broken-json");
    expect(loadRecentlyViewed()).toEqual([]);

    recordRecentlyViewed({ id: "p-1", name: "Nike Dunk", price: 1900000 });
    expect(loadRecentlyViewed()).toHaveLength(1);

    clearRecentlyViewed();
    expect(loadRecentlyViewed()).toEqual([]);
  });
});
