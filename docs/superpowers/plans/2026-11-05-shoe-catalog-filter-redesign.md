# Shoe Catalog Sidebar Filter Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the catalog left sidebar filter into a modern shoe e-commerce accordion filter (Gaya A: Clean Accordion & Size Matrix) with backend support for shoe size (`size`) and stock availability (`inStock`) filtering plus instant URL-synced frontend controls.

**Architecture:** Extend `domain.ProductFilter`, `ProductRepository.FindAll`, and `ProductHandler.ListProducts` in the Go backend to filter products by available shoe size (`EXISTS` query on `product_sizes` with `stock > 0`) and stock status (`p.stock > 0`). Refactor `ProductFilters.tsx` and `ProductListPage.tsx` in the React frontend to expose all multi-criteria filters (`category`, `brand`, `audience`, `size`, `collection`, `isSale`, `inStock`, `minPrice`, `maxPrice`, `sortBy`) with active filter chips and instant updates.

**Tech Stack:** Go 1.24+ (Chi v5, `pgx/v5`), React 18, TypeScript, Tailwind CSS, Lucide React.

**Spec:** `docs/superpowers/specs/2026-11-05-shoe-catalog-filter-redesign.md`

## Global Constraints
- Maintain 100% backward compatibility with existing `GET /api/products` query parameters and response format.
- Use `EXISTS (SELECT 1 FROM product_sizes ps WHERE ps."productId" = p.id AND LOWER(ps.size) = LOWER($N) AND ps.stock > 0)` in PostgreSQL so size filtering never duplicates product rows.
- Every task must follow strict TDD (write failing test first, verify RED, implement, verify GREEN).
- Conventional Commits formatting on every commit.

## Review Focus
- Filtering by a shoe size whose stock is `0` must NOT return the product.
- Selecting multiple filters simultaneously (e.g. `brand=Nike`, `size=42`, `audience=MEN`, `inStock=true`) must combine with `AND` semantics and reset pagination to page 1.
- Clearing an individual active filter chip in the UI must preserve all other active filters.
- Custom numeric price range where `minPrice > maxPrice` must be guarded gracefully without breaking the page.
- URL query parameters (`?brand=Nike&size=42`) must initialize the sidebar state accurately on page load or browser refresh.

---

### Task 1: Backend `size` and `inStock` Product Filtering

**Files:**
- Modify: `backend/internal/domain/product.go:77-96`
- Modify: `backend/internal/repository/product_repository.go:70-130`
- Modify: `backend/internal/handler/product_handler.go:92-145`
- Test: `backend/internal/handler/product_handler_test.go`

**Interfaces:**
- Produces:
  - `domain.ProductFilter.Size string`
  - `domain.ProductFilter.InStock *bool`
  - Query parameters on `GET /api/products`: `size` (e.g. `42`) and `inStock` (`true`)

- [x] **Step 1: Write failing test `TestProductHandler_ListProducts_SizeAndInStockFilter` in `backend/internal/handler/product_handler_test.go`**
  - Seed 3 products in `fakeProductRepo`:
    - Product 1: stock 5, size `"42"` (stock 3) and `"43"` (stock 2)
    - Product 2: stock 5, size `"42"` (stock 0) and `"40"` (stock 5)
    - Product 3: stock 0, no available sizes
  - Assert `GET /api/products?size=42` returns only Product 1 (since Product 2 has stock 0 for size 42).
  - Assert `GET /api/products?inStock=true` returns Product 1 and Product 2 (excluding Product 3 with stock 0).

- [x] **Step 2: Run test to verify it fails**
  - Run: `cd backend && go test -v ./internal/handler/... -run TestProductHandler_ListProducts_SizeAndInStockFilter`
  - Expected: FAIL

