# Backend Hardening and Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 4 critical & important backend optimizations discovered during code review: deadlock prevention on multi-item checkout, HTTPS dynamic secure cookies, request timeout/tracing middleware, and GIN trigram search indexing.

**Architecture:** Layered clean architecture enhancements in Go (`internal/repository`, `internal/handler`, and `internal/middleware`), preserving existing API contracts and verified with automated Go tests.

**Tech Stack:** Go 1.24+, Chi v5 router (`chimw`), PostgreSQL `pgx/v5`, `pgxpool`.

**Spec:** Code review findings from `2026-11-01` (`requesting-code-review`).

## Global Constraints
- Zero breaking changes to existing REST API contracts or frontend payloads.
- All unit and integration tests must pass cleanly (`go test ./...`).
- Git commits must follow Conventional Commits formatting.

---

## File Structure

- `backend/internal/repository/order_repository.go`: Add deterministic sorting for order items before stock deduction.
- `backend/internal/repository/order_repository_test.go`: Unit test verifying item sorting and deadlock-free ordering.
- `backend/internal/handler/auth_handler.go`: Add dynamic `Secure: true` cookie support for HTTPS/Production environments.
- `backend/internal/handler/auth_handler_test.go`: Unit tests verifying cookie attributes under HTTP and HTTPS/Forwarded headers.
- `backend/internal/handler/router.go`: Mount `chimw.RequestID` and `chimw.Timeout(30 * time.Second)`.
- `backend/internal/handler/router_test.go`: Verify `X-Request-Id` header propagation and route availability.
- `backend/internal/repository/product_repository.go`: Update product search clause to use `ILIKE` for GIN trigram optimization.

---

### Task 1: Deadlock Prevention in Multi-Item Checkout

**Files:**
- Modify: `backend/internal/repository/order_repository.go`
- Create/Modify: `backend/internal/repository/order_repository_test.go`

**Context:**
During checkout of multi-item carts, items are processed in arbitrary cart order. Concurrent transactions with inverted orders (`[A, B]` vs `[B, A]`) can trigger PostgreSQL `40P01` deadlock. Sorting items by `ProductID` and `Size` before the SQL deduction loop ensures a globally deterministic lock acquisition order.

- [x] Step 1: Write a unit test in `order_repository_test.go` verifying the deterministic sorting helper (`sortOrderItemsForDeduction`).
- [x] Step 2: Implement `sortOrderItemsForDeduction` in `order_repository.go` and sort `items` before entering `for _, item := range sortedItems`.
- [x] Step 3: Run `go test -v ./internal/repository/...` and confirm tests pass.
- [x] Step 4: Commit with message: `fix(order): prevent multi-item checkout deadlocks with deterministic item sorting`

---

### Task 2: Dynamic Cookie `Secure` Flag for HTTPS & Production

**Files:**
- Modify: `backend/internal/handler/auth_handler.go`
- Modify: `backend/internal/handler/auth_handler_test.go`

**Context:**
Currently `setAuthCookie` omits the `Secure` flag. In local development (HTTP `localhost`), `Secure: false` is required, but in production (HTTPS or behind reverse proxy with `X-Forwarded-Proto: https`), `Secure: true` is mandated by OWASP and browser cookie security policies.

- [x] Step 1: Update `setAuthCookie` signature to accept `*http.Request` or check request properties (`r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https" || os.Getenv("ENVIRONMENT") == "production"`).
- [x] Step 2: Update all `setAuthCookie` call sites in `auth_handler.go` (`Login`, `Register`).
- [x] Step 3: Add unit tests in `auth_handler_test.go` verifying that `Secure: true` is set when `X-Forwarded-Proto: https` is present, and `Secure: false` on plain HTTP.
- [x] Step 4: Run `go test -v ./internal/handler/... -run TestAuth` and confirm tests pass.
- [x] Step 5: Commit with message: `fix(auth): add dynamic secure cookie flag for HTTPS and production environments`

---

### Task 3: Request Timeout and Request ID Middleware

**Files:**
- Modify: `backend/internal/handler/router.go`
- Modify: `backend/internal/handler/router_test.go`

**Context:**
To prevent goroutine hangs from stalled HTTP clients and enable distributed request tracing in logs, the Chi router should mount `chimw.RequestID` and `chimw.Timeout(30 * time.Second)`.

- [x] Step 1: Add `chimw.RequestID` and `chimw.Timeout(30 * time.Second)` to `NewRouter` in `router.go`.
- [x] Step 2: Add or update test in `router_test.go` to assert that responses include the `X-Request-Id` header.
- [x] Step 3: Run `go test -v ./internal/handler/... -run TestRouter` and confirm tests pass.
- [x] Step 4: Commit with message: `feat(api): mount RequestID and Timeout middleware on Chi router`

---

### Task 4: GIN Trigram Search Query Optimization

**Files:**
- Modify: `backend/internal/repository/product_repository.go`

**Context:**
PostgreSQL table `products` has a GIN index on `name`: `products_name_trgm_idx USING GIN ("name" gin_trgm_ops)`. Wrapping the column with `LOWER(p.name) LIKE $1` can bypass the index in older Postgres planner heuristics. Using `p.name ILIKE $1` natively taps into `gin_trgm_ops`.

- [x] Step 1: Modify `FindAll` in `product_repository.go` to use `(p.name ILIKE $%d OR COALESCE(p.description, '') ILIKE $%d OR COALESCE(p.brand, '') ILIKE $%d)` with parameter `%search%`.
- [x] Step 2: Run all backend tests: `go test -v ./...`.
- [x] Step 3: Commit with message: `perf(product): optimize search query with ILIKE for GIN trigram index`

---

### Verification and Final Gate
- [x] Run full test suite: `cd backend && go test -race ./...`
- [x] Run backend build: `cd backend && go build ./cmd/api`
- [x] Verify clean working tree with `git status`

