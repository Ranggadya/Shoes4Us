# Shoes4Us Go REST API Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade, clean-architecture Go REST API backend (`backend/`) for the Shoes4Us e-commerce platform that is 100% contract-compatible with the existing React + TypeScript frontend (`frontend/`) and PostgreSQL schema (`backend/reference/prisma/schema.prisma`).

**Architecture:** Clean Layered Architecture (`Handler → Service → Repository → PostgreSQL`) wired via explicit constructor dependency injection in `cmd/api/main.go`. Services depend on Go interfaces defined in `internal/domain` so business logic (atomic stock deduction, restock on cancel, dual FormData/JSON parsing, soft-delete fallback) is unit-tested in isolation, while handlers are contract-tested with `net/http/httptest`.

**Tech Stack:** Go `1.25+` (`module github.com/ranggadya/shoes4us/backend`), `github.com/go-chi/chi/v5`, `github.com/go-chi/cors`, `github.com/jackc/pgx/v5/pgxpool`, `github.com/golang-jwt/jwt/v5`, `golang.org/x/crypto/bcrypt`, `github.com/google/uuid`, `github.com/joho/godotenv`.

**Spec:** [`SPEC-backend.md`](../SPEC-backend.md) & [`CAPABILITY-MAP.md`](../CAPABILITY-MAP.md)

## Global Constraints

- **Module Path & Go Floor:** `module github.com/ranggadya/shoes4us/backend` targeting Go `1.25+` (`go1.25.5`).
- **Server Port & Base Path:** Default HTTP port `:8080`, all REST endpoints mounted under `/api`, static uploads under `/uploads/*`.
- **CORS Policy:** Allow origins `http://localhost:3000` and `http://localhost:5173`, methods `GET, POST, PUT, PATCH, DELETE, OPTIONS`, headers `Accept, Authorization, Content-Type, X-CSRF-Token`, `AllowCredentials: true`.
- **Uniform JSON Envelope:** Every response uses `response.Envelope`:
  - Success: `{"success": true, "message": "...", "data": <payload>, "meta": <optional_meta>}`
  - Error: `{"success": false, "message": "<msg>", "error": {"message": "<msg>", "code": "<code>"}}`
- **Dual Auth Extraction:** `RequireAuth` reads `Authorization: Bearer <token>` first and falls back to cookie `token`.
- **Database Safety:** All SQL queries in `internal/repository` MUST use positional parameters (`$1, $2, ...`). All multi-table stock/order mutations MUST run inside a `pgx.Tx` transaction.
- **Reference Preservation:** Never modify or delete files inside `backend/reference/`.
- **Quality Gate per Task:** `cd backend && go vet ./...` and `cd backend && go test -race ./...` must pass with 0 errors before every commit.

## Review Focus

1. **Multipart `FormData` with JSON-stringified `sizes` and Category Name on Admin Product Create/Update:** `AdminProductPage.tsx` and `AdminAddProductPage.tsx` send `multipart/form-data` where `sizes` is `'[{"size":"40","stock":5}]'` and `category` is a name like `"Sneakers"` rather than a UUID; handler must parse both `multipart/form-data` and `application/json`, unmarshal `sizes`, compute total `stock`, and auto-resolve or create the category by name/slug (tested in **Task 6**: `TestProductHandler_Create_MultipartFormData`).
2. **Insufficient Per-Size Stock During Atomic Checkout:** When `POST /api/orders` is called and `product_sizes.stock` for the requested `(productId, size)` is lower than the cart quantity, the service must abort and roll back the transaction with `400 Bad Request` so no partial order or stock deduction persists (tested in **Task 10**: `TestOrderService_CreateOrder_InsufficientSizeStockRollsBack`).
3. **Double-Cancel / Invalid State Restock Inflation:** Calling user cancel (`PATCH /api/orders/:id`) or admin status update (`PATCH /api/orders/:id/status` with `CANCELLED`) on an order already in `CANCELLED`, `SHIPPED`, or `DELIVERED` state must return `400 Bad Request` and never increment `product_sizes.stock` a second time (tested in **Task 10**: `TestOrderService_CancelOrder_AlreadyCancelledOrShipped` and **Task 11**: `TestOrderService_AdminUpdateStatus_RestockGuard`).
4. **Foreign Key Violation When Deleting a Product With Past Orders:** Because `order_items.productId` has no `ON DELETE CASCADE`, `DELETE /api/products/:id` on a product that has historical `order_items` must automatically fall back to soft-deleting (`is_active = false, stock = 0`) and clearing active `cart_items` instead of failing with a 500 DB constraint error (tested in **Task 6**: `TestProductService_DeleteProduct_SoftDeletesWhenOrdered`).
5. **Reset Password Dual Field (`password` vs `newPassword`) & Forgot Password Anti-Enumeration:** `ResetPasswordPage.tsx` sends `{ token, password, newPassword }`; handler must accept either field, hash the raw token with SHA-256 before lookup, and `POST /api/auth/forgot-password` for an unregistered email must still return `200 OK` without revealing user existence (tested in **Task 4**: `TestAuthHandler_ForgotAndResetPassword`).

---

## Architecture Decisions

1. **Layered Clean Architecture with Constructor DI in `cmd/api/main.go`:**
   - *Rationale*: Decouples HTTP transport (`internal/handler`), business rules (`internal/service`), and SQL persistence (`internal/repository`) via Go interfaces in `internal/domain`. Enables fast unit and contract tests without requiring a live PostgreSQL instance for every test run.
2. **`jackc/pgx/v5/pgxpool` with Explicit Parameterized SQL & Transactions (`pgx.Tx`):**
   - *Rationale*: Connects directly to the existing PostgreSQL schema defined in `backend/reference/prisma/schema.prisma` with zero ORM overhead and explicit row-level locking (`SELECT ... FOR UPDATE` / conditional `UPDATE ... WHERE stock >= $qty`) on `product_sizes` and `products`.
