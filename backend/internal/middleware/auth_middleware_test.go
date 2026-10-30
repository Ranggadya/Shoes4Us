package middleware_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/ranggadya/shoes4us/backend/internal/middleware"
	"github.com/ranggadya/shoes4us/backend/pkg/response"
	"github.com/ranggadya/shoes4us/backend/pkg/token"
)

func TestAuthMiddleware_RequireAuth_BearerAndCookie(t *testing.T) {
	jwtMgr := token.NewJWTManager("test-secret-key", 24)
	signed, err := jwtMgr.Sign(token.UserClaims{
		UserID: "user-123",
		Email:  "budi@shoes4us.com",
		Name:   "Budi Santoso",
		Role:   "USER",
	})
	if err != nil {
		t.Fatalf("failed to sign test token: %v", err)
	}

	protected := middleware.RequireAuth(jwtMgr)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := middleware.ClaimsFromContext(r.Context())
		if !ok || claims == nil {
			t.Fatalf("expected claims in context")
		}
		response.WriteSuccess(w, http.StatusOK, "OK", claims, nil)
	}))

	t.Run("extracts token from Authorization Bearer header", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
		req.Header.Set("Authorization", "Bearer "+signed)
		rec := httptest.NewRecorder()

		protected.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", rec.Code, rec.Body.String())
		}
		var env struct {
			Success bool             `json:"success"`
			Data    token.UserClaims `json:"data"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &env); err != nil {
			t.Fatalf("failed to unmarshal response: %v", err)
		}
		if !env.Success || env.Data.UserID != "user-123" || env.Data.Email != "budi@shoes4us.com" {
			t.Fatalf("unexpected claims payload: %+v", env)
		}
	})

	t.Run("falls back to token cookie when Authorization header is absent", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
		req.AddCookie(&http.Cookie{Name: "token", Value: signed})
		rec := httptest.NewRecorder()

		protected.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK from cookie token, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

func TestAuthMiddleware_RequireAuth_MissingOrInvalid(t *testing.T) {
	jwtMgr := token.NewJWTManager("test-secret-key", 24)
	protected := middleware.RequireAuth(jwtMgr)(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	t.Run("missing token returns 401", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
		rec := httptest.NewRecorder()

		protected.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 Unauthorized, got %d", rec.Code)
		}
		var env response.Envelope
		if err := json.Unmarshal(rec.Body.Bytes(), &env); err != nil {
			t.Fatalf("failed to decode error envelope: %v", err)
		}
		if env.Success || env.Error == nil || env.Error.Code != "UNAUTHORIZED" {
			t.Fatalf("expected UNAUTHORIZED envelope, got %+v", env)
		}
	})

	t.Run("invalid token returns 401", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
		req.Header.Set("Authorization", "Bearer invalid.jwt.token")
		rec := httptest.NewRecorder()

		protected.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 Unauthorized, got %d", rec.Code)
		}
	})
}

func TestAuthMiddleware_RequireAdmin(t *testing.T) {
	adminProtected := middleware.RequireAdmin(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		response.WriteSuccess(w, http.StatusOK, "Admin OK", nil, nil)
	}))

	t.Run("allows ADMIN role", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/admin", nil)
		ctx := middleware.ContextWithClaims(req.Context(), &token.UserClaims{
			UserID: "admin-1",
			Email:  "admin@shoes4us.com",
			Role:   "ADMIN",
		})
		rec := httptest.NewRecorder()

		adminProtected.ServeHTTP(rec, req.WithContext(ctx))

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK for ADMIN, got %d", rec.Code)
		}
	})

	t.Run("rejects USER role with 403 Forbidden", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/admin", nil)
		ctx := middleware.ContextWithClaims(req.Context(), &token.UserClaims{
			UserID: "user-1",
			Email:  "user@shoes4us.com",
			Role:   "USER",
		})
		rec := httptest.NewRecorder()

		adminProtected.ServeHTTP(rec, req.WithContext(ctx))

		if rec.Code != http.StatusForbidden {
			t.Fatalf("expected 403 Forbidden for USER, got %d", rec.Code)
		}
		var env response.Envelope
		if err := json.Unmarshal(rec.Body.Bytes(), &env); err != nil {
			t.Fatalf("failed to decode envelope: %v", err)
		}
		if env.Success || env.Error == nil || env.Error.Code != "FORBIDDEN" {
			t.Fatalf("expected FORBIDDEN error envelope, got %+v", env)
		}
	})

	t.Run("rejects unauthenticated request with 401 Unauthorized", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/admin", nil)
		rec := httptest.NewRecorder()

		adminProtected.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 Unauthorized when claims missing, got %d", rec.Code)
		}
	})
}
