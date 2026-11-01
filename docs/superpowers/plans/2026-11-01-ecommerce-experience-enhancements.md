# E-Commerce Experience Enhancements: Coupons, Related Products, Dynamic Shipping, and Order Tracking

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 4 high-impact shopping experience features: Product Recommendations ("You May Also Like"), Coupon/Voucher Discount Engine, Dynamic Courier Selection with Live Shipping Estimator, and Visual Logistics Tracking with Tracking Numbers.

**Architecture:** Layered clean architecture across Go backend (`domain`, `repository`, `service`, `handler`, `router`) and React frontend (`components`, `pages`, `services/api.ts`, `types`), maintaining full backward compatibility.

**Tech Stack:** Go 1.24+ (Chi v5, PostgreSQL `pgx/v5`), React 18, TypeScript, Tailwind CSS, Lucide icons.

**Spec:** User requirements from `2026-11-01` brainstorming session.

## Global Constraints
- Zero breaking changes to existing product, cart, or payment contracts.
- All monetary calculations must use exact Indonesian Rupiah values without rounding artifacts.
- Every task must follow strict TDD (write failing test first, make it pass, verify full suite).
- Conventional Commits formatting on every commit.

---

## File Structure

### Task 1: Product Recommendations ("You May Also Like")
- `backend/internal/domain/product.go`: Add `FindRelated` to `ProductRepository` and `GetRelated` to `ProductService`.
- `backend/internal/repository/product_repository.go`: Implement `FindRelated` querying active products sharing category or brand.
- `backend/internal/service/product_service.go`: Implement `GetRelated` business logic.
- `backend/internal/handler/product_handler.go`: Add `GetRelated(w, r)` for `GET /api/products/{id}/related`.
- `backend/internal/handler/router.go`: Mount `/api/products/{id}/related` route.
- `backend/internal/handler/product_handler_test.go`: Unit tests for related products endpoint.
- `frontend/src/components/RelatedProducts.tsx`: UI component rendering responsive grid of related products.
- `frontend/src/pages/ProductDetailPage.tsx`: Mount `RelatedProducts` section below review tabs.

### Task 2: Coupon Promo & Voucher Discount Engine
- `backend/internal/domain/coupon.go`: Coupon entity, input types, and validation rules (`DISKON10`, `HEMAT50RB`, `GRATISONGKIR`).
- `backend/internal/service/coupon_service.go`: Validate coupons against order subtotal and calculate discount amount.
- `backend/internal/service/coupon_service_test.go`: Unit tests for percentage, fixed, free shipping, and min order thresholds.
- `backend/internal/handler/coupon_handler.go`: Add `ValidateCoupon` for `POST /api/coupons/validate`.
- `backend/internal/handler/coupon_handler_test.go`: HTTP handler tests.
- `backend/internal/domain/order.go`: Add `CouponCode` and `DiscountAmount` to `Order` and `CreateOrderInput`.
- `backend/internal/service/order_service.go`: Apply validated coupon discount during order creation.
- `frontend/src/components/CouponInput.tsx`: Reusable voucher input with apply/remove toggle and feedback badge.
- `frontend/src/pages/CartPage.tsx`: Integrate `CouponInput` and display discount in order summary.
- `frontend/src/pages/PaymentPage.tsx`: Carry forward applied coupon and reflect discount in grand total.

### Task 3: Dynamic Courier Selection & Shipping Estimator
- `backend/internal/domain/shipping.go`: Available couriers model (`JNE Reguler`, `SiCepat REG`, `J&T Express`, `JNE YES`).
- `backend/internal/handler/shipping_handler.go`: Endpoint `GET /api/shipping/couriers`.
- `backend/internal/handler/shipping_handler_test.go`: Tests for courier listing.
- `backend/internal/domain/order.go`: Add `ShippingCourier` and `ShippingCost` to `Order` and `CreateOrderInput`.
- `backend/internal/repository/order_repository.go`: Persist courier and shipping fee in `orders` table.
- `frontend/src/components/CourierSelector.tsx`: Radio cards displaying courier name, badge, ETA, and rate.
- `frontend/src/pages/PaymentPage.tsx`: Integrate courier selection and live shipping fee calculation into checkout.