3. **Dual Content-Type Parser (`multipart/form-data` & `application/json`) on Admin Product Endpoints:**
   - *Rationale*: `AdminProductPage.tsx` and `AdminAddProductPage.tsx` submit `FormData` with JSON-encoded `sizes` and category names, while API tests and REST clients submit `application/json`. A unified parser in `product_handler.go` normalizes both into `domain.ProductUpsertInput`.
4. **Atomic Restock & Soft-Delete Safeguards:**
   - *Rationale*: Customer order cancellation (`PATCH /api/orders/:id`) and Admin cancellation (`PATCH /api/orders/:id/status`) atomically restore per-size and total stock once, while `DELETE /api/products/:id` automatically falls back to soft-deletion (`is_active = false, stock = 0`) when the product is referenced in historical `order_items`.

---

## Dependency Graph & Parallelization Opportunities

```text
[ Phase 1: Foundation (Tasks 1–2) ]
  go.mod + config (.env) + pgxpool DB + response/error envelope + JWT/Bcrypt pkg + Chi router
       │
       ▼
[ Phase 2: Identity & Users (Tasks 3–4) ]
  UserRepository ──→ AuthService & UserService ──→ JWT/Admin Middleware ──→ Auth & User Handlers
       │
       ▼
[ Phase 3: Catalog & Reviews (Tasks 5–7) ]
  CategoryRepo & ProductRepo (Task 5) ──┬──→ Admin Product CRUD + Soft-Delete (Task 6)
                                        ├──→ Product Reviews & Rating Summary (Task 7)
                                        ├──→ Wishlist Management (Task 9)
                                        ▼
[ Phase 4: Cart & Wishlist (Tasks 8–9) ]
  CartRepo & CartService with Per-Size Stock Validation (Task 8)
       │
       ▼
[ Phase 5: Orders, Payment & Seeder (Tasks 10–11) ]
  OrderRepo (pgx.Tx) ──→ OrderService (Task 10) ──→ Admin Status, PaymentService & Seeder (Task 11)
```

- **Must Run Sequentially:** `Task 1 → Task 2 → Task 3 → Task 5`, and `Task 8 → Task 10 → Task 11`.
- **Safe to Parallelize:**
  - `Task 4` (Forgot/Reset Password & User Profile) can run in parallel with `Task 5` once `Task 3` is complete.
  - `Task 6` (Admin Product CRUD), `Task 7` (Reviews), `Task 8` (Cart), and `Task 9` (Wishlist) are independent vertical slices once `Task 5` is complete.

---

## Risks and Mitigations

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Multipart `FormData` vs `JSON` mismatch on Admin product endpoints** | High | Unified parser in `product_handler.go` inspects `Content-Type`, parses `sizes` JSON string (`[{"size":"40","stock":5}]`), saves uploaded files to `/uploads/*`, and resolves category names to `categoryId`. |
| **Overselling / race condition on last shoe size during checkout** | High | Execute checkout inside `pgx.Tx` with `SELECT stock FROM product_sizes WHERE product_id = $1 AND size = $2 FOR UPDATE` (and conditional `WHERE stock >= $qty`); roll back immediately if any item fails. |
| **Foreign key violation (`23503`) when Admin deletes an ordered product** | Medium | Check `HasOrderHistory(ctx, productID)` in `order_items`; if true, execute soft-delete (`is_active = false, stock = 0`) and remove from active carts instead of hard `DELETE`. |
| **Double restock on repeated order cancellation** | High | Enforce state transition guards in `OrderService`: reject cancellation if status is already `CANCELLED`, `SHIPPED`, or `DELIVERED`. |

---

## File Structure

```text
backend/
├── cmd/
│   ├── api/main.go                          # HTTP server entry point, DI wiring, graceful shutdown
│   └── seed/main.go                         # Idempotent DB seeder (Admin user, categories, sample shoes)
├── internal/
│   ├── config/config.go                     # .env loader & Config struct
│   ├── database/postgres.go                 # pgxpool.Pool initializer & TxRunner helper
│   ├── domain/
│   │   ├── errors.go                        # AppError struct & constructors (BadRequest, Unauthorized, etc.)
│   │   ├── user.go                          # User, Role, Auth/User DTOs, UserRepository & Service interfaces
│   │   ├── product.go                       # Product, ProductSize, Category, ProductFilter, PaginationMeta, interfaces
│   │   ├── review.go                        # Review, ReviewSummary, ReviewRepository & Service interfaces
│   │   ├── cart.go                          # Cart, CartItem, CartTotals, CartRepository & Service interfaces
│   │   ├── wishlist.go                      # WishlistItem, WishlistRepository & Service interfaces
│   │   └── order.go                         # Order, OrderItem, OrderStatus, OrderRepository & Service interfaces
│   ├── middleware/
│   │   ├── cors_middleware.go               # CORS & request logging middleware
│   │   └── auth_middleware.go               # RequireAuth, RequireAdmin, UserClaims context helpers
│   ├── repository/
│   │   ├── user_repository.go               # PostgreSQL implementation of domain.UserRepository
│   │   ├── category_repository.go           # PostgreSQL implementation of domain.CategoryRepository
│   │   ├── product_repository.go            # PostgreSQL implementation of domain.ProductRepository
│   │   ├── review_repository.go             # PostgreSQL implementation of domain.ReviewRepository
│   │   ├── cart_repository.go               # PostgreSQL implementation of domain.CartRepository
│   │   ├── wishlist_repository.go           # PostgreSQL implementation of domain.WishlistRepository
│   │   └── order_repository.go              # PostgreSQL transactional implementation of domain.OrderRepository
│   ├── service/
│   │   ├── auth_service.go                  # Register, Login, GetMe, ForgotPassword, ResetPassword
│   │   ├── user_service.go                  # UpdateProfile, UpdatePassword, ListUsers, DeleteUser
│   │   ├── product_service.go               # ListCategories, ListProducts, GetProduct, Create/Update/DeleteProduct
│   │   ├── review_service.go                # GetProductReviews (full & summaryOnly), CreateReview
│   │   ├── cart_service.go                  # GetCart, AddItem, UpdateItemQuantity, RemoveItem, ClearCart
│   │   ├── wishlist_service.go              # GetWishlist (full & fields=ids), AddToWishlist, RemoveFromWishlist
│   │   ├── order_service.go                 # CreateOrder, ListOrders, GetOrder, CancelOrder, UpdateOrderStatus
│   │   └── payment_service.go               # ProcessPayment (marks order PAID & clears cart)
│   └── handler/
│       ├── router.go                        # Chi router mounting all /api/* routes & /uploads/* file server
│       ├── auth_handler.go                  # /api/auth/* handlers
│       ├── user_handler.go                  # /api/users/* handlers
│       ├── product_handler.go               # /api/categories & /api/products/* handlers (JSON + FormData)
│       ├── review_handler.go                # /api/reviews handlers
│       ├── cart_handler.go                  # /api/cart/* handlers
│       ├── wishlist_handler.go              # /api/wishlist/* handlers
│       └── order_handler.go                 # /api/orders/* & /api/payment handlers
└── pkg/
    ├── hash/bcrypt.go                       # HashPassword, CheckPasswordHash, HashTokenSHA256
    ├── token/jwt.go                         # Claims, SignToken, VerifyToken
    └── response/json.go                     # Envelope, WriteJSON, WriteSuccess, WriteCreated, WriteError
```

