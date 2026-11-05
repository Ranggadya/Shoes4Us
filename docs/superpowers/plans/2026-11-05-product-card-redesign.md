# Retail Footwear Product Card Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `ProductCard` to match the New Balance / Planet Sports retail catalog layout (clean square photo frame, minimal wishlist heart, brand header, product name, gender/audience, color attribute, sale strikethrough + `% OFF` badge, and 5-star review count) backed by real review aggregates from PostgreSQL.

**Architecture:** Extend `domain.Product` and `PostgresProductRepository` (`FindAll`, `FindByIDOrSlug`, `FindRelated`) to include `averageRating` and `reviewCount` from the `reviews` table. Update `WishlistButton.tsx`, `ProductCard.tsx`, and `ProductListPage.tsx` to render the retail footwear card without a bottom button or quick-size hover overlay.

**Tech Stack:** Go 1.24+ (`pgx/v5`), React 18, TypeScript, Tailwind CSS, Lucide React.

**Spec:** `docs/superpowers/specs/2026-11-05-product-card-redesign.md`

## Global Constraints
- Zero breaking changes to existing `/api/products` JSON fields; `averageRating` and `reviewCount` are additive fields.
- No Quick Size Preview overlay on hover.
- Entire card is clickable to navigate to `/product/{id}`, while clicking the top-right heart button toggles wishlist without triggering navigation.

## Review Focus
- Products with 0 rows in `reviews` table must not cause SQL `NULL` scan errors (`COALESCE(AVG(r.rating), 0)` and `COUNT(r.id)`).
- Clicking `WishlistButton` inside the `<Link>` wrapper in `ProductCard` must call `e.preventDefault()` and `e.stopPropagation()` so it does not navigate to the product detail page.
- Products where `brand` is `null` or empty must gracefully fall back to the category name or `"SHOES4US"` in uppercase.

---

### Task 1: Backend Product Review Aggregation (`averageRating` & `reviewCount`)

**Files:**
- Modify: `backend/internal/domain/product.go`
- Modify: `backend/internal/repository/product_repository.go`
- Test: `backend/internal/handler/product_handler_test.go`

**Interfaces:**
- Produces: `AverageRating float64` (`json:"averageRating"`) and `ReviewCount int` (`json:"reviewCount"`) on `domain.Product`.

- [x] **Step 1: Add `AverageRating` and `ReviewCount` fields to `domain.Product` in `backend/internal/domain/product.go` and write a test in `backend/internal/handler/product_handler_test.go` asserting `averageRating` and `reviewCount` are serialized in `GET /api/products`**
- [x] **Step 2: Update `FindAll`, `FindByIDOrSlug`, and `FindRelated` in `backend/internal/repository/product_repository.go` to select `COALESCE((SELECT AVG(r.rating)::float8 FROM reviews r WHERE r."productId" = p.id), 0)` and `COALESCE((SELECT COUNT(r.id) FROM reviews r WHERE r."productId" = p.id), 0)`**
- [x] **Step 3: Run `cd backend && go test -v ./internal/handler/... -run TestProductHandler` and verify PASS**

---

### Task 2: Frontend Retail Footwear `ProductCard` & Minimal `WishlistButton`

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/components/WishlistButton.tsx`
- Modify: `frontend/src/components/ProductCard.tsx`
- Modify: `frontend/src/pages/ProductListPage.tsx`

**Interfaces:**
- Consumes: `Product` fields (`id`, `name`, `price`, `imageUrl`, `brand`, `audience`, `isSale`, `category`, `averageRating`, `reviewCount`).
- Produces: Redesigned `ProductCard` and `WishlistButton` (`variant?: "default" | "minimal"`).

- [x] **Step 1: Add `averageRating?: number` and `reviewCount?: number` to `Product` in `frontend/src/types/index.ts` and `frontend/src/pages/ProductListPage.tsx`**
- [x] **Step 2: Add `variant?: "default" | "minimal"` prop to `frontend/src/components/WishlistButton.tsx` so the catalog card can render a clean outline heart icon in the top-right corner matching the reference image**
- [x] **Step 3: Rewrite `frontend/src/components/ProductCard.tsx` with the retail footwear layout (white square image container, minimal heart button, uppercase brand, bold product title, audience & color lines, sale discount price + strikethrough + `% OFF` badge, and 5-star rating row)**
- [x] **Step 4: Run `cd frontend && npx tsc --noEmit && npm run build` and verify PASS**
- [x] **Step 5: Commit all changes**