### Task 4: Visual Tracking Resi Pengiriman & Milestone Timeline
- `backend/internal/domain/order.go`: Add `TrackingNumber` to `Order`.
- `backend/internal/repository/order_repository.go`: Save and retrieve `trackingNumber`.
- `backend/internal/service/order_service.go`: Auto-generate realistic tracking resi when order transitions to `SHIPPED`.
- `backend/internal/handler/order_handler_test.go`: Test tracking number assignment on shipping transition.
- `frontend/src/components/OrderTracking.tsx`: Enhance with copyable tracking resi badge, courier tag, and detailed progress milestones.
- `frontend/src/pages/OrderStatusPage.tsx`: Display courier details and interactive tracking timeline.
- `frontend/src/pages/OrderHistoryPage.tsx`: Surface tracking resi on completed/shipped orders.

---

### Task 1: Product Recommendations ("You May Also Like")

**Files:**
- Modify: `backend/internal/domain/product.go`
- Modify: `backend/internal/repository/product_repository.go`
- Modify: `backend/internal/service/product_service.go`
- Modify: `backend/internal/handler/product_handler.go`
- Modify: `backend/internal/handler/router.go`
- Create/Modify: `backend/internal/handler/product_handler_test.go`
- Create: `frontend/src/components/RelatedProducts.tsx`
- Modify: `frontend/src/pages/ProductDetailPage.tsx`

- [ ] Step 1: Add `FindRelated` to `ProductRepository` interface and `GetRelated` to `ProductService` interface in `domain/product.go`.
- [ ] Step 2: Write failing test in `product_handler_test.go` verifying `GET /api/products/{id}/related` returns 4 related items.
- [ ] Step 3: Implement `FindRelated` in `product_repository.go` querying products with same `categoryId` or `brand`, excluding current product.
- [ ] Step 4: Implement `GetRelated` in `product_service.go` and `GetRelated` in `product_handler.go`. Mount route in `router.go`.
- [ ] Step 5: Run `go test -v ./internal/handler/... -run TestProductHandler_GetRelated` and confirm it passes.
- [ ] Step 6: Create `RelatedProducts.tsx` in `frontend/src/components/` fetching `/products/${productId}/related` and rendering product cards.
- [ ] Step 7: Mount `RelatedProducts` in `ProductDetailPage.tsx` below reviews section.
- [ ] Step 8: Verify frontend build (`npm run build`).
- [ ] Step 9: Commit with message: `feat(product): add related products recommendation backend endpoint and frontend showcase`

---

### Task 2: Coupon Promo & Voucher Discount Engine

**Files:**
- Create: `backend/internal/domain/coupon.go`
- Create: `backend/internal/service/coupon_service.go`
- Create: `backend/internal/service/coupon_service_test.go`
- Create: `backend/internal/handler/coupon_handler.go`
- Create: `backend/internal/handler/coupon_handler_test.go`
- Modify: `backend/internal/domain/order.go`
- Modify: `backend/internal/service/order_service.go`
- Modify: `backend/internal/handler/router.go`
- Create: `frontend/src/components/CouponInput.tsx`
- Modify: `frontend/src/pages/CartPage.tsx`
- Modify: `frontend/src/pages/PaymentPage.tsx`
- Modify: `frontend/src/types/index.ts`

- [ ] Step 1: Create `domain/coupon.go` defining `Coupon`, `DiscountType`, and standard active vouchers (`DISKON10`, `HEMAT50RB`, `GRATISONGKIR`).
- [ ] Step 2: Write failing test in `coupon_service_test.go` verifying discount calculations (10% percentage capped, 50k fixed, free shipping) and minimum order rejections.
- [ ] Step 3: Implement `coupon_service.go` satisfying all test cases.
- [ ] Step 4: Create `coupon_handler.go` with `POST /api/coupons/validate` and write handler tests in `coupon_handler_test.go`.
- [ ] Step 5: Mount coupon routes in `router.go`. Update `order_service.go` to compute discount when `CreateOrderInput.CouponCode` is provided.
- [ ] Step 6: Run `go test -v ./internal/service/... ./internal/handler/... -run TestCoupon` and verify tests pass.
- [ ] Step 7: Create `CouponInput.tsx` with instant badge, discount preview, and clear button.
- [ ] Step 8: Integrate `CouponInput` in `CartPage.tsx` and `PaymentPage.tsx` updating order summary totals.
- [ ] Step 9: Verify frontend build (`npm run build`).
- [ ] Step 10: Commit with message: `feat(coupon): implement voucher discount engine and checkout coupon redemption`

