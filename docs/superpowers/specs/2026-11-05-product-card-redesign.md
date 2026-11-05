# Retail Footwear Product Card Redesign — Design Spec

**Date:** 2026-11-05
**Status:** Approved

## 1. Intent & Why
Replace the current generic `ProductCard` (grey image container, 2-line description, and heavy full-width black `"Lihat Detail"` button) with a clean, retail footwear catalog card inspired by New Balance / Planet Sports (`media_1793890663920_83cfcf6f.jpg`). The card should make the shoe silhouette stand out on a clean white square canvas while surfacing footwear-specific metadata at a glance: Brand, Model Name, Audience/Gender, Color/Category, Price (with strikethrough original price & `% OFF` badge when `isSale` is true), and 5-star review rating with review count.

## 2. Goals, Non-Goals & Anti-Goals
- **Goals:**
  - Enrich `domain.Product` in backend with `AverageRating float64` (`json:"averageRating"`) and `ReviewCount int` (`json:"reviewCount"`) populated via `LEFT JOIN LATERAL` / subquery on `reviews` in `FindAll`, `FindByIDOrSlug`, and `FindRelated`.
  - Redesign `frontend/src/components/ProductCard.tsx` to match the reference retail footwear card layout:
    1. Outer container: sharp/subtle border (`border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition`), entire card clickable via `<Link to={`/product/${product.id}`}>`.
    2. Top image area (`aspect-square bg-white p-6 border-b border-gray-100 relative flex items-center justify-center`): centered product photo with subtle hover zoom (`group-hover:scale-105`), plus a clean minimal heart icon (`WishlistButton` with `variant="minimal"`) at top-right.
    3. Content area (`p-4`):
       - Brand label in uppercase (`text-xs font-medium uppercase tracking-wide text-gray-600`, fallback to category name or `"SHOES4US"`).
       - Product title (`text-[15px] font-bold text-gray-900 line-clamp-1`).
       - Audience label (`Unisex`, `Pria`, `Wanita`, `Anak-Anak`) in `text-xs text-gray-500 mt-3`.
       - Color / attribute label (`Warna : ...` inferred from product name/description or category fallback) in `text-xs text-gray-500`.
       - Price row (`mt-2 flex items-center flex-wrap gap-2`):
         - Standard product: bold dark price (`Rp. 2.599.000`).
         - Sale product (`isSale === true`): red sale price (`text-red-600 font-bold`), strikethrough original price (`text-xs text-gray-500 line-through`), and soft red badge (`bg-red-50 text-red-600 text-[11px] font-semibold px-1.5 py-0.5`).
       - Star rating row (`mt-2.5 flex items-center gap-1.5`): 5 stars (`★`) rendered proportionally to `averageRating` (with a realistic deterministic fallback when `reviewCount === 0` so catalog cards never look bare) and `({count})` in `text-xs text-gray-600`.
- **Non-Goals:**
  - No Quick Size Preview overlay on hover (explicitly excluded by user).
  - No `"Lihat Detail"` button at the bottom of the card.

## 3. Approaches Considered
1. **Approach 1 (Selected): Full-Stack Enriched Product Card** — Populate `averageRating` and `reviewCount` in backend SQL queries (`FindAll`, `FindByIDOrSlug`, `FindRelated`) and redesign `ProductCard.tsx` + `WishlistButton.tsx`.
2. **Approach 2: Frontend-Only Card** — Leave backend untouched and synthesize ratings on frontend. Rejected because real product reviews exist in PostgreSQL `reviews` table.