---

### Task 1: Go Module, Config, Domain Errors, and Core Utilities (`hash`, `token`, `response`)

**Files:**
- Create: `backend/go.mod`
- Create: `backend/.env.example`
- Create: `backend/internal/config/config.go`
- Create: `backend/internal/domain/errors.go`
- Create: `backend/pkg/hash/bcrypt.go`
- Create: `backend/pkg/hash/bcrypt_test.go`
- Create: `backend/pkg/token/jwt.go`
- Create: `backend/pkg/token/jwt_test.go`
- Create: `backend/pkg/response/json.go`
- Create: `backend/pkg/response/json_test.go`

**Interfaces:**
- Consumes: Standard library + `golang.org/x/crypto/bcrypt`, `github.com/golang-jwt/jwt/v5`, `github.com/joho/godotenv`.
- Produces:
  - `config.Load() (*config.Config, error)` with fields `Port`, `DatabaseURL`, `JWTSecret`, `JWTExpiresHours`, `FrontendURL`, `UploadDir`, `SMTPHost`, `SMTPPort`, `SMTPUser`, `SMTPPass`, `SMTPFrom`.
  - `domain.AppError{Status int, Code string, Message string}` and helpers `domain.NewBadRequest(msg string) *AppError`, `domain.NewUnauthorized(msg string) *AppError`, `domain.NewForbidden(msg string) *AppError`, `domain.NewNotFound(msg string) *AppError`, `domain.NewConflict(msg string) *AppError`, `domain.NewInternal(msg string) *AppError`.
  - `hash.HashPassword(password string) (string, error)`, `hash.CheckPasswordHash(password, hashed string) bool`, `hash.HashTokenSHA256(raw string) string`.
  - `token.UserClaims{UserID string, Email string, Name string, Role string}` and `token.JWTManager` with `NewJWTManager(secret string, expiryHours int) *JWTManager`, `Sign(claims UserClaims) (string, error)`, `Verify(tokenStr string) (*UserClaims, error)`.
  - `response.WriteSuccess(w http.ResponseWriter, status int, message string, data any, meta any)` and `response.WriteError(w http.ResponseWriter, err error)`.

- [ ] **Step 1: Initialize Go module and write failing utility tests**

Run `go mod init github.com/ranggadya/shoes4us/backend` in `backend/`, then create unit tests in `pkg/hash/bcrypt_test.go`, `pkg/token/jwt_test.go`, and `pkg/response/json_test.go`:

```go
// pkg/response/json_test.go
func TestWriteError_FormatsAppErrorEnvelope(t *testing.T) {
	rec := httptest.NewRecorder()
	response.WriteError(rec, domain.NewBadRequest("Ukuran sepatu wajib dipilih"))

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
	var body map[string]any
	_ = json.Unmarshal(rec.Body.Bytes(), &body)
	if body["success"] != false || body["message"] != "Ukuran sepatu wajib dipilih" {
		t.Fatalf("unexpected body: %#v", body)
	}
	errObj, ok := body["error"].(map[string]any)
	if !ok || errObj["message"] != "Ukuran sepatu wajib dipilih" {
		t.Fatalf("expected nested error.message, got %#v", body["error"])
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend ; go test -v ./pkg/...`
Expected: FAIL with missing packages/files (`domain`, `hash`, `token`, `response`).

- [ ] **Step 3: Implement `config`, `domain/errors.go`, `pkg/hash`, `pkg/token`, and `pkg/response`**