- [x] **Step 3: Add `Size` and `InStock` to `domain.ProductFilter`, `product_repository.go`, and `product_handler.go`**
  - Add `Size string` and `InStock *bool` to `domain.ProductFilter`.
  - In `product_repository.go` `FindAll`:
    - If `filter.Size != ""`, append `EXISTS (SELECT 1 FROM product_sizes ps WHERE ps."productId" = p.id AND LOWER(ps.size) = LOWER($%d) AND ps.stock > 0)`.
    - If `filter.InStock != nil && *filter.InStock`, append `p.stock > 0`.
  - In `product_handler.go` `ListProducts`: parse `size` and `inStock` query parameters.
  - Update `fakeProductRepo.FindAll` in `product_handler_test.go` to evaluate `filter.Size` (checking `r.sizes[p.ID]` with `stock > 0`) and `filter.InStock`.

- [x] **Step 4: Run backend tests to verify they pass**
  - Run: `cd backend && go test -v ./internal/handler/... -run TestProductHandler_ListProducts_SizeAndInStockFilter`
  - Expected: PASS

- [x] **Step 5: Commit Backend Filter**
  - Commit message: `feat(catalog): support shoe size and in-stock filtering on products endpoint`

---

### Task 2: Frontend Sidebar Filter Redesign (Gaya A: Clean Accordion & Size Matrix)

**Files:**
- Modify: `frontend/src/components/ProductFilters.tsx`
- Modify: `frontend/src/pages/ProductListPage.tsx`

**Interfaces:**
- Consumes: `GET /api/products` with `category`, `brand`, `audience`, `size`, `collection`, `isSale`, `inStock`, `minPrice`, `maxPrice`, `sortBy`
- Produces: Redesigned `ProductFilters` component with `FilterValues` type:
  ```ts
  export type FilterValues = {
    category: string;
    brand: string;
    audience: string;
    size: string;
    collection: string;
    isSale: boolean;
    inStock: boolean;
    minPrice: number;
    maxPrice: number;
    sortBy: string;
  };
  ```

- [x] **Step 1: Redesign `frontend/src/components/ProductFilters.tsx` into Style A (Clean Accordion & Size Matrix)**
  - Header showing `Filter (N)` active badge and `Hapus Semua` button.
  - Active filter tags row (`Size: 42 ✕`, `Nike ✕`, `Pria ✕`, `Diskon ✕`, `Stok Tersedia ✕`, etc.) with individual removal.
  - Collapsible accordion sections:
    1. **Urutkan Berdasarkan** (`newest`, `price-asc`, `price-desc`, `name-asc`, `name-desc`)
    2. **Ukuran Sepatu (EU)**: 4-column interactive grid (`36` to `45`)
    3. **Gender**: Interactive pills (`MEN` -> Pria, `WOMEN` -> Wanita, `UNISEX` -> Unisex, `KIDS` -> Anak)
    4. **Kategori**: Dynamic categories from `/api/categories`
    5. **Brand**: Interactive checkbox list (`Nike`, `Adidas`, `New Balance`, `Puma`, `Jordan`, `Vans`, `Converse`, `Asics`, `Reebok`)
    6. **Koleksi & Promo**: Toggles for *Sedang Diskon (`isSale`)*, *Rilisan Baru (`new-arrivals`)*, *Exclusive (`exclusive`)*, and switch *Hanya Stok Tersedia (`inStock`)*
    7. **Rentang Harga**: Quick preset chips (`< Rp 1 Jt`, `Rp 1 - 2 Jt`, `> Rp 2 Jt`) + formatted custom Min/Max inputs with 400ms debounce / apply.

- [x] **Step 2: Connect all filter fields and URL query sync in `frontend/src/pages/ProductListPage.tsx`**
  - Read `size` and `inStock` from `useSearchParams()`.
  - Pass `size` and `inStock` to `GET /products` API request params.
  - Pass full `initialFilters` into `<ProductFilters />` and sync `handleFilterChange` with `setSearchParams`.
  - Display active filter summary bar above the product grid on mobile/desktop.

- [x] **Step 3: Verify Frontend TypeScript & Vite Production Build**
  - Run: `cd frontend && npm run build`
  - Expected: `✓ built in ...` with 0 errors.

- [x] **Step 4: Commit Frontend Redesign**
  - Commit message: `feat(ui): redesign catalog sidebar filter with size matrix, brand, gender, and active tags`