---

### Task 3: Dynamic Courier Selection & Shipping Estimator

**Files:**
- Create: `backend/internal/domain/shipping.go`
- Create: `backend/internal/handler/shipping_handler.go`
- Create: `backend/internal/handler/shipping_handler_test.go`
- Modify: `backend/internal/domain/order.go`
- Modify: `backend/internal/repository/order_repository.go`
- Modify: `backend/internal/handler/router.go`
- Create: `frontend/src/components/CourierSelector.tsx`
- Modify: `frontend/src/pages/PaymentPage.tsx`
- Modify: `frontend/src/types/index.ts`

- [ ] Step 1: Create `domain/shipping.go` with courier definitions: JNE Reguler (Rp 18.000, 2-3 hari), SiCepat REG (Rp 16.000, 1-2 hari), J&T Express (Rp 17.000, 2-3 hari), JNE YES (Rp 32.000, 1 hari).
- [ ] Step 2: Write failing test in `shipping_handler_test.go` for `GET /api/shipping/couriers`.
- [ ] Step 3: Implement `shipping_handler.go` and mount in `router.go`.
- [ ] Step 4: Update `Order` and `CreateOrderInput` in `domain/order.go` and `order_repository.go` to persist `shippingCourier` and `shippingCost`.
- [ ] Step 5: Run tests: `go test -v ./internal/handler/... -run TestShipping`.
- [ ] Step 6: Create `CourierSelector.tsx` with radio cards showing courier logo/icon, name, ETA, and cost.
- [ ] Step 7: Integrate `CourierSelector` into `PaymentPage.tsx` so selecting courier updates shipping fee and grand total live.
- [ ] Step 8: Verify frontend build (`npm run build`).
- [ ] Step 9: Commit with message: `feat(shipping): add dynamic courier selection and live shipping fee calculation`

---

### Task 4: Visual Tracking Resi Pengiriman & Milestone Timeline

**Files:**
- Modify: `backend/internal/domain/order.go`
- Modify: `backend/internal/repository/order_repository.go`
- Modify: `backend/internal/service/order_service.go`
- Modify: `backend/internal/handler/order_handler_test.go`
- Modify: `frontend/src/components/OrderTracking.tsx`
- Modify: `frontend/src/pages/OrderStatusPage.tsx`
- Modify: `frontend/src/pages/OrderHistoryPage.tsx`

- [ ] Step 1: Add `TrackingNumber` to `domain.Order` and support tracking persistence in `order_repository.go`.
- [ ] Step 2: In `order_service.go`, when status transitions to `SHIPPED` (or `PAID` in mock checkout), generate a realistic courier tracking number (e.g. `JNE-8839201948`) if empty.
- [ ] Step 3: Write test in `order_handler_test.go` asserting `trackingNumber` is present on shipped orders.
- [ ] Step 4: Run `go test -v ./internal/handler/... -run TestOrder`.
- [ ] Step 5: Enhance `OrderTracking.tsx` to display:
  - Courier badge & formatted Tracking Resi.
  - "Salin Resi" copy button with copied tooltip.
  - Detailed milestone explanations for each progress step.
- [ ] Step 6: Connect `OrderTracking` in `OrderStatusPage.tsx` and `OrderHistoryPage.tsx`.
- [ ] Step 7: Verify frontend build (`npm run build`).
- [ ] Step 8: Commit with message: `feat(tracking): add copyable tracking resi and milestone logistics timeline`

---

### Verification and Final Gate
- [ ] Run full backend test suite: `cd backend && go test ./...`
- [ ] Run backend binary build: `cd backend && go build ./cmd/api`
- [ ] Run frontend linter & build: `cd frontend && npm run build`
- [ ] Check git status and perform whole-branch review