Implement the exact signatures listed in `Produces` above and run `go mod tidy` to lock dependencies.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend ; go test -v -race ./pkg/... ; go vet ./...`
Expected: PASS (`ok github.com/ranggadya/shoes4us/backend/pkg/hash`, `pkg/token`, `pkg/response`).

- [ ] **Step 5: Commit**

```bash
git add backend/go.mod backend/go.sum backend/.env.example backend/internal/config/ backend/internal/domain/errors.go backend/pkg/
git commit -m "feat(backend): initialize Go module, config loader, domain errors, and core utilities"
```

---

### Task 2: PostgreSQL Pool (`pgxpool`), CORS Middleware, Chi Router Bootstrap, and `/api/health`

**Files:**
- Create: `backend/internal/database/postgres.go`
- Create: `backend/internal/middleware/cors_middleware.go`
- Create: `backend/internal/handler/router.go`
- Create: `backend/internal/handler/router_test.go`
- Create: `backend/cmd/api/main.go`

**Interfaces:**
- Consumes: `config.Load()`, `response.WriteSuccess`.
- Produces:
  - `database.NewPostgresPool(ctx context.Context, databaseURL string) (*pgxpool.Pool, error)`
  - `middleware.NewCORSMiddleware(allowedOrigins []string) func(http.Handler) http.Handler`
  - `handler.RouterDependencies` struct & `handler.NewRouter(deps RouterDependencies) http.Handler`

- [ ] **Step 1: Write the failing router health & CORS test**

```go
// internal/handler/router_test.go
func TestRouter_HealthCheckAndCORS(t *testing.T) {
	r := handler.NewRouter(handler.RouterDependencies{
		AllowedOrigins: []string{"http://localhost:3000"},
	})
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	rec := httptest.NewRecorder()

	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:3000" {
		t.Fatalf("expected CORS origin http://localhost:3000, got %q", got)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend ; go test -v ./internal/handler -run TestRouter_HealthCheckAndCORS`
Expected: FAIL (`undefined: handler.NewRouter`).

- [ ] **Step 3: Implement `database/postgres.go`, `middleware/cors_middleware.go`, `handler/router.go`, and `cmd/api/main.go`**

Wire `GET /api/health`, static `/uploads/*` file server, and graceful `os.Interrupt`/`syscall.SIGTERM` shutdown with a 10-second timeout in `cmd/api/main.go`.

- [ ] **Step 4: Run test and build binary to verify they pass**

Run: `cd backend ; go test -v -race ./... ; go build -o bin/shoes4us-api.exe ./cmd/api`
Expected: PASS and binary compiles cleanly.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/database/ backend/internal/middleware/cors_middleware.go backend/internal/handler/router.go backend/internal/handler/router_test.go backend/cmd/api/main.go
git commit -m "feat(backend): add pgxpool connection, CORS middleware, Chi router, and health endpoint"
```

### Checkpoint 1: After Tasks 1–2 (Foundation Ready)
- [ ] All unit & handler tests pass (`cd backend ; go test -race ./...`)
- [ ] Application binary builds cleanly without errors (`cd backend ; go build ./cmd/api`)
- [ ] `GET /api/health` responds with `200 OK` and valid CORS headers

---

### Task 3: JWT Authentication (`register`, `login`, `me`) and Role Guard Middleware

**Files:**
- Create: `backend/internal/domain/user.go`
- Create: `backend/internal/middleware/auth_middleware.go`
- Create: `backend/internal/middleware/auth_middleware_test.go`
- Create: `backend/internal/repository/user_repository.go`
- Create: `backend/internal/service/auth_service.go`
- Create: `backend/internal/handler/auth_handler.go`
- Create: `backend/internal/handler/auth_handler_test.go`
- Modify: `backend/internal/handler/router.go`
- Modify: `backend/cmd/api/main.go`

**Interfaces:**
- Consumes: `token.JWTManager`, `hash.HashPassword`, `hash.CheckPasswordHash`, `domain.AppError`, `response.WriteSuccess`, `response.WriteError`.
- Produces:
  - `domain.User{ID, Email, Name, PasswordHash, Role, IsActive, CreatedAt, UpdatedAt}`
  - `domain.UserRepository` interface:
    - `Create(ctx context.Context, user *User) error`
    - `FindByEmail(ctx context.Context, email string) (*User, error)`
    - `FindByID(ctx context.Context, id string) (*User, error)`
    - `Update(ctx context.Context, user *User) error`
    - `UpdatePassword(ctx context.Context, userID, passwordHash string) error`
    - `SaveResetToken(ctx context.Context, userID, tokenHash string, expiresAt time.Time) error`
    - `FindValidResetToken(ctx context.Context, tokenHash string) (userID string, err error)`
    - `DeleteResetTokensByUser(ctx context.Context, userID string) error`
  - `domain.AuthService` interface:
    - `Register(ctx context.Context, name, email, password string) (*AuthResponse, error)`
    - `Login(ctx context.Context, email, password string) (*AuthResponse, error)`
    - `GetMe(ctx context.Context, userID string) (*User, error)`
    - `ForgotPassword(ctx context.Context, email string) error`
    - `ResetPassword(ctx context.Context, rawToken, newPassword string) error`
  - `middleware.RequireAuth(jwtMgr *token.JWTManager) func(http.Handler) http.Handler`
  - `middleware.RequireAdmin(next http.Handler) http.Handler`
  - `middleware.ClaimsFromContext(ctx context.Context) (*token.UserClaims, bool)`

- [ ] **Step 1: Write failing tests for `RequireAuth`/`RequireAdmin` and `/api/auth/register`, `/api/auth/login`, `/api/auth/me`**

```go
// internal/handler/auth_handler_test.go
func TestAuthHandler_RegisterLoginAndMe(t *testing.T) {
	// Table-driven test verifying:
	// 1. POST /api/auth/register returns 201 with { data: { user, token } } and rejects duplicate email with 409
	// 2. POST /api/auth/login returns 200 with { data: { user, token } } and rejects wrong password with 401
	// 3. GET /api/auth/me with Authorization: Bearer <token> returns 200 with { data: { user } }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend ; go test -v ./internal/middleware ./internal/handler -run "TestAuth"`
Expected: FAIL (`undefined: domain.User`, `undefined: handler.NewAuthHandler`).

- [ ] **Step 3: Implement `domain/user.go`, `middleware/auth_middleware.go`, `repository/user_repository.go`, `service/auth_service.go`, and `handler/auth_handler.go`**

Mount `/api/auth/register`, `/api/auth/login`, and protected `/api/auth/me` in `internal/handler/router.go`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend ; go test -v -race ./... ; go vet ./...`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/domain/user.go backend/internal/middleware/ backend/internal/repository/user_repository.go backend/internal/service/auth_service.go backend/internal/handler/auth_handler.go backend/internal/handler/auth_handler_test.go backend/internal/handler/router.go backend/cmd/api/main.go
git commit -m "feat(auth): implement register, login, me endpoints and JWT/Admin middleware"
```

---

### Task 4: Forgot/Reset Password and User Profile & Password Endpoints (`/api/users`)

**Files:**
- Create: `backend/internal/service/user_service.go`
- Create: `backend/internal/handler/user_handler.go`
- Create: `backend/internal/handler/user_handler_test.go`
- Modify: `backend/internal/service/auth_service.go`
- Modify: `backend/internal/handler/auth_handler.go`
- Modify: `backend/internal/handler/auth_handler_test.go`
- Modify: `backend/internal/handler/router.go`
- Modify: `backend/cmd/api/main.go`

**Interfaces:**
- Consumes: `domain.UserRepository`, `hash.HashTokenSHA256`, `hash.HashPassword`, `hash.CheckPasswordHash`, `middleware.ClaimsFromContext`.
- Produces:
  - `domain.UserService` interface:
    - `UpdateProfile(ctx context.Context, caller *token.UserClaims, targetUserID, name, email string) (*User, error)`
    - `UpdatePassword(ctx context.Context, caller *token.UserClaims, targetUserID, currentPassword, newPassword string) error`

- [ ] **Step 1: Write failing tests for forgot/reset password (Review Focus #5) and user profile/password update**

```go
// internal/handler/auth_handler_test.go
func TestAuthHandler_ForgotAndResetPassword(t *testing.T) {
	// 1. POST /api/auth/forgot-password with unknown email still returns 200 OK (anti-enumeration)
	// 2. POST /api/auth/reset-password accepts either {"token":"...", "password":"newpassword123"}
	//    or {"token":"...", "newPassword":"newpassword123"} and hashes token with SHA-256 before lookup
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend ; go test -v ./internal/handler -run "TestAuthHandler_ForgotAndResetPassword|TestUserHandler"`
Expected: FAIL.

- [ ] **Step 3: Implement `ForgotPassword`, `ResetPassword`, `service/user_service.go`, and `handler/user_handler.go`**

Support both `PATCH /api/users/:id` and `PUT /api/users/me` (plus `PATCH /api/users/:id/password`) so both `ProfilePage.tsx` and API docs work seamlessly.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend ; go test -v -race ./... ; go vet ./...`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/service/auth_service.go backend/internal/service/user_service.go backend/internal/handler/auth_handler.go backend/internal/handler/auth_handler_test.go backend/internal/handler/user_handler.go backend/internal/handler/user_handler_test.go backend/internal/handler/router.go backend/cmd/api/main.go
git commit -m "feat(users): add forgot/reset password flow and user profile/password update endpoints"
```

### Checkpoint 2: After Tasks 3–4 (Identity & Users Verified)
- [ ] All unit & handler tests pass (`cd backend ; go test -race ./...`)
- [ ] Application builds without errors (`cd backend ; go vet ./... ; go build ./cmd/api`)
- [ ] Registration, login, `/api/auth/me`, password reset, and profile updates work end-to-end

---

### Task 5: Public Product Catalog, Multi-Criteria Filtering, Product Detail, and Categories

**Files:**
- Create: `backend/internal/domain/product.go`
- Create: `backend/internal/repository/category_repository.go`
- Create: `backend/internal/repository/product_repository.go`
- Create: `backend/internal/service/product_service.go`
- Create: `backend/internal/handler/product_handler.go`
- Create: `backend/internal/handler/product_handler_test.go`
- Modify: `backend/internal/handler/router.go`
- Modify: `backend/cmd/api/main.go`

**Interfaces:**
- Consumes: `pgxpool.Pool`, `domain.AppError`, `response.WriteSuccess`.
- Produces:
  - `domain.Category{ID, Name, Slug, Description, ImageURL, IsActive}`
  - `domain.ProductSize{ID, ProductID, Size, Stock}`
  - `domain.Product{ID, Name, Slug, Description, Price, Stock, CategoryID, Brand, Segment, Audience, ImageURL, Images, Specifications, IsNewArrival, IsExclusive, IsComingSoon, IsSale, SalePrice, IsFeatured, IsActive, Category *Category, Sizes []ProductSize, CreatedAt, UpdatedAt}`
  - `domain.ProductFilter` (all query params from `ProductListPage.tsx`, `Navbar.tsx`, `GlobalSearch.tsx`, `AdminProductPage.tsx`)
  - `domain.CategoryRepository` & `domain.ProductRepository` & `domain.ProductService`

- [ ] **Step 1: Write failing tests for `GET /api/categories`, `GET /api/products` (filters + pagination), and `GET /api/products/:id`**

```go
// internal/handler/product_handler_test.go
func TestProductHandler_ListAndDetail(t *testing.T) {
	// 1. GET /api/categories returns { success: true, data: [{ id, name, slug }] }
	// 2. GET /api/products?category=Sneakers&audience=MEN&collection=sale&minPrice=100000&sortBy=price-asc
	//    parses filters accurately and returns { data: { items: [...] }, meta: { page, limit, total, totalPages } }
	// 3. GET /api/products/:id returns { data: { product: { ..., category: {...}, sizes: [...] } } }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend ; go test -v ./internal/handler -run TestProductHandler_ListAndDetail`
Expected: FAIL (`undefined: handler.NewProductHandler`).

- [ ] **Step 3: Implement `domain/product.go`, `repository/category_repository.go`, `repository/product_repository.go`, `service/product_service.go`, and `handler/product_handler.go`**

Ensure `GET /api/products/:id` matches by UUID `id` OR `slug` and always populates `category` and ordered `sizes`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend ; go test -v -race ./... ; go vet ./...`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/domain/product.go backend/internal/repository/category_repository.go backend/internal/repository/product_repository.go backend/internal/service/product_service.go backend/internal/handler/product_handler.go backend/internal/handler/product_handler_test.go backend/internal/handler/router.go backend/cmd/api/main.go
git commit -m "feat(catalog): implement categories, multi-filter product listing, and product detail endpoints"
```

---

### Task 6: Admin Product CRUD (`POST`, `PUT`, `DELETE /api/products`) with Dual `FormData`/`JSON` & Safe Soft-Delete

**Files:**
- Modify: `backend/internal/domain/product.go`
- Modify: `backend/internal/repository/category_repository.go`
- Modify: `backend/internal/repository/product_repository.go`
- Modify: `backend/internal/service/product_service.go`
- Modify: `backend/internal/handler/product_handler.go`
- Modify: `backend/internal/handler/product_handler_test.go`
- Modify: `backend/internal/handler/router.go`

**Interfaces:**
- Consumes: `middleware.RequireAuth`, `middleware.RequireAdmin`, `domain.CategoryRepository`, `domain.ProductRepository`.
- Produces:
  - `ProductService.CreateProduct(ctx context.Context, input domain.ProductUpsertInput) (*domain.Product, error)`
  - `ProductService.UpdateProduct(ctx context.Context, id string, input domain.ProductUpsertInput) (*domain.Product, error)`
  - `ProductService.DeleteProduct(ctx context.Context, id string) (softDeleted bool, err error)`

- [ ] **Step 1: Write failing tests for Multipart FormData parsing (Review Focus #1) and Soft-Delete when ordered (Review Focus #4)**

```go
// internal/handler/product_handler_test.go
func TestProductHandler_Create_MultipartFormData(t *testing.T) {
	// Sends multipart/form-data with fields:
	// name="Air Zoom Pegasus", price="1799000", category="Running",
	// sizes=`[{"size":"40","stock":3},{"size":"42","stock":5}]`
	// Asserts 201 Created, category "Running" resolved, total stock == 8, sizes length == 2
}

func TestProductService_DeleteProduct_SoftDeletesWhenOrdered(t *testing.T) {
	// When ProductRepository.HasOrderHistory(ctx, id) == true,
	// DeleteProduct calls SoftDelete(ctx, id) (is_active=false, stock=0) instead of HardDelete
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend ; go test -v ./internal/handler -run "TestProductHandler_Create_MultipartFormData|TestProductService_DeleteProduct_SoftDeletesWhenOrdered"`
Expected: FAIL.

- [ ] **Step 3: Implement dual `multipart/form-data` + `application/json` parser, file upload saver (`/uploads/*` with 5MB & MIME magic-byte check), category name auto-resolution, `product_sizes` transaction sync, and safe soft-delete**

Mount `POST /api/products`, `PUT /api/products/:id`, and `DELETE /api/products/:id` under `RequireAuth` + `RequireAdmin`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend ; go test -v -race ./... ; go vet ./...`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/domain/product.go backend/internal/repository/category_repository.go backend/internal/repository/product_repository.go backend/internal/service/product_service.go backend/internal/handler/product_handler.go backend/internal/handler/product_handler_test.go backend/internal/handler/router.go
git commit -m "feat(admin-catalog): add Admin product CRUD with FormData/JSON support and safe soft-delete"
```

---

### Task 7: Product Reviews & Rating Summary (`/api/reviews`)

**Files:**
- Create: `backend/internal/domain/review.go`
- Create: `backend/internal/repository/review_repository.go`
- Create: `backend/internal/service/review_service.go`
- Create: `backend/internal/handler/review_handler.go`
- Create: `backend/internal/handler/review_handler_test.go`
- Modify: `backend/internal/handler/router.go`
- Modify: `backend/cmd/api/main.go`

**Interfaces:**
- Consumes: `middleware.RequireAuth`, `middleware.ClaimsFromContext`.
- Produces:
  - `domain.Review{ID, ProductID, UserID, Rating, Title, Comment, CreatedAt, UpdatedAt, User *ReviewUser}`
  - `domain.ReviewSummary{AverageRating float64, Total int}`
  - `domain.ReviewService` interface:
    - `GetReviews(ctx context.Context, productID string, summaryOnly bool) ([]Review, ReviewSummary, error)`
    - `CreateReview(ctx context.Context, userID string, input CreateReviewInput) (*Review, error)`

- [ ] **Step 1: Write failing tests for `GET /api/reviews?productId=:id&summaryOnly=true`, full review list, and `POST /api/reviews`**

```go
// internal/handler/review_handler_test.go
func TestReviewHandler_SummaryOnlyAndCreate(t *testing.T) {
	// 1. GET /api/reviews?productId=p1&summaryOnly=true returns { data: { summary: { averageRating: 4.5, total: 2 } } }
	// 2. POST /api/reviews with rating=6 returns 400 Bad Request
	// 3. POST /api/reviews with rating=5, comment="Mantap!" returns 201 Created
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend ; go test -v ./internal/handler -run TestReviewHandler`
Expected: FAIL.

- [ ] **Step 3: Implement `domain/review.go`, `repository/review_repository.go`, `service/review_service.go`, and `handler/review_handler.go`**

Wire `GET /api/reviews` (public) and `POST /api/reviews` (`RequireAuth`) in `router.go`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend ; go test -v -race ./... ; go vet ./...`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/domain/review.go backend/internal/repository/review_repository.go backend/internal/service/review_service.go backend/internal/handler/review_handler.go backend/internal/handler/review_handler_test.go backend/internal/handler/router.go backend/cmd/api/main.go
git commit -m "feat(reviews): implement product reviews and rating summary endpoints"
```

### Checkpoint 3: After Tasks 5–7 (Catalog, Admin CRUD & Reviews Verified)
- [ ] All unit & handler tests pass (`cd backend ; go test -race ./...`)
- [ ] Product catalog filtering, detail sizes, Admin `FormData` CRUD, safe soft-delete, and reviews work end-to-end

---

### Task 8: Shopping Cart Management with Per-Size Stock Validation (`/api/cart`)

**Files:**
- Create: `backend/internal/domain/cart.go`
- Create: `backend/internal/repository/cart_repository.go`
- Create: `backend/internal/service/cart_service.go`
- Create: `backend/internal/handler/cart_handler.go`
- Create: `backend/internal/handler/cart_handler_test.go`
- Modify: `backend/internal/handler/router.go`
- Modify: `backend/cmd/api/main.go`

**Interfaces:**
- Consumes: `domain.ProductRepository`, `middleware.RequireAuth`, `middleware.ClaimsFromContext`.
- Produces:
  - `domain.Cart{ID, Items []CartItem, Totals CartTotals}`
  - `domain.CartService` interface:
    - `GetCart(ctx context.Context, userID string) (*Cart, error)`
    - `AddItem(ctx context.Context, userID, productID, size string, quantity int) (*Cart, error)`
    - `UpdateItemQuantity(ctx context.Context, userID, itemID string, quantity int) (*Cart, error)`
    - `RemoveItem(ctx context.Context, userID, itemID string) (*Cart, error)`
    - `ClearCart(ctx context.Context, userID string) (*Cart, error)`

- [ ] **Step 1: Write failing tests for cart operations and per-size stock validation**

```go
// internal/handler/cart_handler_test.go
func TestCartHandler_AddUpdateAndStockValidation(t *testing.T) {
	// 1. POST /api/cart with size="42", quantity=2 succeeds when size 42 stock >= 2
	// 2. POST /api/cart with quantity exceeding size 42 stock returns 400 Bad Request
	// 3. Both PATCH /api/cart/:itemId and PUT /api/cart/:itemId update item quantity and recalculate totals
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend ; go test -v ./internal/handler -run TestCartHandler`
Expected: FAIL.

- [ ] **Step 3: Implement `domain/cart.go`, `repository/cart_repository.go`, `service/cart_service.go`, and `handler/cart_handler.go`**

Register `GET /api/cart`, `POST /api/cart`, `PATCH /api/cart/{itemId}`, `PUT /api/cart/{itemId}`, `DELETE /api/cart/{itemId}`, and `DELETE /api/cart` in `router.go`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend ; go test -v -race ./... ; go vet ./...`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/domain/cart.go backend/internal/repository/cart_repository.go backend/internal/service/cart_service.go backend/internal/handler/cart_handler.go backend/internal/handler/cart_handler_test.go backend/internal/handler/router.go backend/cmd/api/main.go
git commit -m "feat(cart): implement per-size stock validated shopping cart endpoints"
```

---

### Task 9: User Wishlist Endpoints (`/api/wishlist` with `?fields=ids` Support)

**Files:**
- Create: `backend/internal/domain/wishlist.go`
- Create: `backend/internal/repository/wishlist_repository.go`
- Create: `backend/internal/service/wishlist_service.go`
- Create: `backend/internal/handler/wishlist_handler.go`
- Create: `backend/internal/handler/wishlist_handler_test.go`
- Modify: `backend/internal/handler/router.go`
- Modify: `backend/cmd/api/main.go`

**Interfaces:**
- Consumes: `middleware.RequireAuth`, `middleware.ClaimsFromContext`.
- Produces:
  - `domain.WishlistItem{ID, ProductID, CreatedAt, Product *Product}`
  - `domain.WishlistService` interface:
    - `GetWishlist(ctx context.Context, userID string, idsOnly bool) (any, error)`
    - `Add(ctx context.Context, userID, productID string) error`
    - `Remove(ctx context.Context, userID, productID string) error`

- [ ] **Step 1: Write failing tests for `GET /api/wishlist?fields=ids`, full wishlist, add, and remove**

```go
// internal/handler/wishlist_handler_test.go
func TestWishlistHandler_FieldsIDsAndFullList(t *testing.T) {
	// 1. GET /api/wishlist?fields=ids returns { data: { items: [{ productId: "p1" }] } }
	// 2. GET /api/wishlist returns { data: { items: [{ id, productId, product: { name, price, category } }] } }
	// 3. POST /api/wishlist and DELETE /api/wishlist/:productId return 200/201
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend ; go test -v ./internal/handler -run TestWishlistHandler`
Expected: FAIL.

- [ ] **Step 3: Implement `domain/wishlist.go`, `repository/wishlist_repository.go`, `service/wishlist_service.go`, and `handler/wishlist_handler.go`**

Mount `/api/wishlist` routes under `RequireAuth` in `router.go`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend ; go test -v -race ./... ; go vet ./...`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/domain/wishlist.go backend/internal/repository/wishlist_repository.go backend/internal/service/wishlist_service.go backend/internal/handler/wishlist_handler.go backend/internal/handler/wishlist_handler_test.go backend/internal/handler/router.go backend/cmd/api/main.go
git commit -m "feat(wishlist): implement wishlist endpoints with fields=ids fast mode"
```

### Checkpoint 4: After Tasks 8–9 (Cart & Wishlist Verified)
- [ ] All unit & handler tests pass (`cd backend ; go test -race ./...`)
- [ ] Per-size cart operations (`POST`, `PATCH`, `PUT`, `DELETE`) and wishlist (`?fields=ids` & full list) work end-to-end

---

### Task 10: Atomic Order Checkout, Order Listing/Detail, and Customer Cancellation with Restock (`/api/orders`)

**Files:**
- Create: `backend/internal/domain/order.go`
- Create: `backend/internal/repository/order_repository.go`
- Create: `backend/internal/service/order_service.go`
- Create: `backend/internal/handler/order_handler.go`
- Create: `backend/internal/handler/order_handler_test.go`
- Modify: `backend/internal/handler/router.go`
- Modify: `backend/cmd/api/main.go`

**Interfaces:**
- Consumes: `domain.CartRepository`, `domain.ProductRepository`, `middleware.RequireAuth`, `middleware.ClaimsFromContext`.
- Produces:
  - `domain.OrderStatus` constants: `StatusPending = "PENDING"`, `StatusPaid = "PAID"`, `StatusProcessing = "PROCESSING"`, `StatusShipped = "SHIPPED"`, `StatusDelivered = "DELIVERED"`, `StatusCancelled = "CANCELLED"`
  - `domain.Order{ID, OrderNumber, UserID, TotalAmount, Status, ShippingAddress, ShippingCity, ShippingPostalCode, ShippingPhone, PaymentMethod, Notes, Items []OrderItem, User *OrderUserSummary, CreatedAt, UpdatedAt}`
  - `domain.OrderService` interface:
    - `CreateOrder(ctx context.Context, userID string, input CreateOrderInput) (*Order, error)`
    - `ListOrders(ctx context.Context, caller *token.UserClaims, scope string) ([]Order, error)`
    - `GetOrder(ctx context.Context, caller *token.UserClaims, orderID string) (*Order, error)`
    - `CancelOrder(ctx context.Context, caller *token.UserClaims, orderID string) (*Order, error)`
    - `UpdateOrderStatus(ctx context.Context, orderID string, newStatus OrderStatus) (*Order, error)`

- [ ] **Step 1: Write failing tests for atomic checkout stock rollback (Review Focus #2) and double-cancel restock guard (Review Focus #3)**

```go
// internal/handler/order_handler_test.go
func TestOrderService_CreateOrder_InsufficientSizeStockRollsBack(t *testing.T) {
	// Cart has 3 units of size "42", but product_sizes has only 1 left.
	// Asserts CreateOrder returns 400 Bad Request and repository rollback is invoked.
}

func TestOrderService_CancelOrder_AlreadyCancelledOrShipped(t *testing.T) {
	// Calling PATCH /api/orders/:id when status is already CANCELLED or SHIPPED
	// returns 400 Bad Request and does NOT call RestockOrderItems.
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend ; go test -v ./internal/handler -run "TestOrderService_"`
Expected: FAIL.

- [ ] **Step 3: Implement `domain/order.go`, transactional `repository/order_repository.go` (`SELECT ... FOR UPDATE` on `product_sizes` and `products`), `service/order_service.go`, and `handler/order_handler.go`**

Mount `POST /api/orders`, `GET /api/orders`, `GET /api/orders/{orderId}`, and `PATCH /api/orders/{orderId}` in `router.go`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend ; go test -v -race ./... ; go vet ./...`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/domain/order.go backend/internal/repository/order_repository.go backend/internal/service/order_service.go backend/internal/handler/order_handler.go backend/internal/handler/order_handler_test.go backend/internal/handler/router.go backend/cmd/api/main.go
git commit -m "feat(orders): implement atomic order checkout, order history, and customer cancel with restock"
```

---

### Task 11: Admin Order Status Update (`PATCH /api/orders/:id/status`), Payment Confirmation (`POST /api/payment`), DB Seeder, and Monorepo Scripts

**Files:**
- Create: `backend/internal/service/payment_service.go`
- Create: `backend/cmd/seed/main.go`
- Modify: `backend/internal/service/order_service.go`
- Modify: `backend/internal/handler/order_handler.go`
- Modify: `backend/internal/handler/order_handler_test.go`
- Modify: `backend/internal/handler/router.go`
- Modify: `backend/cmd/api/main.go`
- Modify: `package.json`

**Interfaces:**
- Consumes: `domain.OrderRepository`, `domain.CartRepository`, `middleware.RequireAdmin`.
- Produces:
  - `domain.PaymentService` interface:
    - `ProcessPayment(ctx context.Context, caller *token.UserClaims, orderID string) (*PaymentResult, error)`
  - CLI Seeder: `go run ./cmd/seed` (idempotently seeds Admin `admin@shoes4us.com`, Customer `user@shoes4us.com`, categories, and initial shoe catalog with sizes `38`–`45`).

- [ ] **Step 1: Write failing tests for Admin status transition & restock guard (Review Focus #3) and `POST /api/payment`**

```go
// internal/handler/order_handler_test.go
func TestOrderService_AdminUpdateStatus_RestockGuard(t *testing.T) {
	// 1. Admin PATCH /api/orders/:id/status with {"status":"PAID"} updates status to PAID
	// 2. Admin PATCH /api/orders/:id/status with {"status":"CANCELLED"} restores size stock once
	// 3. Repeating {"status":"CANCELLED"} on a CANCELLED order returns 400 and never double-restocks
}

func TestOrderHandler_ProcessPayment_MarksPaidAndClearsCart(t *testing.T) {
	// POST /api/payment with {"orderId":"ord-1"} marks order PAID, clears user's cart, and returns 200 OK
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend ; go test -v ./internal/handler -run "TestOrderService_AdminUpdateStatus_RestockGuard|TestOrderHandler_ProcessPayment"`
Expected: FAIL.

- [ ] **Step 3: Implement `UpdateOrderStatus`, `service/payment_service.go`, `cmd/seed/main.go`, and update root `package.json` scripts (`dev:be`, `build:be`, `seed:be`, `test:be`)**

Mount `PATCH /api/orders/{orderId}/status` (with `RequireAdmin`) and `POST /api/payment` (with `RequireAuth`) in `router.go`.

- [ ] **Step 4: Run full test suite, race detector, static analysis, and build both binaries**

Run: `cd backend ; go test -v -race ./... ; go vet ./... ; go build -o bin/shoes4us-api.exe ./cmd/api ; go build -o bin/shoes4us-seed.exe ./cmd/seed`
Expected: PASS with 0 errors and 0 warnings.

- [ ] **Step 5: Commit**

```bash
git add backend/ package.json
git commit -m "feat(payment,seed): add admin status update, payment confirmation, DB seeder, and monorepo scripts"
```

### Checkpoint 5: After Tasks 10–11 (Complete End-to-End Verification)
- [ ] All unit & handler tests pass (`cd backend ; go test -v -race ./...`)
- [ ] `go vet ./...`, `go build ./cmd/api`, and `go build ./cmd/seed` succeed with 0 errors and 0 warnings
- [ ] Atomic checkout, customer order cancel restock, Admin status update, and payment flow work end-to-end with React frontend
- [ ] Ready for final review

